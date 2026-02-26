# agents/base.py

from livekit.agents import (
    Agent,
    function_tool,
)
from livekit import rtc

import asyncio
import json

from src.logger_config import agent_flow  # Centralized logging
from src.dataclass import UserData, RunContext_T
from src.fn import summarize_agent_handoff


class BaseAgent(Agent):
    # Override in subclasses to scope the context summary to a specific form.
    # e.g. _context_form_id = BOOKING_FORM_ID
    # None means full summarize() is used.
    _context_form_id: str | None = None

    # Maps frontend page IDs (matchingPage.id from constants.ts PAGES) → agent keys in userdata.agents.
    # Override in subclasses to customise routing. Empty dict disables auto-switching.
    PAGE_AGENT_MAP: dict[str, str] = {
        "booking": "reservation",
        "order":   "order_food",
        "home":    "greeter",
    }

    async def on_enter(self) -> None:
        agent_name = self.__class__.__name__
        agent_flow.info(f"🚀 ENTERING AGENT: {agent_name}")

        # Store references used by the sync callback so self.session is never
        # accessed after this agent has exited (avoids "no activity context" error)
        self._userdata: UserData = self.session.userdata
        self._room = self.session.userdata.job_ctx.room
        self._room.on("data_received", self._on_data_received)

        # Silence watchdog: if agent goes silent for too long, say a fallback
        self._silence_watchdog_task: asyncio.Task | None = None
        self.session.on("agent_state_changed", self._on_agent_state_changed)
        
        userdata: UserData = self.session.userdata
        chat_ctx = self.chat_ctx.copy()

        # Add previous agent's context
        if isinstance(userdata.prev_agent, Agent):
            summarized_ctx = await summarize_agent_handoff(
                previous_agent_chat_ctx=userdata.prev_agent.chat_ctx,
                current_agent_chat_ctx=chat_ctx,
                llm_v=self.session.llm,  
            )
            chat_ctx = summarized_ctx


        data_summary = (
            userdata.summarize_form(self._context_form_id)
            if self._context_form_id
            else userdata.summarize()
        )
        chat_ctx.add_message(
            role="system",
            content=f"Current saved user data in Database is:\n{data_summary}"
        )

        # If this agent was activated by a page navigation, inject that trigger as context
        page_trigger = userdata.get_meta("page_switch_trigger")
        if page_trigger:
            chat_ctx.add_message(
                role="system",
                content=(
                    f"The user just navigated to the '{page_trigger}' page. "
                    f"You have been automatically activated because this page is your responsibility. "
                    f"Greet the user briefly and offer your assistance relevant to this page."
                )
            )
            userdata.update_meta({"page_switch_trigger": None})

        await self.update_chat_ctx(chat_ctx)
        await self.session.generate_reply()
        
    def _on_data_received(self, packet: rtc.DataPacket):
        if packet.topic != "ui-to-agent":
            return  # Ignore messages not meant for the agent

        msg = json.loads(packet.data.decode())
        msg_type = msg.get("type")
        payload = msg.get("payload", {})
        agent_flow.info(f"📥 UI→Agent: type={msg_type} payload={payload}")

        if msg_type in ("FORM_UPDATE", "FORM_SUBMITTED"):
            form_id = payload.get("formId")
            values = payload.get("values", {})
            if form_id and values:
                self._userdata.apply_form_update(form_id, values)
                agent_flow.info(f"✅ Form updated: {form_id} → {values}")
                self._queue_llm_update(f"User updated form '{form_id}' with values: {values}")

        elif msg_type == "SESSION_SYNC":
            # Fired once when agent first joins — full UI state snapshot
            page = payload.get("page")
            forms = payload.get("forms", {})

            # Save all pre-filled form data into UserData
            for form_id, values in forms.items():
                if values:
                    self._userdata.apply_form_update(form_id, values)

            if page:
                self._userdata.update_meta({"current_page": page})

            agent_flow.info(f"✅ Session sync: page={page}, forms={list(forms.keys())}")

            # Switch to the right agent for the current page (same logic as PAGE_CHANGED)
            target_name = self.PAGE_AGENT_MAP.get(page) if page else None
            current_agent = self.session.current_agent
            target_agent = self._userdata.agents.get(target_name) if target_name else None

            if target_agent is not None and target_agent is not current_agent:
                agent_flow.info(f"🔀 SESSION_SYNC: switching to '{target_name}' for page: {page}")
                try:
                    loop = asyncio.get_running_loop()
                    loop.create_task(self._switch_agent_for_page(target_name, page))
                except RuntimeError:
                    pass
            else:
                # Same agent — queue update so it greets with context
                update_parts = []
                if page:
                    update_parts.append(f"User is on the '{page}' page")
                if forms:
                    update_parts.append(f"User had already filled in: {forms}")
                if update_parts:
                    self._queue_llm_update(". ".join(update_parts))

        elif msg_type == "PAGE_CHANGED":
            page = payload.get("page")
            if page:
                self._userdata.update_meta({"current_page": page})
                agent_flow.info(f"✅ Page changed: {page}")
                target_name = self.PAGE_AGENT_MAP.get(page)
                current_agent = self.session.current_agent
                target_agent = self._userdata.agents.get(target_name) if target_name else None
                if target_agent is not None and target_agent is not current_agent:
                    agent_flow.info(f"🔀 Auto-switching to '{target_name}' agent for page: {page}")
                    try:
                        loop = asyncio.get_running_loop()
                        loop.create_task(self._switch_agent_for_page(target_name, page))
                    except RuntimeError:
                        pass
                else:
                    self._queue_llm_update(f"User navigated to page: {page}")

    def _queue_llm_update(self, update_text: str):
        """Collect UI updates and debounce LLM reply so rapid messages are batched."""
        if not hasattr(self, "_pending_updates"):
            self._pending_updates: list[str] = []
        self._pending_updates.append(update_text)

        # Cancel any existing debounce task and restart the timer
        if hasattr(self, "_debounce_task") and self._debounce_task and not self._debounce_task.done():
            self._debounce_task.cancel()

        try:
            loop = asyncio.get_running_loop()
            self._debounce_task = loop.create_task(self._debounced_reply())
        except RuntimeError:
            agent_flow.warning("⚠️ No running event loop for debounce task")

    async def _debounced_reply(self, delay: float = 1.0):
        """Wait for rapid UI messages to settle, then inject all updates into context and reply."""
        await asyncio.sleep(delay)

        if not getattr(self, "_pending_updates", None):
            return

        updates = self._pending_updates.copy()
        self._pending_updates.clear()

        update_summary = "\n".join(f"- {u}" for u in updates)
        chat_ctx = self.chat_ctx.copy()
        chat_ctx.add_message(
            role="user",
            content=f"[UI Updates]\n{update_summary}",
        )
        await self.update_chat_ctx(chat_ctx)

        try:
            # Interrupt any currently running speech/generation before starting fresh
            # if self.session.current_speech is not None:
            #     agent_flow.info("⛔ Interrupting current speech for UI update...")
            await self.session.interrupt(force=True)

            agent_flow.info(f"🤖 Triggering LLM reply after {len(updates)} UI update(s): {updates}")
            await self.session.generate_reply()
        except RuntimeError as e:
            agent_flow.warning(f"⚠️ Skipping generate_reply — agent no longer active: {e}")

    def _on_agent_state_changed(self, ev) -> None:
        """Watch for thinking→silence timeout and speaking (cancel watchdog)."""
        new_state = ev.new_state
        if new_state == "thinking":
            # Agent started processing — start / reset the silence watchdog
            self._reset_silence_watchdog()
        elif new_state == "speaking":
            # Agent is speaking — cancel watchdog, no need for fallback
            self._cancel_silence_watchdog()

    def _reset_silence_watchdog(self, timeout: float = 5.0) -> None:
        self._cancel_silence_watchdog()
        try:
            loop = asyncio.get_running_loop()
            self._silence_watchdog_task = loop.create_task(self._silence_watchdog(timeout))
        except RuntimeError:
            pass

    def _cancel_silence_watchdog(self) -> None:
        task = getattr(self, "_silence_watchdog_task", None)
        if task and not task.done():
            task.cancel()
        self._silence_watchdog_task = None

    async def _silence_watchdog(self, timeout: float) -> None:
        """If no speech starts within `timeout` seconds, say a fallback message."""
        await asyncio.sleep(timeout)
        try:
            agent_flow.warning(f"🔇 Silence watchdog fired after {timeout}s — sending fallback reply")
            await self.session.say("I'm sorry, I'm having trouble forming a response. Could you please repeat that?")
        except RuntimeError as e:
            agent_flow.warning(f"⚠️ Silence watchdog: session no longer active: {e}")

    async def _switch_agent_for_page(self, agent_name: str, page: str | None = None) -> None:
        """Switch to a different agent triggered by a page navigation event."""
        try:
            userdata = self._userdata
            next_agent = userdata.agents.get(agent_name)
            if next_agent is None:
                agent_flow.warning(f"⚠️ No agent found for name: {agent_name}")
                return

            # Cancel pending debounce so it doesn't fire on the outgoing agent
            if hasattr(self, "_debounce_task") and self._debounce_task and not self._debounce_task.done():
                self._debounce_task.cancel()

            # Cancel silence watchdog so it doesn't fire on the outgoing agent
            self._cancel_silence_watchdog()

            userdata.prev_agent = self.session.current_agent
            if page:
                userdata.update_meta({"page_switch_trigger": page})

            # Force-interrupt any ongoing speech/generation
            await self.session.interrupt(force=True)

            # Yield to let the interrupt fully propagate through the TTS/audio pipeline
            await asyncio.sleep(0.1)

            self.session.update_agent(next_agent)
            agent_flow.info(f"✅ Agent switched to: {agent_name}")
        except RuntimeError as e:
            agent_flow.warning(f"⚠️ Agent switch failed: {e}")

    async def _transfer_to_agent(self, name: str, context: RunContext_T) -> tuple[Agent, str]:
        userdata = context.userdata
        current_agent = context.session.current_agent
        next_agent = userdata.agents[name]
        userdata.prev_agent = current_agent
        return next_agent, f"Transferring to {name}."
    
    async def _save_details_to_file(self, context: RunContext_T) -> None:
        """Save details to file in background without blocking."""
        userdata = context.userdata
        details_summary = userdata.summarize()
        filename = "reservation_details.yaml"
        
        def write_file():
            with open(filename, "w") as file:
                file.write(details_summary)
        
        # Run file I/O in thread pool to avoid blocking
        await asyncio.to_thread(write_file)
        
    def _token_usage(self) -> dict:
        """Get current token usage summary from the session."""
        userdata: UserData = self.session.userdata
        
        if not hasattr(userdata, 'usage_collector') or userdata.usage_collector is None:
            agent_flow.warning("⚠️ Usage collector not initialized")
            return {
                "llm_prompt_tokens": 0,
                "llm_completion_tokens": 0,
                "total_tokens": 0,
                "tts_characters": 0,
                "stt_duration": 0.0
            }
            
        summary = userdata.usage_collector.get_summary()
        
        return {
            "llm_prompt_tokens": summary.llm_prompt_tokens,
            "llm_completion_tokens": summary.llm_completion_tokens,
            "total_tokens": summary.llm_prompt_tokens + summary.llm_completion_tokens,
            "tts_characters": summary.tts_characters_count,
            "stt_duration": summary.stt_audio_duration
        }
    
    async def on_exit(self) -> None:
        """Called when leaving this agent"""
        agent_name = self.__class__.__name__

        # Cancel any pending debounce task
        if hasattr(self, "_debounce_task") and self._debounce_task and not self._debounce_task.done():
            self._debounce_task.cancel()

        # Cancel silence watchdog
        self._cancel_silence_watchdog()

        # Unregister the data listener so stale agents don't crash on room events
        if hasattr(self, "_room") and self._room is not None:
            self._room.off("data_received", self._on_data_received)
            agent_flow.info(f"🔌 {agent_name} unregistered data_received listener")

        # Unsubscribe silence watchdog state listener
        try:
            self.session.off("agent_state_changed", self._on_agent_state_changed)
        except Exception:
            pass

        agent_flow.info(f"{agent_name} - 💠 Token Usage Summary: {self._token_usage()}")

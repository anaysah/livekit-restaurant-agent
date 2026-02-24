from livekit.agents import (
    Agent,
    function_tool,
)

from src.dataclass import RunContext_T
import asyncio


from src.logger_config import agent_flow  # Centralized logging
from src.dataclass import UserData
from src.fn import summarize_agent_handoff


class BaseAgent(Agent):
    async def on_enter(self) -> None:
        agent_name = self.__class__.__name__
        agent_flow.info(f"🚀 ENTERING AGENT: {agent_name}")

        
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


        chat_ctx.add_message(
            role="system",
            content=f"You are {agent_name} agent. Current saved user data in Database is {userdata.summarize()}"
        )
        await self.update_chat_ctx(chat_ctx)
        await self.session.generate_reply()

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
        
        agent_flow.info(f"{agent_name} - 💠 Token Usage Summary: {self._token_usage()}")

import asyncio
from curses import raw
from datetime import datetime
from typing import Annotated, Optional
from dataclasses import dataclass,field

from av.codec import context
from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    function_tool,
    room_io,
    RunContext,
    ToolError,
)
from livekit.plugins import deepgram, groq, noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from openai.types.beta.realtime import session
from pydantic import Field
from src.dataclass import UserData
from src.tasks import CollectReservationInfo
import yaml
from livekit.plugins import openai

from src.variables import COMMON_RULES, GREETER_INSTRUCTIONS, RESERVATION_INSTRUCTIONS

from src.logger_config import agent_flow  # Centralized logging

load_dotenv(".env.local")



RunContext_T = RunContext[UserData]

# Models configuration

VOICE_MODELS = {
    "thalia":"aura-2-thalia-en",
    "asteria":"aura-asteria-en",
    "andromeda":"aura-2-andromeda-en",
    "helena":"aura-2-helena-en",
    "odysseus":"aura-2-odysseus-en"
}

LLM_MODELS = [
    "llama-3.3-70b-versatile", #this works best and has tool calling also
    
    "llama-3.1-8b-instant", #itna acha kaam nahi karta as compare to 3.3 70b
    "meta-llama/llama-4-scout-17b-16e-instruct",
    
    # groq dont have TPD means no limit in a day
    # also most limit TPM of 70k
    # but tool calling is not supported so it is of no use in this agent
    "groq/compound",
    "groq/compound-mini"
    
    
]

models = {
    # "llm": groq.LLM(model="llama-3.3-70b-versatile"),
    # "llm": google.LLM(
    #     model="gemma-3-27b",
    # ),
    "llm": openai.LLM.with_cerebras(
        model="qwen-3-32b",
        temperature=0.0,
        parallel_tool_calls=False,
        tool_choice="auto",
    ),
    "tts": lambda model: deepgram.TTS(model=VOICE_MODELS[model]),
    "stt": deepgram.STT(),  # Using STT instead of STTv2
    "vad": silero.VAD.load(),
}
    
class BaseAgent(Agent):
    async def on_enter(self) -> None:
        agent_name = self.__class__.__name__
        agent_flow.info(f"🚀 ENTERING AGENT: {agent_name}")

        
        userdata: UserData = self.session.userdata
        chat_ctx = self.chat_ctx.copy()

        # Add previous agent's context
        if isinstance(userdata.prev_agent, Agent):
            truncated_chat_ctx = userdata.prev_agent.chat_ctx.copy(
                exclude_instructions=True, exclude_function_call=False
            ).truncate(max_items=6)
            existing_ids = {item.id for item in chat_ctx.items}
            items_copy = [item for item in truncated_chat_ctx.items if item.id not in existing_ids]
            chat_ctx.items.extend(items_copy)

        chat_ctx.add_message(
            role="system",
            content=f"You are {agent_name} agent. Current saved user data is {userdata.summarize()}"
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

class Greeter(BaseAgent):    
    def __init__(self) -> None:
        super().__init__(
            instructions=(
                f"""{COMMON_RULES} \n {GREETER_INSTRUCTIONS}"""
            ),
            llm=models["llm"],
            tts=models["tts"]("thalia"),
        )

    @function_tool()
    async def to_reservation(
        self,
        context: RunContext_T,
        # ADDED DUMMY ARGUMENT
        request: Annotated[str, Field(description="User request confirmation")] = "reservation",
    ) -> tuple[Agent, str]:
        """Called when user wants to make a reservation."""
        return await self._transfer_to_agent("reservation", context)

class Reservation(BaseAgent):
    def __init__(self) -> None:
        super().__init__(
            instructions=f"""{COMMON_RULES} \n {RESERVATION_INSTRUCTIONS.format(current_datetime=datetime.now().strftime("%Y-%m-%d %H:%M"))}""",
            tts=models["tts"]("odysseus"),
            llm=models["llm"],
        )
        
    async def on_enter(self) -> None:
        await super().on_enter()
        
        collect_info_task = CollectReservationInfo(chat_ctx=self.chat_ctx.copy(), tts=self.tts)
        try:
            await collect_info_task
            user_data: UserData = collect_info_task.userdata
            
            print("🤖 Collected User Data:", user_data)
            
            await self.session.generate_reply(
                instructions=f"Thank you! I've collected your information: Name - {user_data['customer_name']}, Phone - {user_data['customer_phone']}."
            )
        except Exception as e:
            await self.session.say("Sorry, there was an error collecting your information.")
            # agents.logger.error(f"Error in CollectInfoTask: {e}")
        
    @function_tool()
    async def get_todays_date_n_time(
        self, 
        context: RunContext_T,
        # ADDED DUMMY ARGUMENT
        request: Annotated[str, Field(description="Request for today's date and time")] = "today",
    ) -> str:
        """Get today's date and time for reference."""
        return datetime.now().strftime("%Y-%m-%d_%H:%M:%S")
    
server = AgentServer()

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session()
async def my_agent(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }
    
    userdata = UserData()
    userdata.agents.update({
        "greeter": Greeter(),
        "reservation": Reservation(),
    })

    # Set up a voice AI pipeline using OpenAI, Cartesia, AssemblyAI, and the LiveKit turn detector
    session = AgentSession[UserData](
        userdata=userdata,
        stt=None,
        llm=models["llm"],
        tts=models["tts"]("thalia"),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=False,
    )
    
    # async def save_transcript():
    #     import json
    #     from datetime import datetime
        
    #     # Session history nikalo
    #     # history = session.history.to_dict() # ismei sirf conversation hoti hai
    #     history = ctx.make_session_report().to_dict() # ismei listning speaking vagera event bhi hote hain
        
    #     # File mein save karo
    #     filename = f"logs/transcript_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    #     with open(filename, 'w') as f:
    #         json.dump(history, f, indent=2)
        
    #     print(f"✅ Saved: {filename}")
    
    # Callback register karo
    # ctx.add_shutdown_callback(save_transcript)
    
    # session.on("conversation_item_added", lambda event: conversation_logger.info(f"{event.item.role}: {event.item.content or ''}"))
    # @session.on("conversation_item_added")
    # def log_conversation(event):
    #     item = event.item
    #     # log full item for debugging
    #     conversation_logger.info(f"{item.role}: {item}")
    

    await session.start(
        agent=userdata.agents["greeter"],
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: noise_cancellation.BVCTelephony()
                if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                else noise_cancellation.BVC(),
            ),
        ),
    )

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(server)

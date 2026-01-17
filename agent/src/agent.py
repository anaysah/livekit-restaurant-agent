import logging
from typing import Annotated, Optional
from dataclasses import dataclass,field
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
)
from livekit.plugins import deepgram, groq, noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from pydantic import Field
import yaml

logger = logging.getLogger("agent")

load_dotenv(".env.local")

@dataclass
class UserData:
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    reservation_time: Optional[str] = None
    reservation_date: Optional[str] = None
    cuisinePreference: Optional[str] = None
    specialRequests: Optional[str] = None
    seatingPreference: Optional[str] = None
    agents: dict[str, Agent] = field(default_factory=dict)
    prev_agent: Optional[Agent] = None

    def summarize(self) -> str:
        data = {
            "customer_name": self.customer_name or "unknown",
            "customer_phone": self.customer_phone or "unknown",
            "reservation_time": self.reservation_time or "unknown",
            "reservation_date": self.reservation_date or "unknown",
            "cuisinePreference": self.cuisinePreference or "unknown",
            "specialRequests": self.specialRequests or "unknown",
            "seatingPreference": self.seatingPreference or "unknown",
        }
        return yaml.dump(data)

RunContext_T = RunContext[UserData]

# Models configuration

VOICE_MODELS = {
    "thalia":"aura-2-thalia-en",
    "asteria":"aura-asteria-en",
    "andromeda":"aura-2-andromeda-en",
    "helena":"aura-2-helena-en",
}

models = {
    "llm": groq.LLM(model="llama-3.3-70b-versatile"),
    "tts": lambda model: deepgram.TTS(model=VOICE_MODELS[model]),
    "stt": deepgram.STT(),  # Using STT instead of STTv2
    "vad": silero.VAD.load(),
}
    
class BaseAgent(Agent):
    async def on_enter(self) -> None:
        agent_name = self.__class__.__name__
        logger.info(f"entering task {agent_name}")
        
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
            content=f"You are {agent_name} agent. Current user data is {userdata.summarize()}",
        )
        await self.update_chat_ctx(chat_ctx)
        self.session.generate_reply(tool_choice="none")

    async def _transfer_to_agent(self, name: str, context: RunContext_T) -> tuple[Agent, str]:
        userdata = context.userdata
        current_agent = context.session.current_agent
        next_agent = userdata.agents[name]
        userdata.prev_agent = current_agent
        return next_agent, f"Transferring to {name}."

class Greeter(BaseAgent):
    def __init__(self) -> None:
        super().__init__(
            instructions=(
                f"You are a friendly restaurant receptionist."
                "Your jobs are to greet the caller and understand if they want to "
                "make a reservation. Guide them to the right agent using tools."
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
            instructions="You are a reservation agent at a restaurant. Your jobs are to ask for "
            "reservation details from the customer and update the userdata accordingly. "
            "Ask all unknown details one by one, and finally confirm the reservation details with the customer.",
            tools=[],
            tts=models["tts"]("asteria"),
        )

    @function_tool()
    async def update_detail(
        self,
        context: RunContext_T,
        detail_type: Annotated[str, Field(description="Type of detail to update")],
        detail_value: Annotated[str, Field(description="Value of the detail")],
    ) -> str:
        """Update reservation details in userdata."""
        if(detail_type not in context.userdata.__annotations__):
            return f"Detail type {detail_type} is not recognized."
        context.userdata[detail_type] = detail_value
        return f"Updated {detail_type} to {detail_value}."

# server = AgentServer()

# def prewarm(proc: JobProcess):
#     proc.userdata["vad"] = silero.VAD.load()


# server.setup_fnc = prewarm


# @server.rtc_session()
# async def my_agent(ctx: JobContext):
#     # Logging setup
#     # Add any other context you want in all log entries here
#     ctx.log_context_fields = {
#         "room": ctx.room.name,
#     }
    
#     userdata = UserData()
#     userdata.agents.update({
#         "greeter": Greeter(),
#         "reservation": Reservation(),
#     })

#     # Set up a voice AI pipeline using OpenAI, Cartesia, AssemblyAI, and the LiveKit turn detector
#     session = AgentSession[UserData](
#         userdata=userdata,
#         stt=models["stt"],
#         llm=models["llm"],
#         tts=models["tts"],
#         turn_detection=MultilingualModel(),
#         vad=ctx.proc.userdata["vad"],
#         preemptive_generation=True,
#     )


#     await session.start(
#         agent=userdata.agents["greeter"],
#         room=ctx.room,
#         room_options=room_io.RoomOptions(
#             audio_input=room_io.AudioInputOptions(
#                 noise_cancellation=lambda params: noise_cancellation.BVCTelephony()
#                 if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
#                 else noise_cancellation.BVC(),
#             ),
#         ),
#     )

#     # Join the room and connect to the user
#     await ctx.connect()


# if __name__ == "__main__":
#     cli.run_app(server)

from livekit.agents.worker import WorkerOptions


# Prewarm function to load VAD before jobs start
def prewarm(proc):
    """Runs once when the worker process starts."""
    proc.userdata["vad"] = silero.VAD.load()


# Main entrypoint function
async def entrypoint(ctx: JobContext):
    # Logging setup - Add any context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }
    
    # Access prewarmed VAD from process userdata
    vad = ctx.proc.userdata["vad"]
    
    userdata = UserData()
    userdata.agents.update({
        "greeter": Greeter(),
        "reservation": Reservation(),
    })

    # Set up a voice AI pipeline using OpenAI, Cartesia, AssemblyAI, and the LiveKit turn detector
    session = AgentSession[UserData](
        userdata=userdata,
        stt=models["stt"],
        llm=models["llm"],
        tts=models["tts"],
        turn_detection=MultilingualModel(),
        vad=vad,
        preemptive_generation=True,
    )

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
    cli.run_app(WorkerOptions(
        entrypoint_fnc=entrypoint,
        prewarm_fnc=prewarm,
    ))

import logging
from typing import Optional
from attr import field
from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    room_io,
    RunContext,
)
from livekit.plugins import deepgram, groq, noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from pydantic.dataclasses import dataclass
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
    "llm": groq.LLM(model="llama-3.3-70b-versatile", language="en"),
    "tts": lambda model: deepgram.TTS(model=VOICE_MODELS[model]),
    "stt": deepgram.STT(),  # Using STT instead of STTv2
    "vad": silero.VAD.load(),
}


    
class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""""",
        )
        
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

    # Set up a voice AI pipeline using OpenAI, Cartesia, AssemblyAI, and the LiveKit turn detector
    session = AgentSession(
        
        stt=models["stt"],
        llm=models["llm"],
        tts=models["tts"],
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )


    await session.start(
        agent=Assistant(),
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
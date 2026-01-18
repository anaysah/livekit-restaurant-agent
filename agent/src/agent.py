import asyncio
from datetime import datetime
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
    ToolError,
)
from livekit.plugins import deepgram, groq, noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from pydantic import Field
import yaml
from livekit.plugins import openai

logger = logging.getLogger(__name__)

# logger = logging.getLogger("agent")

load_dotenv(".env.local")

@dataclass
class UserData:
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    no_of_guests: Optional[int] = None
    reservation_time: Optional[str] = None
    reservation_date: Optional[str] = None
    cuisine_preference: Optional[str] = None
    special_requests: Optional[str] = None
    seating_preference: Optional[str] = None
    
    agents: dict[str, Agent] = field(default_factory=dict)
    prev_agent: Optional[Agent] = None

    def __getitem__(self, key):
        return getattr(self, key)
    
    def __setitem__(self, key, value):
        setattr(self, key, value)

    def summarize(self) -> str:
        data = {
            "customer_name": self.customer_name or "unknown",
            "customer_phone": self.customer_phone or "unknown",
            "no_of_guests": self.no_of_guests or "unknown",
            "reservation_time": self.reservation_time or "unknown",
            "reservation_date": self.reservation_date or "unknown",
            "cuisine_preference": self.cuisine_preference or "unknown",
            "special_requests": self.special_requests or "unknown",
            "seating_preference": self.seating_preference or "unknown",
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
        model="llama-3.3-70b",  
        temperature=0.2,
    ),
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
            content=f"You are {agent_name} agent. Current saved user data is {userdata.summarize()}"
        )
        await self.update_chat_ctx(chat_ctx)
        self.session.generate_reply()

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
                f"You are a friendly restaurant receptionist."
                "Your jobs are to greet the caller and understand if they want to "
                "make a reservation or anything else. Guide them to the right agent using tools."
                "Your job is not to take details"
                "Your words: hi there! welcome to our restaurant. how may i assist you today?"
                "You want to make a reservation or anything else I can help you with?"
                "If they want to make a reservation, use the to_reservation tool."
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
            instructions=f"""You are a friendly, professional reservation agent at an upscale restaurant. Your role is to collect reservation details from customers and confirm their bookings in a warm, conversational manner.

# Output rules
You are speaking with the customer via voice, so follow these rules:
- Keep responses brief and natural: one to two sentences at a time
- Ask one question at a time to avoid overwhelming the customer
- Speak numbers and dates naturally (example: say "June twenty-sixth at four PM" not "2026-06-26 16:00")
- Respond in plain text only - no JSON, lists, or technical formatting
- Be conversational and personable

# Your goal
Collect the following reservation details one by one:
1. Customer name (customer_name)
2. Customer phone number (customer_phone)
3. Reservation date (reservation_date)
4. Reservation time (reservation_time)
5. Number of guests (no_of_guests)
6. Seating preference (inside or outside) (seating_preference)
7. Cuisine preference (Italian, Chinese, Indian, or Mexican) (cuisine_preference)
8. Any special requests (special_requests)

After collecting all details, confirm the complete reservation with the customer before finalizing.

# Tools
- Use the update_details tool to save customer information as you gather it
- Store dates in YYYY-MM-DD format (convert relative terms like "tomorrow", "next Friday", "June 29" automatically)
- Store times in 24-hour HH:MM format (convert "4 PM" to "16:00", "8:30 AM" to "08:30")
- Valid seating preferences: inside, outside
- Valid cuisine preferences: italian, chinese, indian, mexican

# Context
Today's date and time is {datetime.now().strftime('%B %d, %Y at %I:%M %p')} ({datetime.now().strftime('%Y-%m-%d %H:%M')})

# Conversation flow
- Greet the customer warmly
- Ask for unknown details one at a time in a natural order
- Confirm each detail as you receive it
- After collecting all information, read back the complete reservation for final confirmation
- Thank the customer once confirmed
""",
            tts=models["tts"]("asteria"),
            llm=models["llm"],
        )

        
    @function_tool()
    async def get_todays_date_n_time(
        self, 
        context: RunContext_T,
        # ADDED DUMMY ARGUMENT
        request: Annotated[str, Field(description="Request for today's date and time")] = "today",
    ) -> str:
        """Get today's date and time for reference."""
        return datetime.now().strftime("%Y-%m-%d_%H:%M:%S")



    @function_tool()
    async def update_details(
        self,
        context: RunContext,
        details: Annotated[
            dict[str, str],
            Field(description="Dictionary of detail types and their values to update. Example: {'customer_name': 'John', 'customer_phone': '1234567890'}")
        ],
    ) -> str:
        """Update multiple reservation details at once in the user's data.
        
        Call this function to update one or more details simultaneously.
        Only use valid detail types that exist in the reservation system.
        
        Args:
            details: Dictionary where keys are field names and values are the data to store
            
        Returns:
            Confirmation message with all updated fields
        """
        # Validate all detail_types exist
        valid_fields = context.userdata.__annotations__.keys() if hasattr(context.userdata, '__annotations__') else dir(context.userdata)
        
        invalid_fields = [field for field in details.keys() if field not in valid_fields]
        if invalid_fields:
            raise ToolError(
                f"Invalid detail types: {', '.join(invalid_fields)}. "
                f"Valid options are: {', '.join(valid_fields)}"
            )
        
        # Update all fields
        updated_fields = []
        try:
            for detail_type, detail_value in details.items():
                setattr(context.userdata, detail_type, detail_value)
                updated_fields.append(f"{detail_type}='{detail_value}'")
        except Exception as e:
            logger.error(f"Failed to update details: {e}")
            raise ToolError("Unable to save details. Please try again.")
        
        # Save to file asynchronously
        save_task = asyncio.create_task(self._save_details_to_file(context))
        save_task.add_done_callback(
            lambda t: logger.error(f"Save failed: {t.exception()}") 
            if t.exception() else None
        )
        
        return f"Updated {len(details)} field(s): {', '.join(updated_fields)}. Continue gathering any remaining information."


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
        tts=models["tts"],
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=False,
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
    cli.run_app(server)

# from livekit.agents.worker import WorkerOptions


# Prewarm function to load VAD before jobs start
# def prewarm(proc):
#     """Runs once when the worker process starts."""
#     proc.userdata["vad"] = silero.VAD.load()


# Main entrypoint function
# async def entrypoint(ctx: JobContext):
#     # Logging setup - Add any context you want in all log entries here
#     ctx.log_context_fields = {
#         "room": ctx.room.name,
#     }
    
#     # FIRST: Connect to room immediately to avoid timeout
#     await ctx.connect()
    
#     # Access prewarmed VAD from process userdata
#     vad = ctx.proc.userdata["vad"]
    
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
#         vad=vad,
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

    


# if __name__ == "__main__":
#     cli.run_app(WorkerOptions(
#         entrypoint_fnc=entrypoint,
#         prewarm_fnc=prewarm,
#     ))

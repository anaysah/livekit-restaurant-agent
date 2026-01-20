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

from prompts import COMMON_RULES, GREETER_INSTRUCTIONS, RESERVATION_INSTRUCTIONS

# make logs directory if not exists
import os
if not os.path.exists('logs'):
    os.makedirs('logs')

# --- 1. Formatter banayein (Logs kaise dikhenge) ---
# Full debug file ke liye detailed format
debug_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
# VIP file ke liye clean format
vip_formatter = logging.Formatter('%(asctime)s - %(message)s')
# ✅ NEW: Conversation-only formatter
conversation_formatter = logging.Formatter('%(asctime)s - %(message)s')

# --- 2. Handlers banayein (Files create karna) ---

# File A: Sab kuch (Kachra + Kaam ki baat)
debug_handler = logging.FileHandler('logs/full_debug.log')
debug_handler.setLevel(logging.DEBUG)
debug_handler.setFormatter(debug_formatter)

# File B: Sirf Important (LLM + Tools + Agent Flow)
vip_handler = logging.FileHandler('logs/vip_agent.log')
vip_handler.setLevel(logging.DEBUG) # DEBUG zaroori hai kyunki OpenAI raw data DEBUG level pe hota hai
vip_handler.setFormatter(vip_formatter)

# --- 3. Loggers Connect karein ---

# A. ROOT LOGGER (Ye sab kuch pakadta hai - LiveKit, HTTP, System)
root_logger = logging.getLogger()
root_logger.setLevel(logging.DEBUG)
root_logger.addHandler(debug_handler) # Sab kuch debug file mein daalo

# B. OPENAI LOGGER (Sirf isko VIP file se jodo)
# Base client logger: Logs only HTTP communication details from _base_client.py module
# Use this for debugging API requests without other OpenAI logs
# openai_logger = logging.getLogger("openai._base_client")

# Parent logger: Catches all OpenAI package logs including base_client, response, legacy_response etc.
# Setting level here affects all child loggers unless they're specifically configured
openai_logger = logging.getLogger("openai")
openai_logger.setLevel(logging.DEBUG)
openai_logger.addHandler(vip_handler) # OpenAI ka raw JSON VIP file mein bhi jayega

# C. CUSTOM AGENT LOGGER (Jo hum code mein use karenge)
agent_logger = logging.getLogger("agent_logic")
agent_logger.setLevel(logging.INFO)
agent_logger.addHandler(vip_handler) # Hamare custom messages VIP file mein jayenge
agent_logger.addHandler(debug_handler) # Aur safe side debug file mein bhi

# ✅ NEW: Conversation-only handler
conversation_handler = logging.FileHandler('logs/conversations.log')
conversation_handler.setLevel(logging.INFO)
conversation_handler.setFormatter(conversation_formatter)

# ✅ NEW: Conversation logger
conversation_logger = logging.getLogger("conversation")
conversation_logger.setLevel(logging.INFO)
conversation_logger.addHandler(conversation_handler)  # Sirf apni file
conversation_logger.propagate = False  # Root logger mein mat jao
# ❌ “Is logger ke messages ko parent/root logger ko mat bhejna.”
# ✅ “Sirf isi logger ke handlers ko use karo.”
# Console pe kuch print nahi hoga

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
        # add space before new lines for better readability
        formatted_data = {k: v.replace("\n", " \n ") if isinstance(v, str) else v for k, v in data.items()}
        return yaml.dump(formatted_data, default_flow_style=False, indent=2)


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
        agent_logger.info(f"🚀 ENTERING AGENT: {agent_name}")
        
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
        customer_name: Annotated[str | None, Field(description="Customer name")] = None,
        customer_phone: Annotated[str | None, Field(description="Customer phone number")] = None,
        reservation_date: Annotated[str | None, Field(description="Date (YYYY-MM-DD)")] = None,
        reservation_time: Annotated[str | None, Field(description="Time (HH:MM)")] = None,
        no_of_guests: Annotated[int | None, Field(description="Number of guests")] = None,
        seating_preference: Annotated[str | None, Field(description="inside or outside")] = None,
        cuisine_preference: Annotated[str | None, Field(description="italian, chinese, indian, mexican")] = None,
        special_requests: Annotated[str | None, Field(description="Special requests")] = None,
    ) -> str:
        """Update reservation details one or more at a time."""
        
        # Collect provided values
        updates = {}
        params = {
            "customer_name": customer_name,
            "customer_phone": customer_phone,
            "reservation_date": reservation_date,
            "reservation_time": reservation_time,
            "no_of_guests": no_of_guests,
            "seating_preference": seating_preference,
            "cuisine_preference": cuisine_preference,
            "special_requests": special_requests,
        }
        
        for field, value in params.items():
            if value is not None:
                setattr(context.userdata, field, value)
                updates[field] = value
        
        if not updates:
            return "No fields updated"
        
        # Async save
        save_task = asyncio.create_task(self._save_details_to_file(context))
        save_task.add_done_callback(
            lambda t: agent_logger.error(f"Save failed: {t.exception()}") 
            if t.exception() else None
        )
        
        updated_list = [f"{k}='{v}'" for k, v in updates.items()]
        return f"Updated {len(updates)} field(s): {', '.join(updated_list)}"


# this function is no longer used and will be removed later
# async def on_session_end(ctx: JobContext):
#     """Session end callback - guaranteed to run"""
#     try:
#         # Session report banao
#         report = ctx.make_session_report()
#         report_dict = report.to_dict()
        
#         # Timestamp ke saath filename
#         current_date = datetime.now().strftime("%Y%m%d_%H%M%S")
#         filename = f"session_report_{ctx.room.name}_{current_date}.json"
        
#         # File mein save karo
#         with open(filename, 'w') as f:
#             json.dump(report_dict, f, indent=2)
        
#         # Logger mein bhi dalo
#         conversation_logger.info(f"=== SESSION ENDED: {ctx.room.name} ===")
#         conversation_logger.info(json.dumps(report_dict, indent=2))
        
#         # IMPORTANT: Force flush all handlers
#         for handler in conversation_logger.handlers:
#             handler.flush()
        
#         print(f"✅ Session report saved to {filename}")
        
#     except Exception as e:
#         print(f"❌ Error in on_session_end: {e}")
#         # Ye bhi flush karo
#         for handler in conversation_logger.handlers:
#             handler.flush()



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
    
    async def save_transcript():
        import json
        from datetime import datetime
        
        # Session history nikalo
        # history = session.history.to_dict() # ismei sirf conversation hoti hai
        history = ctx.make_session_report().to_dict() # ismei listning speaking vagera event bhi hote hain
        
        # File mein save karo
        filename = f"logs/transcript_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(history, f, indent=2)
        
        print(f"✅ Saved: {filename}")
    
    # Callback register karo
    ctx.add_shutdown_callback(save_transcript)
    
    # session.on("conversation_item_added", lambda event: conversation_logger.info(f"{event.item.role}: {event.item.content or ''}"))
    @session.on("conversation_item_added")
    def log_conversation(event):
        item = event.item
        # log full item for debugging
        conversation_logger.info(f"{item.role}: {item}")
    

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

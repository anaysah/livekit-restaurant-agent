import asyncio
import http.client as http_client
import json
import logging
import os
import random
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Annotated, Optional

from dotenv import load_dotenv
from pydantic import Field

from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    RunContext,
    ToolError,
    cli,
    function_tool,
    metrics,
    room_io,
)
from livekit.agents.metrics import LLMMetrics
from livekit.agents.voice import MetricsCollectedEvent
from livekit.plugins import deepgram, groq, mistralai, noise_cancellation, openai, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from src.dataclass import UserData
from src.logger_config import agent_flow
from src.tasks import CollectReservationInfo
from src.variables import COMMON_RULES, GREETER_INSTRUCTIONS, RESERVATION_INSTRUCTIONS
from src.fn import summarize_agent_handoff, send_to_ui


# HTTP level debug
# http_client.HTTPConnection.debuglevel = 1

# Logging config
# logging.basicConfig(level=logging.DEBUG)
logging.getLogger("httpx").setLevel(logging.DEBUG)
# logging.getLogger("httpcore").setLevel(logging.DEBUG)
# http_client.HTTPConnection.debuglevel = 1

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

    "groq/compound",
    "groq/compound-mini" 
]

TEMPERATURE = os.getenv("LLM_TEMPERATURE", "0.0")
PARALLEL_TOOL_CALLS = os.getenv("LLM_PARALLEL_TOOL_CALLS", "false").lower() in ["true", "1", "yes"]
TOOL_CHOICE = os.getenv("LLM_TOOL_CHOICE", "auto")

LLM_MODELS = {
    "groq":{
        "compound":"groq/compound",
        "compound-mini":"groq/compound-mini",
        "llama-70b-versatile":"llama-3.3-70b-versatile",
        "llama-8b-instant":"llama-3.1-8b-instant",
        "provider": lambda model: groq.LLM(
            model=model,
            temperature=float(TEMPERATURE),
            parallel_tool_calls=PARALLEL_TOOL_CALLS,
            tool_choice=TOOL_CHOICE
        )
    },
    "mistral":{
        "mistral-large-latest":"mistral-large-latest",
        "provider": lambda model: mistralai.LLM(
            model=model,
            temperature=float(TEMPERATURE),
        )
    },
    "cerebras":{
        "qwen-3-32b":"qwen-3-32b",
        "gpt-oss-120b":"gpt-oss-120b",
        "glm4":"zai-glm-4.7",
        "provider": lambda model: openai.LLM.with_cerebras(
            model=model,
            temperature=float(TEMPERATURE),
            parallel_tool_calls=PARALLEL_TOOL_CALLS,
            tool_choice=TOOL_CHOICE,
            api_key=os.getenv("CEREBRAS_API_KEY")
         )
    },
    "modal.com":{
        "glm5":"zai-org/GLM-5-FP8",
        "provider": lambda model: openai.LLM(
            model=model,
            temperature=float(TEMPERATURE),
            base_url="https://api.us-west-2.modal.direct/v1",
        )
    }
}

def get_provider(llm_models, provider_name, model_name: str):
    if provider_name in llm_models:
        model_info = llm_models[provider_name]
        if model_name in model_info:
            return model_info["provider"](model_info[model_name])
    raise ValueError(f"Invalid provider or model: {provider_name}, {model_name}")

# IS_STT_ENABLED and IS_TTS_ENABLED FROM .env
IS_TTS_ENABLED = os.getenv("IS_TTS_ENABLED", "true").lower() in ["true", "1", "yes"]
IS_STT_ENABLED = os.getenv("IS_STT_ENABLED", "true").lower() in ["true", "1", "yes"]

agent_flow.info(f"🔊 TTS Enabled: {IS_TTS_ENABLED}")
agent_flow.info(f"🎤 STT Enabled: {IS_STT_ENABLED}")

models = {
    "llm": get_provider(LLM_MODELS,"mistral","mistral-large-latest"),
    "tts": lambda model: deepgram.TTS(model=VOICE_MODELS[model]) if IS_TTS_ENABLED else None,
    "stt": deepgram.STT() if IS_STT_ENABLED else None,  # Using STT instead of STTv2
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

class Greeter(BaseAgent):    
    def __init__(self) -> None:
        super().__init__(
            instructions=(
                f"""{COMMON_RULES} \n {GREETER_INSTRUCTIONS}"""
            ),
            # llm=models["llm"],
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
        # Send navigation message to frontend
        userdata = context.userdata
        if userdata.job_ctx:
            await send_to_ui(
                userdata.job_ctx,
                "NAVIGATE_PAGE",
                {
                    "page": "booking",
                }
            )
            agent_flow.info("🔄 Navigating user to booking page")
        return await self._transfer_to_agent("reservation", context)

class Reservation(BaseAgent):
    
    
    def __init__(self) -> None:
        super().__init__(
            instructions=f"""{COMMON_RULES} \n {RESERVATION_INSTRUCTIONS.format(current_datetime=datetime.now().strftime("%Y-%m-%d %H:%M"))}""",
            tts=models["tts"]("odysseus"),
            # llm=models["llm"],
        )
        
    async def on_enter(self) -> None:
        await super().on_enter()
        
        collect_info_task = CollectReservationInfo(chat_ctx=self.chat_ctx.copy(), tts=self.tts)
        try:
            await collect_info_task
            user_data: UserData = collect_info_task.userdata
            
            agent_flow.info(f"🤖 Collected User Data: {user_data}")
            
            agent_flow.info(f"💠 Current Token Usage: {self._token_usage()}")
            
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
    userdata.job_ctx = ctx  # Store context for sending messages
    userdata.agents.update({
        "greeter": Greeter(),
        "reservation": Reservation(),
    })
    userdata.usage_collector = metrics.UsageCollector()

    # Set up a voice AI pipeline using OpenAI, Cartesia, AssemblyAI, and the LiveKit turn detector
    session = AgentSession[UserData](
        userdata=userdata,
        stt=models["stt"],
        llm=models["llm"],
        tts=models["tts"]("thalia"),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=False,
    )
    
    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        userdata.usage_collector.collect(ev.metrics)
        
    
    @ctx.room.on("data_received")
    def _on_data_received(packet: rtc.DataPacket):
        agent_flow.info(f"📥 Data received from {packet.participant.identity} on topic '{packet.topic}': {packet.data.decode()}")
    
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
    
    # Wait for participants to join before testing
    agent_flow.info("⏳ Waiting for participants to join...")
    await asyncio.sleep(2)  # Give time for frontend to connect
    
    # Test data channel connection
    agent_flow.info("🧪 Testing data channel connection...")
    agent_flow.info(f"📊 Room participants: {list(ctx.room.remote_participants.keys())}")
    
    try:
        await send_to_ui(ctx, "test", {
            "type": "test",
            "data": {"message": "Data channel is working!"}
        })
        agent_flow.info("✅ Test message sent successfully")
    except Exception as e:
        agent_flow.error(f"❌ Test message failed: {e}")


if __name__ == "__main__":
    cli.run_app(server)

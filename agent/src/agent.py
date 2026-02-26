import asyncio
import http.client as http_client
import json
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime
from typing import Annotated
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
from livekit.plugins import deepgram, noise_cancellation, silero, groq, mistralai, openai
from livekit.plugins.turn_detector.multilingual import MultilingualModel


from src.dataclass import UserData, RunContext_T
from src.logger_config import agent_flow
from src.tasks import CollectReservationInfo
from src.fn import summarize_agent_handoff, send_to_ui, get_provider
from src.agents.greeter import Greeter
from src.agents.reservation import Reservation


# HTTP level debug
# http_client.HTTPConnection.debuglevel = 1

# Logging config
# logging.basicConfig(level=logging.DEBUG)
logging.getLogger("httpx").setLevel(logging.DEBUG)
# logging.getLogger("httpcore").setLevel(logging.DEBUG)
# http_client.HTTPConnection.debuglevel = 1

load_dotenv(".env.local")




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




# IS_STT_ENABLED and IS_TTS_ENABLED FROM .env
IS_TTS_ENABLED = os.getenv("IS_TTS_ENABLED", "true").lower() in ["true", "1", "yes"]
IS_STT_ENABLED = os.getenv("IS_STT_ENABLED", "true").lower() in ["true", "1", "yes"]


models = {
    "llm": get_provider(LLM_MODELS,"mistral","mistral-large-latest"),
    "tts": lambda model: deepgram.TTS(model=VOICE_MODELS[model]) if IS_TTS_ENABLED else None,
    "stt": deepgram.STT() if IS_STT_ENABLED else None,  # Using STT instead of STTv2
    "vad": silero.VAD.load(),
}



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
        "greeter": Greeter(models["tts"]("thalia")),
        "reservation": Reservation(models["tts"]("odysseus")),
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
        
    
    # @ctx.room.on("data_received")
    # def _on_data_received(packet: rtc.DataPacket):
    #     if packet.topic != "ui-to-agent":
    #         return  # Ignore messages not meant for the agent
        
    #     try:
    #         msg = json.loads(packet.data.decode())
    #         msg_type = msg.get("type")
    #         payload = msg.get("payload", {})
    #         agent_flow.info(f"📥 UI→Agent: type={msg_type} payload={payload}")

    #         if msg_type in ("FORM_UPDATE", "FORM_SUBMITTED"):
    #             form_id = payload.get("formId")
    #             values = payload.get("values", {})
    #             if form_id and values:
    #                 userdata.apply_form_update(form_id, values)
    #                 agent_flow.info(f"✅ Form updated: {form_id} → {values}")
                    
                    

    #                 # Inject updated context and make agent respond
    #                 session.generate_reply(
    #                     instructions=f"The user just updated the form '{form_id}' with values {values}."
    #                 )

    #         elif msg_type == "PAGE_CHANGED":
    #             page = payload.get("page")
    #             if page:
    #                 userdata.update_meta({"current_page": page})
    #                 agent_flow.info(f"✅ Page changed: {page}")

    #     except Exception as e:
    #         agent_flow.error(f"❌ Error handling data: {e}")
    
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

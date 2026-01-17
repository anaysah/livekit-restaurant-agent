import logging

import os

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    inference,
    room_io,
)
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from livekit.agents import function_tool, RunContext
from livekit.agents import AgentTask, function_tool
from livekit.plugins import silero, openai
from livekit.plugins import groq
from livekit.plugins import cartesia


logger = logging.getLogger("agent")

load_dotenv(".env.local")


# Custom logging level
CHECKPOINT_LEVEL = 25
logging.addLevelName(CHECKPOINT_LEVEL, "CHECKPOINT")

def checkpoint(self, message, *args, **kwargs):
    if self.isEnabledFor(CHECKPOINT_LEVEL):
        self._log(CHECKPOINT_LEVEL, message, args, **kwargs)

logging.Logger.checkpoint = checkpoint

# Configure logging on root logger to capture all logs including livekit
root_logger = logging.getLogger()
root_logger.setLevel(logging.DEBUG)

# File handler
file_handler = logging.FileHandler("agent.log")
file_handler.setLevel(logging.DEBUG)
file_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(file_formatter)
root_logger.addHandler(file_handler)

# Console handler with colors
class ColoredFormatter(logging.Formatter):
    def format(self, record):
        if record.levelno == CHECKPOINT_LEVEL:
            return f"\033[33m{record.getMessage()}\033[0m"
        else:
            return super().format(record)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)
console_formatter = ColoredFormatter('%(levelname)s - %(message)s')
console_handler.setFormatter(console_formatter)
root_logger.addHandler(console_handler)


from livekit.agents import AgentSession
from dataclasses import dataclass

@dataclass
class BookingInfo:
    """Store all booking information across agents"""
    guest_name: str | None = None
    number_of_guests: int | None = None
    preferred_date_time: str | None = None
    cuisine_preference: str | None = None
    special_requests: str | None = None
    seating_preference: str | None = None  # indoor/outdoor
    weather_checked: bool = False


class TakeInfo(AgentTask[BookingInfo]):
    """Agent task to collect booking information from the user"""
    def __init__(self, chat_ctx=None) -> None:
        super().__init__(
            instructions="""
            Collect booking info: name, number of guests, date/time, cuisine preference, special requests.
            ask and collect every info one by one
            ask for any missing info one by one until all is collected.
            order of asking:
            1. guest's name
            2. number of guests
            3. preferred date and time
            4. cuisine preference
            5. special requests
            """,
            # chat_ctx=chat_ctx,
        )
        # log info take task started 
        logger.checkpoint("TakeInfo task started")
        self._results = {}


    async def on_enter(self) -> None:
        logger.checkpoint("TakeInfo agent has entered the session.")
        await self.session.generate_reply(
            instructions="""
                Start collecting booking information from the user.
                Ask for the guest's name first.
                Moving to next question tell the answer which has been recorded.
            """
        )


    @function_tool()
    async def record_name(self, context: RunContext, guest_name: str):
        """Record the guest's name"""
        logger.info(f"Collecting guest name: {guest_name}")
        self._results["guest_name"] = guest_name
        return f"Recorded guest name: {guest_name}"
        # await self._check_completion()


    @function_tool()
    async def record_number_of_guests(self, context: RunContext, number_of_guests: int):
        """Record the number of guests"""
        logger.info(f"Collecting number of guests: {number_of_guests}")
        self._results["number_of_guests"] = number_of_guests
        return f"Recorded number of guests: {number_of_guests}"
        # await self._check_completion()


    @function_tool()
    async def record_preferred_date_time(self, context: RunContext, preferred_date_time: str):
        """Record the preferred date and time"""
        logger.info(f"Collecting preferred date/time: {preferred_date_time}")
        self._results["preferred_date_time"] = preferred_date_time
        return f"Recorded preferred date/time: {preferred_date_time}"
        # await self._check_completion()


    @function_tool()
    async def record_cuisine_preference(self, context: RunContext, cuisine_preference: str):
        """Record the cuisine preference"""
        logger.info(f"Collecting cuisine preference: {cuisine_preference}")
        self._results["cuisine_preference"] = cuisine_preference
        return f"Recorded cuisine preference: {cuisine_preference}"
        # await self._check_completion()


    @function_tool()
    async def record_special_requests(self, context: RunContext, special_requests: str):
        """Record any special requests"""
        logger.info(f"Collecting special requests: {special_requests}")
        self._results["special_requests"] = special_requests
        return f"Recorded special requests: {special_requests}"
        # await self._check_completion()


    # @function_tool()
    # async def check_completion(self, context: RunContext) -> None:
    #     """Check if all booking info has been collected"""
    #     required_keys = {
    #         "guest_name",
    #         "number_of_guests",
    #         "preferred_date_time",
    #         "cuisine_preference",
    #         "special_requests",
    #     }

    #     if set(self._results.keys()) == required_keys:
    #         results = BookingInfo(
    #             guest_name=self._results["guest_name"],
    #             number_of_guests=self._results["number_of_guests"],
    #             preferred_date_time=self._results["preferred_date_time"],
    #             cuisine_preference=self._results["cuisine_preference"],
    #             special_requests=self._results["special_requests"],
    #         )
    #         logger.checkpoint(f"All booking info collected: {results}")
    #         self.complete(results)
    #     else:
    #         missing_keys = required_keys - set(self._results.keys())
    #         logger.info(f"Missing keys: {missing_keys}")
    #         await self.session.generate_reply(
    #             instructions=f"""
    #                 Current Missing informations: {", ".join(missing_keys)}
    #             """,
    #         )


        
class Assistant(Agent):
    """Main greeter and final confirmation agent"""
    def __init__(self) -> None:
        super().__init__(
            instructions="""
                You have to talk in english
                You are the main host at Pista Bella restaurant. 
                When customer first arrives: Greet warmly 

                your job is to take booking info and save it.

                when customer leaves: Thank them and confirm booking info saved.

                You dont have to talk to much but should be talking like a normal person. confirm every details.

                dont answer questions outside of booking info.
            """,
        )
    
    async def on_enter(self):
        logger.checkpoint("Assistant agent has entered the session.")
        # Greet the user
        await self.session.generate_reply(
            instructions="Greet the user warmly and start taking the booking info.",
        )
        result = await TakeInfo()
        logger.checkpoint(f"TakeInfo task completed with result: {result}")
        
        await self.session.generate_reply(
            instructions=f"""
                Collected data:
                Guest: {result.guest_name},
                Number of guests: {result.number_of_guests},
                Date/Time: {result.preferred_date_time},
                Cuisine: {result.cuisine_preference},
                Special requests: {result.special_requests},
                
                Confirm this information with the user by asking if everything is correct. ask in a friendly way and full written paragraph
            """
        )
        return result

    # @function_tool()
    # async def run_info_taker_task(self, context: RunContext):
    #     """Run the InfoTaker task to collect booking information"""
    #     logger.checkpoint("Starting TakeInfo task from Assistant")
        # result = await TakeInfo()
        # logger.checkpoint(f"TakeInfo task completed with result: {result}")
        
        # await self.session.generate_reply(
        #     instructions=f"""
        #         Booking information has been collected successfully:
        #         Guest: {result.guest_name}
        #         Number of guests: {result.number_of_guests}
        #         Date/Time: {result.preferred_date_time}
        #         Cuisine: {result.cuisine_preference}
        #         Special requests: {result.special_requests}
                
        #         Confirm this information with the user.
        #     """
        # )
        
        # return result

    async def on_exit(self):
        logger.checkpoint("Assistant agent is exiting the session.")
        await self.session.generate_reply(
            instructions="Thank the user and confirm that the booking information has been saved.",
        )
        


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

server = AgentServer()

server.setup_fnc = prewarm


@server.rtc_session()
async def my_agent(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Set up a voice AI pipeline using OpenAI, Cartesia, AssemblyAI, and the LiveKit turn detector
    session = AgentSession[BookingInfo](
        userdata=BookingInfo(),
        # Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
        # See all available models at https://docs.livekit.io/agents/models/stt/
        stt=groq.STT(
            model="whisper-large-v3-turbo",
            language="en",
        ),
        # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
        # See all available models at https://docs.livekit.io/agents/models/llm/
        llm=groq.LLM(
            model="qwen/qwen3-32b"
        ),
        # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
        # See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
        # dont use any tts
        # tts=cartesia.TTS(
        #     model="sonic-3",
        #     voice="f786b574-daa5-4673-aa0c-cbe3e8534c02",
        # ),
        
        tts=inference.TTS(
            model="deepgram/aura-2", 
            voice="athena", 
            language="en"
        ),
        # VAD and turn detection are used to determine when the user is speaking and when the agent should respond
        # See more at https://docs.livekit.io/agents/build/turns
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        # allow the LLM to generate a response while waiting for the end of turn
        # See more at https://docs.livekit.io/agents/build/audio/#preemptive-generation
        preemptive_generation=True,
    )

    # To use a realtime model instead of a voice pipeline, use the following session setup instead.
    # (Note: This is for the OpenAI Realtime API. For other providers, see https://docs.livekit.io/agents/models/realtime/))
    # 1. Install livekit-agents[openai]
    # 2. Set OPENAI_API_KEY in .env.local
    # 3. Add `from livekit.plugins import openai` to the top of this file
    # 4. Use the following session setup instead of the version above
    # session = AgentSession(
    #     llm=openai.realtime.RealtimeModel(voice="marin")
    # )

    # # Add a virtual avatar to the session, if desired
    # # For other providers, see https://docs.livekit.io/agents/models/avatar/
    # avatar = hedra.AvatarSession(
    #   avatar_id="...",  # See https://docs.livekit.io/agents/models/avatar/plugins/hedra
    # )
    # # Start the avatar and wait for it to join
    # await avatar.start(session, room=ctx.room)

    # Start the session, which initializes the voice pipeline and warms up the models
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

    await ctx.room.local_participant.publish_data(
        payload="Hello! Welcome to our restaurant. May I have your name?",
        reliable=True
    )

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
    # Optional self-test logging: set LOG_SELF_TEST=1 to emit example logs
    if os.getenv("LOG_SELF_TEST"):
        # Emit sample logs for levels and our CHECKPOINT level to verify coloring
        # Diagnostic info: show handlers and their formatters
        try:
            handler_info = [f"{type(h).__name__} (formatter={type(h.formatter).__name__ if h.formatter else None})" for h in logging.getLogger().handlers]
            print("Root logger handlers:", handler_info)
        except Exception:
            pass
        logger.debug("Sample debug message")
        logger.info("Sample info message")
        logger.checkpoint("Sample checkpoint message - should appear in yellow")
        logger.warning("Sample warning message")
        logger.error("Sample error message")

    cli.run_app(server)

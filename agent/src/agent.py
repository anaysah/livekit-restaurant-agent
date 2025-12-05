import logging

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

logger = logging.getLogger("agent")

load_dotenv(".env.local")


from livekit.agents import AgentSession
from dataclasses import dataclass

@dataclass
class MySessionInfo:
    """
    Number of guests
○​ Preferred date and time
○​ Cuisine preference (Italian, Chinese, Indian, etc.)
○​ Special requests (birthday, anniversary, dietary restrictions)
    """
    guest_name: str | None = None
    number_of_guests: int | None = None
    preferred_date_time: str | None = None
    cuisine_preference: str | None = None
    special_requests: str | None = None

class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""you are representing a restuarant. your job is to greet customers calling in and send them to the info taker to take their booking. be polite and friendly.""",
        )

    async def on_enter(self) -> None:
        await self.session.generate_reply(instructions="Greet the user and tell them your restuarant name pista bella. and you send them to the info taker to take their booking.")
        

    # To add tools, use the @function_tool decorator.
    # Here's an example that adds a simple weather tool.
    # You also have to add `from livekit.agents import function_tool, RunContext` to the top of this file
    # @function_tool
    # async def lookup_weather(self, context: RunContext, location: str):
    #     """Use this tool to look up current weather information in the given location.
    #
    #     If the location is not supported by the weather service, the tool will indicate this. You must tell the user the location's weather is unavailable.
    #
    #     Args:
    #         location: The location to look up weather information for (e.g. city name)
    #     """
    #
    #     logger.info(f"Looking up weather for {location}")
    #
    #     return "sunny with a temperature of 70 degrees."


server = AgentServer()

class InfoTaker(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""you are representing a restuarant. your job is to take bookings from customers calling in. be polite and friendly. collect the following information from the customer: name, number of guests, preferred date and time, cuisine preference, special requests. confirm the booking details with the customer at the end of the call.""",
        )

    async def on_enter(self) -> None:
        await self.session.generate_reply(instructions="tell them you will take their booking details now.")

    @function_tool()
    async def collect_booking_info(self, context: RunContext):
        """Use this tool to collect booking information from the customer.

        Collect the following information:
        - Name
        - Number of guests
        - Preferred date and time
        - Cuisine preference
        - Special requests

        Args:
            context: The run context containing session information.
        """

        session_info: MySessionInfo = self.session.userdata

        # Collect each piece of information if not already collected
        if session_info.guest_name is None:
            await self.session.generate_reply(instructions="ask for the customer's name.")
            # Assume we get the response and set it
            session_info.guest_name = "John Doe"  # Replace with actual response handling

        if session_info.number_of_guests is None:
            await self.session.generate_reply(instructions="ask for the number of guests.")
            session_info.number_of_guests = 4  # Replace with actual response handling

        if session_info.preferred_date_time is None:
            await self.session.generate_reply(instructions="ask for the preferred date and time.")
            session_info.preferred_date_time = "July 20th at 7 PM"  # Replace with actual response handling

        if session_info.cuisine_preference is None:
            await self.session.generate_reply(instructions="ask for the cuisine preference.")
            session_info.cuisine_preference = "Italian"  # Replace with actual response handling

        if session_info.special_requests is None:
            await self.session.generate_reply(instructions="ask for any special requests.")
            session_info.special_requests = "Vegetarian options"  # Replace with actual response handling

        # Confirm booking details with the customer
        await self.session.generate_reply(
            instructions=f"confirm the booking details: Name: {session_info.guest_name}, Number of Guests: {session_info.number_of_guests}, Date and Time: {session_info.preferred_date_time}, Cuisine Preference: {session_info.cuisine_preference}, Special Requests: {session_info.special_requests}. Thank the customer for their booking."
        )

        return self._handoff_if_done()
    
    def _handoff_if_done(self):
        session_info: MySessionInfo = self.session.userdata
        if all([
            session_info.guest_name,
            session_info.number_of_guests,
            session_info.preferred_date_time,
            session_info.cuisine_preference,
            session_info.special_requests
        ]):
            self.session.transition_to(Assistant())

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
    session = AgentSession[MySessionInfo](
        userdata=MySessionInfo(),
        # Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
        # See all available models at https://docs.livekit.io/agents/models/stt/
        stt=inference.STT(model="assemblyai/universal-streaming", language="en"),
        # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
        # See all available models at https://docs.livekit.io/agents/models/llm/
        llm=inference.LLM(model="openai/gpt-4.1-mini"),
        # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
        # See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
        tts=inference.TTS(
            model="cartesia/sonic-3", voice="9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"
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
    cli.run_app(server)

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


class Assistant(Agent):
    """Main greeter and final confirmation agent"""
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are the main host at Pista Bella restaurant. 
            When customer first arrives: Greet warmly and transfer to info taker.
            When customer returns after all info collected: Review all booking details and confirm the reservation.""",
        )

    async def on_enter(self) -> None:
        booking_info: BookingInfo = self.session.userdata
        
        # Check if this is initial greeting or final confirmation
        if booking_info.guest_name is None:
            # Initial greeting
            await self.session.generate_reply(
                instructions="Greet the customer warmly. Introduce yourself as the host of Pista Bella restaurant. Tell them you'll connect them with our booking specialist to take their reservation details."
            )
        else:
            # Final confirmation after all info collected
            await self._confirm_booking()

    @function_tool()
    async def transfer_to_info_taker(self, context: RunContext, reason: str):
        """
        Transfer the session to the InfoTaker agent.

        Args:
            context: The run context provided by LiveKit (internal use only).
            reason: A brief summary of why the user needs to be transferred to the information taker. 
                    This field is required for the AI model's JSON schema generation.
        """
        print(f"Transferring based on reason: {reason}")
        return InfoTaker(context=context.session.job_ctx)

    
    async def _confirm_booking(self):
        """Final confirmation of all booking details"""
        booking_info: BookingInfo = self.session.userdata
        
        await self.session.generate_reply(
            instructions=f"""Review and confirm the complete reservation:
            - Guest Name: {booking_info.guest_name}
            - Number of Guests: {booking_info.number_of_guests}
            - Date & Time: {booking_info.preferred_date_time}
            - Cuisine Preference: {booking_info.cuisine_preference}
            - Seating: {booking_info.seating_preference}
            - Special Requests: {booking_info.special_requests or 'None'}
            
            Ask if everything looks correct. If yes, confirm the booking is complete and thank them. 
            """
        )


class InfoTaker(Agent):
    """Collects basic booking information"""
    def __init__(self, context:JobContext) -> None:
        super().__init__(
            instructions="""You are the booking specialist at Pista Bella. 
            Collect: guest name, number of guests, preferred date/time, cuisine preference, and special requests.
            Be conversational - ask questions naturally, one at a time. """,
        )
        self.job_ctx = context 

    async def on_enter(self) -> None:
        await self.session.generate_reply(
            instructions="Tell the customer you'll take their booking details now. Start by asking for their name."
        )

    @function_tool()
    async def save_guest_name(self, context: RunContext, name: str):
        """Save the customer's name.
        
        Args:
            name: The guest's full name
        """
        booking_info: BookingInfo = self.session.userdata
        booking_info.guest_name = name
        logger.info(f"Saved guest name: {name}")
        return f"Name saved: {name}"

    @function_tool()
    async def save_number_of_guests(self, context: RunContext, count: int):
        """Save the number of guests.
        
        Args:
            count: Number of guests (1-20)
        """
        booking_info: BookingInfo = self.session.userdata
        booking_info.number_of_guests = count
        logger.info(f"Saved guest count: {count}")
        return f"Guest count saved: {count}"

    @function_tool()
    async def save_date_time(self, context: RunContext, datetime: str):
        """Save the preferred date and time.
        
        Args:
            datetime: Preferred date and time (e.g., "July 20th at 7 PM")
        """
        booking_info: BookingInfo = self.session.userdata
        booking_info.preferred_date_time = datetime
        logger.info(f"Saved date/time: {datetime}")
        return f"Date/time saved: {datetime}"

    @function_tool()
    async def save_cuisine_preference(self, context: RunContext, cuisine: str):
        """Save cuisine preference.
        
        Args:
            cuisine: Type of cuisine (Italian, Chinese, Indian, etc.)
        """
        booking_info: BookingInfo = self.session.userdata
        booking_info.cuisine_preference = cuisine
        logger.info(f"Saved cuisine: {cuisine}")
        return f"Cuisine preference saved: {cuisine}"

    @function_tool()
    async def save_special_requests(self, context: RunContext, requests: str):
        """Save any special requests.
        
        Args:
            requests: Special requests like dietary restrictions, celebrations, etc.
        """
        booking_info: BookingInfo = self.session.userdata
        booking_info.special_requests = requests
        logger.info(f"Saved special requests: {requests}")
        return f"Special requests saved: {requests}"

    @function_tool()
    async def complete_info_collection(self, context: RunContext):
        """Call this when you believe all booking information is collected.
        Will transfer to seating specialist if complete."""
        booking: BookingInfo = context.userdata
        
        missing = []
        if not booking.guest_name: missing.append("name")
        if not booking.number_of_guests: missing.append("guest count")
        if not booking.preferred_date_time: missing.append("date/time")
        if not booking.cuisine_preference: missing.append("cuisine")
        
        if missing:
            return f"Cannot transfer yet. Still need: {', '.join(missing)}"
        
        # All info collected - return new agent for handoff
        return SeatingSuggestion()



class SeatingSuggestion(Agent):
    """Suggests seating based on weather"""
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are the seating specialist at Pista Bella. 
            Check the weather for the customer's booking date, then suggest seating.
            If weather is nice (sunny, clear), suggest outdoor seating.
            If weather is poor (rainy, hot, cold), recommend indoor seating.
            After suggesting, save their seating preference and transfer back to main host for final confirmation.
            """
        )

    async def on_enter(self) -> None:
        booking: BookingInfo = self.session.userdata
        await self.session.generate_reply(
            instructions=f"""Guest {booking.guest_name} with party of {booking.number_of_guests} 
            on {booking.preferred_date_time}. Greet them and check the weather."""
        )

    @function_tool()
    async def check_weather(self, context: RunContext):
        """Check weather for the reservation date.
        
        Use this to get weather information before suggesting seating.
        """
        booking_info: BookingInfo = self.session.userdata
        
        # In real implementation, call a weather API using booking_info.preferred_date_time
        # For now, simulate weather
        weather = "sunny and pleasant at 75°F"  # Replace with actual API call
        
        booking_info.weather_checked = True
        logger.info(f"Weather checked: {weather}")
        
        return f"Weather for {booking_info.preferred_date_time}: {weather}."

    @function_tool()
    async def save_seating_preference(self, context: RunContext, seating: str):
        """Save the customer's seating preference.
        
        Args:
            seating: Either "indoor" or "outdoor"
        """
        booking_info: BookingInfo = self.session.userdata
        booking_info.seating_preference = seating.lower()
        logger.info(f"Saved seating preference: {seating}")
        return f"Seating preference saved: {seating}"

    @function_tool()
    async def complete_seating_selection(self, context: RunContext):
        """Complete seating selection and return to host for confirmation"""
        booking: BookingInfo = context.userdata
        
        if not booking.seating_preference:
            return "Please save seating preference first"
        
        return "Seating preference saved. Transfer to host for final confirmation."
        
    @function_tool()
    async def transfer_to_host(self, context: RunContext):
        """Transfer back to the main host agent for final confirmation"""
        return Assistant()
        
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
        tts=cartesia.TTS(
      model="sonic-3",
      voice="f786b574-daa5-4673-aa0c-cbe3e8534c02",
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

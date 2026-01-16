import logging
from dataclasses import dataclass
from typing import Literal, Annotated

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
    function_tool,
    RunContext,
)
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

# Load environment variables
load_dotenv(".env.local")

# Configure Logging
logger = logging.getLogger("restaurant-agent")
logging.basicConfig(level=logging.INFO)

@dataclass
class BookingInfo:
    """Store all booking information shared across agents."""
    guest_name: str | None = None
    number_of_guests: int | None = None
    preferred_date_time: str | None = None
    cuisine_preference: str | None = None
    special_requests: str | None = None
    seating_preference: Literal["indoor", "outdoor"] | None = None
    weather_checked: bool = False
    # Track the state to ensure the Host knows what to do upon return
    status: Literal["greeting", "collecting", "seating", "confirming"] = "greeting"

    def __str__(self):
        return (
            f"Name: {self.guest_name}\n"
            f"Guests: {self.number_of_guests}\n"
            f"Time: {self.preferred_date_time}\n"
            f"Cuisine: {self.cuisine_preference}\n"
            f"Seating: {self.seating_preference}\n"
            f"Requests: {self.special_requests or 'None'}"
        )

class Assistant(Agent):
    """
    The Main Host Agent.
    Responsibilities: Greet, Route to specialists, and Final Confirmation.
    """
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are the Maitre D' (Host) at 'Pista Bella' restaurant.
            Your tone is professional, warm, and welcoming.
            
            Depending on the current status of the booking:
            1. If status is 'greeting': Welcome the guest warmly, briefly mention the restaurant's elegance, and immediately transfer them to the Booking Specialist using the tool.
            2. If status is 'confirming': Read back the full reservation details clearly. Ask the user to confirm if everything is correct. If yes, thank them and close the conversation.
            """,
        )

    async def on_enter(self) -> None:
        booking_info: BookingInfo = self.session.userdata
        logger.info(f"Host Agent Entered. Current Status: {booking_info.status}")

        if booking_info.status == "greeting":
            await self.session.generate_reply(
                instructions="Greet the user warmly and connect them to the booking specialist."
            )
        elif booking_info.status == "confirming":
            await self._confirm_booking()

    @function_tool()
    async def transfer_to_info_taker(self, context: RunContext):
        """Transfer the customer to the Booking Specialist to take details."""
        context.userdata.status = "collecting"
        return InfoTaker()

    async def _confirm_booking(self):
        booking_info: BookingInfo = self.session.userdata
        await self.session.generate_reply(
            instructions=f"""
            The booking is ready for final review.
            
            Current Details:
            {booking_info}
            
            Present these details to the user and ask for a final 'Yes' to confirm.
            """
        )

class InfoTaker(Agent):
    """
    The Data Collection Agent.
    Responsibilities: Gather 4 core pieces of info (Name, Count, Time, Cuisine).
    """
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are the Booking Specialist. 
            Your goal is to collect the following missing details: Name, Party Size, Date/Time, and Cuisine Preference.
            
            - Be conversational.
            - Once you have ALL information, you MUST call the 'complete_info_collection' tool to proceed.
            """,
        )

    async def on_enter(self) -> None:
        await self.session.generate_reply(
            instructions="Introduce yourself briefly as the Booking Specialist and ask for the guest's name to get started."
        )

    @function_tool()
    async def save_booking_details(
        self, 
        context: RunContext, 
        guest_name: Annotated[str | None, "Guest full name"] = None,
        number_of_guests: Annotated[int | None, "Number of people"] = None,
        preferred_date_time: Annotated[str | None, "Date and time of booking"] = None,
        cuisine_preference: Annotated[str | None, "Preferred cuisine"] = None,
        special_requests: Annotated[str | None, "Any special requests"] = None
    ):
        """
        Save or update one or more booking details. You can call this multiple times.
        """
        info: BookingInfo = context.userdata
        
        if guest_name: info.guest_name = guest_name
        if number_of_guests: info.number_of_guests = number_of_guests
        if preferred_date_time: info.preferred_date_time = preferred_date_time
        if cuisine_preference: info.cuisine_preference = cuisine_preference
        if special_requests: info.special_requests = special_requests
        
        return "Details updated successfully."

    @function_tool()
    async def complete_info_collection(self, context: RunContext):
        """
        Call this ONLY when Name, Guest Count, Date/Time, and Cuisine are all collected.
        Checks for completeness and transfers to the Seating Specialist.
        """
        booking: BookingInfo = context.userdata
        
        missing = []
        if not booking.guest_name: missing.append("Guest Name")
        if not booking.number_of_guests: missing.append("Number of Guests")
        if not booking.preferred_date_time: missing.append("Date & Time")
        if not booking.cuisine_preference: missing.append("Cuisine Preference")
        
        if missing:
            return f"ERROR: Missing information: {', '.join(missing)}. Please ask the user for these details before completing."
        
        # Success - Transition state
        booking.status = "seating"
        return SeatingSuggestion()


class SeatingSuggestion(Agent):
    """
    The Seating/Weather Agent.
    Responsibilities: Check weather, suggest seating, hand back to Host.
    """
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are the Seating Specialist.
            1. First, you MUST check the weather for the user's requested date using the tool.
            2. Based on the weather, suggest 'Outdoor' (if sunny/warm) or 'Indoor' (if raining/cold).
            3. Ask the user for their preference.
            4. Once a preference is saved, transfer them back to the Host.
            """,
        )

    async def on_enter(self) -> None:
        booking: BookingInfo = self.session.userdata
        await self.session.generate_reply(
            instructions=f"Tell {booking.guest_name} that you will check the weather forecast for {booking.preferred_date_time} to help choose the best table."
        )

    @function_tool()
    async def check_weather(self, context: RunContext):
        """Check the weather forecast for the booking date."""
        booking_info: BookingInfo = context.userdata
        
        # Simulate API Latency or Logic
        # In a real app, use `aiohttp` to fetch weather
        weather_report = "Clear skies, 24°C (75°F), gentle breeze."
        
        booking_info.weather_checked = True
        return f"Weather Report: {weather_report}"

    @function_tool()
    async def save_seating_preference(self, context: RunContext, seating: Literal["indoor", "outdoor"]):
        """Save the seating choice (indoor or outdoor)."""
        booking_info: BookingInfo = context.userdata
        booking_info.seating_preference = seating
        return "Seating preference saved."

    @function_tool()
    async def transfer_to_host(self, context: RunContext):
        """
        Call this after seating preference is saved to finalize the booking.
        """
        booking: BookingInfo = context.userdata
        if not booking.seating_preference:
            return "Error: You must save a seating preference (indoor/outdoor) before transferring."
            
        booking.status = "confirming"
        return Assistant()

# --- Server Setup ---

def prewarm(proc: JobProcess):
    """Load VAD model into memory for fast startup."""
    proc.userdata["vad"] = silero.VAD.load()

server = AgentServer()
server.setup_fnc = prewarm

@server.rtc_session()
async def my_agent(ctx: JobContext):
    # Setup context logger
    ctx.log_context_fields = {"room": ctx.room.name}

    # Initialize Session with Voice Pipeline
    session = AgentSession[BookingInfo](
        userdata=BookingInfo(),
        stt=inference.STT(model="assemblyai/universal-streaming", language="en"),
        llm=inference.LLM(model="openai/gpt-4o-mini"), # Updated to latest efficient model
        tts=inference.TTS(
            model="cartesia/sonic", 
            voice="9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    # Start with the Assistant (Host) Agent
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

    # Trigger the first interaction
    await ctx.room.local_participant.publish_data(
        payload="System: Agent connected. Waiting for user audio.",
        reliable=True
    )
    
    await ctx.connect()

if __name__ == "__main__":
    cli.run_app(server)
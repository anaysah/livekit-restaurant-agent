from livekit.agents import AgentTask, function_tool
from typing import Annotated
from dataclasses import dataclass
from src.dataclass import UserData
from src.variables import AVAILABLE_CUISINES, COLLECTION_TASK_INSTRUCTIONS, COMMON_RULES, MAX_RESERVATION_GUESTS, VALID_RESTAURANTS_TIME_RANGE
from datetime import datetime as dt
from pydantic import Field
from src.logger_config import agent_flow 
import re

        
class CollectReservationInfo(AgentTask[UserData]):
    TASK_SPECIFIC_CONTEXT: str = (
        f"Current datetime: {dt.now().strftime('%Y-%m-%d %H:%M')}\n "
        f"No of guests must be between 1 and {MAX_RESERVATION_GUESTS}.\n "
        f"Restaurant operating hours are from {VALID_RESTAURANTS_TIME_RANGE['opening_time']} to {VALID_RESTAURANTS_TIME_RANGE['closing_time']}.\n "
        f"Available cuisines are: {', '.join(AVAILABLE_CUISINES)}.\n"
    )
    def __init__(self, chat_ctx=None, tts=None) -> None:
        super().__init__(
            instructions=f"{COMMON_RULES} {COLLECTION_TASK_INSTRUCTIONS} \n {self.TASK_SPECIFIC_CONTEXT}",
            chat_ctx=chat_ctx,
            tts=tts
        )
        print( "📌 Initializing CollectInfoTask" )
        self.userdata: UserData = UserData()
        
    async def on_enter(self) -> None:
        print("📌 Entered CollectInfoTask")
        # self.session.generate_reply(
        #     instructions="Let's start collecting your information. Please provide your full name."
        # )
        
    @function_tool
    async def collect_name(
        self,
        name: Annotated[str, Field(description="User's full name")],
    ) -> str:
        """Collect and validate user's name."""
        print(f"📌 Collecting name: {name}")
        self.userdata["customer_name"] = name
        # return self._check_data_collection_complete("Name collected successfully.")
        return "Name collected successfully. Continue collecting remaining information."
        
    @function_tool
    async def collect_phone(
        self,
        phone: Annotated[str, Field(description="User's phone number")],
    ) -> str:
        """Collect and validate user's phone number."""
        print(f"📌 Collecting phone: {phone}")
        
        clean_phone = re.sub(r'\D', '', phone)  # Remove non-digit characters
        
        if len(clean_phone) != 10:
            print(f"❌ Invalid phone format: {clean_phone}")
            # LLM ko return message bhejo taaki wo user ko bataye
            return "Error: Invalid phone number. It must be exactly 10 digits. Please ask the user to repeat."
        
        self.userdata["customer_phone"] = phone
        # return self._check_data_collection_complete("Phone number collected successfully.")
        return "Phone number collected successfully. Continue collecting remaining information."
    
    @function_tool
    async def collect_guests(
        self,
        no_of_guests: Annotated[int, Field(description="Number of guests")],
    ) -> str:
        """Collect and validate number of guests."""
        print(f"📌 Collecting number of guests: {no_of_guests}")
        
        if no_of_guests <= 0 or no_of_guests > MAX_RESERVATION_GUESTS:
            print(f"❌ Invalid number of guests: {no_of_guests}")
            return f"Error: Invalid number of guests. Please provide a number between 1 and {MAX_RESERVATION_GUESTS}."
        
        self.userdata["no_of_guests"] = no_of_guests
        # return self._check_data_collection_complete("Number of guests collected successfully.")
        return "Number of guests collected successfully. Continue collecting remaining information."
    
    @function_tool
    async def collect_datetime(
        self,
        reservation_date: Annotated[str, Field(description="Reservation date (YYYY-MM-DD)")],
        reservation_time: Annotated[str, Field(description="Reservation time (HH:MM)")],
    ) -> str:
        """Collect and validate reservation date and time."""
        print(f"📌 Collecting reservation date: {reservation_date}, time: {reservation_time}")
        
        # Validate date format
        try:
            year, month, day = map(int, reservation_date.split("-"))
        except ValueError:
            return "Error: Invalid date format. Please ask the user to provide date in YYYY-MM-DD format."
        
        # Validate time format
        try:
            hour, minute = map(int, reservation_time.split(":"))
        except ValueError:
            return "Error: Invalid time format. Please ask the user to provide time in HH:MM format."
        
        # Validate ranges
        if not (1 <= month <= 12 and 1 <= day <= 31):
            return "Error: Invalid date. Please ask the user to provide a valid date."
        if not (0 <= hour <= 23 and 0 <= minute <= 59):
            return "Error: Invalid time. Please ask the user to provide a valid time."
        
        
        self.userdata["reservation_date"] = reservation_date
        self.userdata["reservation_time"] = reservation_time
        # return self._check_data_collection_complete("Reservation date and time collected successfully.")
        return "Reservation date and time collected successfully. Continue collecting remaining information."
    
    @function_tool
    async def collect_cuisine_preference(
        self,
        cuisine_preference: Annotated[str, Field(description="Cuisine preference")],
    ) -> str:
        """Collect user's cuisine preference."""
        print(f"📌 Collecting cuisine preference: {cuisine_preference}")
        
        # Validate cuisine preference
        if cuisine_preference.lower() not in [cuisine.lower() for cuisine in AVAILABLE_CUISINES]:
            print(f"❌ Invalid cuisine preference: {cuisine_preference}")
            return f"Error: Invalid cuisine preference. Available options are: {', '.join(AVAILABLE_CUISINES)}. Please ask the user choose from these."
        
        self.userdata["cuisine_preference"] = cuisine_preference
        # return self._check_data_collection_complete("Cuisine preference collected successfully.")
        return "Cuisine preference collected successfully. Continue collecting remaining information."
    
    @function_tool
    async def collect_special_requests(
        self,
        special_requests: Annotated[str, Field(description="Any special requests")],
    ) -> str:
        """Collect user's special requests."""
        print(f"📌 Collecting special requests: {special_requests}")
        
        self.userdata["special_requests"] = special_requests
        # return self._check_data_collection_complete("Special requests collected successfully.")
        return "Special requests collected successfully. Continue collecting remaining information."
        
    @function_tool
    async def check_data_collection_complete(self) -> str:
        """Check if all required data has been collected."""
        required_fields = [
            "customer_name",
            "customer_phone",
            "no_of_guests",
            "reservation_date",
            "reservation_time",
            "cuisine_preference",
            "special_requests",
        ]
        
        not_collected_fields = [field for field in required_fields if getattr(self.userdata, field) is None]
        if not_collected_fields:
            return f"Remaining information to collect: {', '.join(not_collected_fields)}."
        
        # self.session.generate_reply(
        #     instructions="All required information has been collected. You can now complete the task."
        # )
        return "Tell them all data completed. if they dont want to change anything then complete the task."
            
    @function_tool
    async def complete_task(self) -> None:
        """Call at the end to mark task as complete. necessary to call this"""
        print("📌 Completing CollectInfoTask")
        self.complete(self.userdata)
        # return "All required data collected. Task completed successfully."
            
    # on exit ache se kaam nahi karta task ke sath
    # 
    async def on_exit(self):
        print("📌 Exiting CollectInfoTask")
      
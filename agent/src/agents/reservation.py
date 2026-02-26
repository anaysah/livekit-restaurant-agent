from datetime import datetime as dt
from typing import Annotated
from pydantic import Field
import re

from src.agents.base import BaseAgent
from src.dataclass import UserData, RunContext_T, BOOKING_FORM_ID
from src.fn import send_to_ui
from src.variables import COMMON_RULES, COLLECTION_TASK_INSTRUCTIONS, MAX_RESERVATION_GUESTS, VALID_RESTAURANTS_TIME_RANGE
from src.logger_config import agent_flow

from livekit.agents import (
    function_tool,
)

from src.variables import (
    COLLECTION_TASK_INSTRUCTIONS,
    COMMON_RULES,
    MAX_RESERVATION_GUESTS,
    VALID_RESTAURANTS_TIME_RANGE,
)

class Reservation(BaseAgent):
    TASK_SPECIFIC_CONTEXT: str = (
        f"Current datetime: {dt.now().strftime('%Y-%m-%d %H:%M')}\n "
        f"No of guests must be between 1 and {MAX_RESERVATION_GUESTS}.\n "
        f"Restaurant operating hours are from {VALID_RESTAURANTS_TIME_RANGE['opening_time']} to {VALID_RESTAURANTS_TIME_RANGE['closing_time']}.\n "
    )
    
    def __init__(self, tts) -> None:
        super().__init__(
            instructions=f"{COMMON_RULES} {COLLECTION_TASK_INSTRUCTIONS} \n {self.TASK_SPECIFIC_CONTEXT}",
            tts=tts,
            # llm=models["llm"],
        )
        # self.userdata: UserData = UserData()
        
    @function_tool()
    async def get_todays_date_n_time(
        self, 
        context: RunContext_T,
        # ADDED DUMMY ARGUMENT
        request: Annotated[str, Field(description="Request for today's date and time")] = "today",
    ) -> str:
        """Get today's date and time for reference."""
        return dt.now().strftime("%Y-%m-%d_%H:%M:%S")
    
    @function_tool
    async def save_customer_name(
        self,
        name: Annotated[str, Field(description="User's full name")],
    ) -> str:
        """Save and validate user's name in Database."""
        agent_flow.info(f"📌 Collecting name: {name}")
        self.session.userdata["customer_name"] = name
        await send_to_ui(self.session.userdata.job_ctx, "FORM_PREFILL", {
            "formId": BOOKING_FORM_ID, "values": {"customer_name": name}
        })
        return "Name collected successfully. Continue collecting remaining information."
       
    @function_tool
    async def save_customer_phone(
        self,
        phone: Annotated[str, Field(description="User's phone number")],
    ) -> str:
        """Save and validate user's phone number in Database."""
        agent_flow.info(f"📌 Collecting phone: {phone}")
        
        clean_phone = re.sub(r'\D', '', phone)  # Remove non-digit characters
        
        if len(clean_phone) != 10:
            agent_flow.warning(f"❌ Invalid phone format: {clean_phone}")
            # LLM ko return message bhejo taaki wo user ko bataye
            return "Error: Invalid phone number. It must be exactly 10 digits. Please ask the user to repeat."
        
        self.session.userdata["customer_phone"] = phone
        await send_to_ui(self.session.userdata.job_ctx, "FORM_PREFILL", {
            "formId": BOOKING_FORM_ID, "values": {"customer_phone": phone}
        })
        # return self._check_data_collection_complete
        return "Phone number collected successfully. Continue collecting remaining information."
    
    @function_tool
    async def save_guests(
        self,
        no_of_guests: Annotated[int, Field(description="Number of guests")],
    ) -> str:
        """Save and validate number of guests in Database."""
        agent_flow.info(f"📌 Collecting number of guests: {no_of_guests}")
        
        if no_of_guests <= 0 or no_of_guests > MAX_RESERVATION_GUESTS:
            agent_flow.warning(f"❌ Invalid number of guests: {no_of_guests}")
            return f"Error: Invalid number of guests. Please provide a number between 1 and {MAX_RESERVATION_GUESTS}."
        
        self.session.userdata["no_of_guests"] = no_of_guests
        await send_to_ui(self.session.userdata.job_ctx, "FORM_PREFILL", {
            "formId": BOOKING_FORM_ID, "values": {"no_of_guests": no_of_guests}
        })
        # return self._check_data_collection_complete("Number of guests
        return "Number of guests collected successfully. Continue collecting remaining information."
    
    @function_tool
    async def save_reservation_date(
        self,
        reservation_date: Annotated[str, Field(description="Reservation date (YYYY-MM-DD)")],
    ) -> str:
        """Save and validate reservation date in Database."""
        agent_flow.info(f"📌 Collecting reservation date: {reservation_date}")

        try:
            year, month, day = map(int, reservation_date.split("-"))
            if not (1 <= month <= 12 and 1 <= day <= 31):
                return "Error: Invalid date. Please ask the user to provide a valid date."
        except ValueError:
            return "Error: Invalid date format. Please ask the user to provide date in YYYY-MM-DD format."

        self.session.userdata["reservation_date"] = reservation_date
        await send_to_ui(self.session.userdata.job_ctx, "FORM_PREFILL", {
            "formId": BOOKING_FORM_ID, "values": {"reservation_date": reservation_date}
        })
        return f"Reservation date {reservation_date} collected successfully. Continue collecting remaining information."

    @function_tool
    async def save_reservation_time(
        self,
        reservation_time: Annotated[str, Field(description="Reservation time (HH:MM)")],
    ) -> str:
        """Save and validate reservation time in Database."""
        agent_flow.info(f"📌 Collecting reservation time: {reservation_time}")

        try:
            hour, minute = map(int, reservation_time.split(":"))
        except ValueError:
            return "Error: Invalid time format. Please ask the user to provide time in HH:MM format."

        if not (0 <= hour <= 23 and 0 <= minute <= 59):
            return "Error: Invalid time. Please ask the user to provide a valid time."

        self.session.userdata["reservation_time"] = reservation_time
        await send_to_ui(self.session.userdata.job_ctx, "FORM_PREFILL", {
            "formId": BOOKING_FORM_ID, "values": {"reservation_time": reservation_time}
        })
        return f"Reservation time {reservation_time} collected successfully. Continue collecting remaining information."
    
    @function_tool
    async def save_special_requests(
        self,
        special_requests: Annotated[str, Field(description="Any special requests")],
    ) -> str:
        """Save user's special requests in Database."""
        agent_flow.info(f"📌 Collecting special requests: {special_requests}")
        
        self.session.userdata["special_requests"] = special_requests
        await send_to_ui(self.session.userdata.job_ctx, "FORM_PREFILL", {
            "formId": BOOKING_FORM_ID, "values": {"special_requests": special_requests}
        })
        # return self._check_data_collection_complete("Special
        return "Special requests collected successfully. Continue collecting remaining information."

    @function_tool
    async def save_table(
        self,
        table_id: Annotated[int, Field(description="Table number selected by the user")],
        table_seats: Annotated[int, Field(description="Number of seats at the selected table")],
    ) -> str:
        """Save the selected table and its seat count in Database."""
        agent_flow.info(f"📌 Collecting table: id={table_id}, seats={table_seats}")

        self.session.userdata["table_id"] = table_id
        self.session.userdata["table_seats"] = table_seats
        await send_to_ui(self.session.userdata.job_ctx, "FORM_PREFILL", {
            "formId": BOOKING_FORM_ID, "values": {"table_id": table_id, "table_seats": table_seats}
        })
        return f"Table {table_id} with {table_seats} seats saved successfully. Continue collecting remaining information."
        
    @function_tool
    async def check_data_collection_complete(
        self,
        dummy_attr: Annotated[str, Field(description="Dummy attribute to trigger completion check")]=None,
    ) -> str:
        """Check if all required data saved in Database"""
        required_fields = [
            "customer_name",
            "customer_phone",
            "no_of_guests",
            "reservation_date",
            "reservation_time",
            "special_requests",
        ]
        
        not_collected_fields = [
            field for field in required_fields
            if not self.session.userdata.get_field(BOOKING_FORM_ID, field)
        ]
        if not_collected_fields:
            return f"Remaining information to save: {', '.join(not_collected_fields)}."
        
        return "Tell them all data completed."

    async def on_exit(self):
        agent_flow.info("📌 Exiting CollectInfoTask")
        await super().on_exit()
      
from livekit.agents import AgentTask, function_tool
from typing import Annotated
from dataclasses import dataclass
from src.dataclass import UserData
from src.variables import COLLECTION_TASK_INSTRUCTIONS, COMMON_RULES, MAX_RESERVATION_GUESTS, VALID_RESTAURANTS_TIME_RANGE
from datetime import datetime as dt
from pydantic import Field
from src.logger_config import agent_flow 

# class CollectReservationInfo(AgentTask[UserData]):
#     def __init__(self, chat_ctx=None):
#         super().__init__(
#             instructions=COLLECTION_TASK_INSTRUCTIONS,
#             chat_ctx=chat_ctx,
            
#         )
#         self.userdata: UserData = UserData()

#     async def on_enter(self):
#         agent_flow.info("=" * 50)
#         agent_flow.info("📋 TASK ENTRY - CollectReservationInfo")
#         agent_flow.info(f"🔍 Task session: {self.session}")
#         agent_flow.info(f"🔍 Session TTS: {getattr(self.session, 'tts', 'NOT FOUND')}")
#         agent_flow.info(f"🔍 Session current_agent: {getattr(self.session, 'current_agent', 'NOT FOUND')}")
        
#         if hasattr(self.session, 'current_agent'):
#             current = self.session.current_agent
#             agent_flow.info(f"🔍 Current agent class: {current.__class__.__name__}")
#             agent_flow.info(f"🔍 Current agent TTS: {getattr(current, 'tts', 'NOT FOUND')}")
        
#         agent_flow.info("=" * 50)
        
#         # Try to send message
#         try:
#             await self._send_message("Welcome! Let's collect your reservation information.")
#         except Exception as e:
#             agent_flow.error(f"❌ ERROR in _send_message: {e}")
#             agent_flow.error(f"❌ Exception type: {type(e)}")
#             import traceback
#             agent_flow.error(traceback.format_exc())
            
#         # await self._send_message("Welcome! Let's collect your reservation information.")
    

#     @function_tool()
#     async def collect_phone_number(
#         self,
#         phone_number: Annotated[str, Field(description="Customer phone number")],
#     ) -> None:
#         """Collect and validate customer phone number."""
#         agent_flow.info(f"Collecting phone number: {phone_number}")
        
#         # check if phone number is valid (10 digits)
#         if not phone_number.isdigit() or not (len(phone_number) == 10):
#             await self._send_message("Invalid phone number. Please provide a 10-digit phone number.")
        
#         self.userdata["customer_phone"] = phone_number
        
#         await self._check_data_collection_complete()
    
#     @function_tool()
#     async def collect_customer_name(
#         self,
#         customer_name: Annotated[str, Field(description="Customer name")],
#     ) -> None:
#         """Collect customer name."""
#         agent_flow.info(f"Saving customer name: {customer_name}")
        
#         self.userdata["customer_name"] = customer_name
        
#         await self._check_data_collection_complete()
        
        
    
#     @function_tool()
#     async def collect_no_of_guests(
#         self,
#         no_of_guests: Annotated[int, Field(description="Number of guests")],
#     ) -> None:
#         """Collect number of guests."""
#         agent_flow.info(f"Saving number of guests: {no_of_guests}")
        
#         if no_of_guests <= 0 or no_of_guests > MAX_RESERVATION_GUESTS:
#             await self._send_message(f"Invalid number of guests. Please provide a number between 1 and {MAX_RESERVATION_GUESTS}.")
#             return
        
#         self.userdata["no_of_guests"] = no_of_guests
        
#         await self._check_data_collection_complete()
    
#     @function_tool()
#     async def collect_reservation_datetime(
#         self,
#         reservation_date: Annotated[str, Field(description="Reservation date (YYYY-MM-DD)")],
#         reservation_time: Annotated[str, Field(description="Reservation time (HH:MM)")],
#     ) -> None:
#         """Collect reservation date and time."""
#         agent_flow.info(f"Saving reservation date: {reservation_date}, time: {reservation_time}")
        
#         # check date format YYYY-MM-DD
#         try:
#             year, month, day = map(int, reservation_date.split("-"))
#         except ValueError:
#             await self._send_message("Invalid date format. Please provide date in YYYY-MM-DD format.")
#             return
        
#         # check time format HH:MM
#         try:
#             hour, minute = map(int, reservation_time.split(":"))
#         except ValueError:
#             await self._send_message("Invalid time format. Please provide time in HH:MM format.")
#             return
        
#         # check valid ranges
#         if not (1 <= month <= 12 and 1 <= day <= 31):
#             await self._send_message("Invalid date. Please provide a valid date.")
#             return
        
#         # check valid time ranges (00:00 to 23:59)
#         if not (0 <= hour <= 23 and 0 <= minute <= 59):
#             await self._send_message("Invalid time. Please provide a valid time.")
#             return
        
#         # check if reservation time is within restaurant hours 
#         opening_hour, opening_minute = map(int, VALID_RESTAURANTS_TIME_RANGE["opening_time"].split(":"))
#         closing_hour, closing_minute = map(int, VALID_RESTAURANTS_TIME_RANGE["closing_time"].split(":"))
#         if (hour < opening_hour or (hour == opening_hour and minute < opening_minute)) or \
#            (hour > closing_hour or (hour == closing_hour and minute > closing_minute)):
#             await self._send_message(f"Invalid reservation time. Please choose a time between {VALID_RESTAURANTS_TIME_RANGE['opening_time']} and {VALID_RESTAURANTS_TIME_RANGE['closing_time']}.")
#             return
        
#         # check if data and time is not in past
#         reservation_datetime_str = f"{reservation_date} {reservation_time}"
#         reservation_datetime = dt.strptime(reservation_datetime_str, "%Y-%m-%d %H:%M")
#         if reservation_datetime < dt.now():
#             await self._send_message("Invalid reservation datetime. Please provide a future date and time.")
#             return
        
#         self.userdata["reservation_date"] = reservation_date
#         self.userdata["reservation_time"] = reservation_time
        
#         await self._check_data_collection_complete()
#         # return "Reservation date and time collected successfully."
    
#     @function_tool()
#     async def collect_special_requests(
#         self,
#         special_requests: Annotated[str, Field(description="Special requests")],
#     ) -> None:
#         """Collect special requests."""
#         agent_flow.info(f"Saving special requests: {special_requests}")
        
#         self.userdata["special_requests"] = special_requests
        
#         await self._check_data_collection_complete()
#         # return "Special requests collected successfully."

#     async def _check_data_collection_complete(self):
#         required_fields = [
#             "customer_name",
#             "customer_phone",
#             "no_of_guests",
#             "reservation_time",
#             "reservation_date",
#             "cuisine_preference",
#             "special_requests",
#         ]
        
#         # check if all required fields are filled
#         if all(getattr(self.userdata, field) is not None for field in required_fields):
#             agent_flow.info("All required reservation information collected.")
#             self.complete(self.userdata)
#             return
        
#         await self.session.generate_reply(
#             instructions="Continue collecting remaining information."
#         )
        
#     async def _send_message(self, message: str):
#         await self.session.generate_reply(instructions=message)
    
#     # async def on_exit(self):
#     #     summary = self.userdata.summarize()
#     #     agent_flow.info("CollectionReservationInfo task exited")
        
        
class CollectReservationInfo(AgentTask[UserData]):
    def __init__(self, chat_ctx=None, tts=None) -> None:
        super().__init__(
            instructions=f"{COMMON_RULES} {COLLECTION_TASK_INSTRUCTIONS}",
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
    ) -> None:
        """Collect and validate user's name."""
        print(f"📌 Collecting name: {name}")
        self.userdata["customer_name"] = name
        self._check_data_collection_complete()
        
    @function_tool
    async def collect_phone(
        self,
        phone: Annotated[str, Field(description="User's phone number")],
    ) -> None:
        """Collect and validate user's phone number."""
        print(f"📌 Collecting phone: {phone}")
        self.userdata["customer_phone"] = phone
        self._check_data_collection_complete()
        
    def _check_data_collection_complete(self) -> None:
        """Check if all required data has been collected."""
        if self.userdata["customer_name"] and self.userdata["customer_phone"]:
            print("📌 All required data collected.")
            self.complete(self.userdata)
        else:
            self.session.generate_reply(
                instructions="Continue collecting remaining information."
            )
            
    
            
    # on exit ache se kaam nahi karta task ke sath
    # 
    async def on_exit(self):
        print("📌 Exiting CollectInfoTask")
      
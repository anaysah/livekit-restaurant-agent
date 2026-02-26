from datetime import datetime as dt
from typing import Annotated
from pydantic import Field
import re

from src.agents.base import BaseAgent
from src.dataclass import UserData, RunContext_T, BOOKING_FORM_ID, ORDER_FORM_ID
from src.fn import send_to_ui
from src.variables import COMMON_RULES, ORDER_FOOD_INSTRUCTIONS, MAX_RESERVATION_GUESTS, VALID_RESTAURANTS_TIME_RANGE
from src.logger_config import agent_flow

from livekit.agents import (
    function_tool,
    Agent,
)
from livekit.agents import llm

class OrderFood(BaseAgent):
    _context_form_id = ORDER_FORM_ID  # used by BaseAgent.on_enter initial log

    TASK_SPECIFIC_CONTEXT: str = (
        f"Current datetime: {dt.now().strftime('%Y-%m-%d %H:%M')}\n "
    )

    def __init__(self, tts) -> None:
        super().__init__(
            instructions=f"{COMMON_RULES} {ORDER_FOOD_INSTRUCTIONS} \n {self.TASK_SPECIFIC_CONTEXT}",
            tts=tts,
        )
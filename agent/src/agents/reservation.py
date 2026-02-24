from datetime import datetime as dt
from typing import Annotated
from src.agents.base import BaseAgent
from src.dataclass import UserData, RunContext_T
from src.variables import AVAILABLE_CUISINES, COMMON_RULES, COLLECTION_TASK_INSTRUCTIONS, MAX_RESERVATION_GUESTS, VALID_RESTAURANTS_TIME_RANGE
from pydantic import Field

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

from src.variables import (
    AVAILABLE_CUISINES,
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
        f"Available cuisines are: {', '.join(AVAILABLE_CUISINES)}.\n"
    )
    
    def __init__(self, tts) -> None:
        super().__init__(
            instructions=f"{COMMON_RULES} {COLLECTION_TASK_INSTRUCTIONS} \n {self.TASK_SPECIFIC_CONTEXT}",
            tts=tts,
            # llm=models["llm"],
        )
        
    @function_tool()
    async def get_todays_date_n_time(
        self, 
        context: RunContext_T,
        # ADDED DUMMY ARGUMENT
        request: Annotated[str, Field(description="Request for today's date and time")] = "today",
    ) -> str:
        """Get today's date and time for reference."""
        return dt.now().strftime("%Y-%m-%d_%H:%M:%S")
    
# agents/greeter.py

from src.agents.base import BaseAgent
from src.variables import COMMON_RULES, GREETER_INSTRUCTIONS
from src.dataclass import  RunContext_T
from typing import Annotated
from pydantic import Field
from src.fn import send_to_ui
from src.logger_config import agent_flow
from livekit.agents import (
    Agent,
    function_tool,
)



class Greeter(BaseAgent):    
    def __init__(self, tts) -> None:
        super().__init__(
            instructions=(
                f"""{COMMON_RULES} \n {GREETER_INSTRUCTIONS}"""
            ),
            # llm=models["llm"],
            tts=tts,
        )

    @function_tool()
    async def to_reservation(
        self,
        context: RunContext_T,
        request: Annotated[str, Field(description="User request confirmation")] = "reservation",
    ) -> tuple[Agent, str]:
        """Called when user wants to make a reservation."""
        userdata = context.userdata
        if userdata.job_ctx:
            await send_to_ui(
                userdata.job_ctx,
                "NAVIGATE_PAGE",
                {"page": "booking"}
            )
            agent_flow.info("🔄 Navigating user to booking page")
        return await self._transfer_to_agent("reservation", context)

    @function_tool()
    async def to_order_food(
        self,
        context: RunContext_T,
        request: Annotated[str, Field(description="User request confirmation")] = "order",
    ) -> tuple[Agent, str]:
        """Called when user wants to order food."""
        userdata = context.userdata
        if userdata.job_ctx:
            await send_to_ui(
                userdata.job_ctx,
                "NAVIGATE_PAGE",
                {"page": "order"}
            )
            agent_flow.info("🔄 Navigating user to order page")
        return await self._transfer_to_agent("order_food", context)
  
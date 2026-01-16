import logging
from dataclasses import dataclass, field
from typing import Annotated, Optional
from livekit.plugins import groq

import yaml
from dotenv import load_dotenv
from pydantic import Field

from livekit.agents import JobContext, WorkerOptions, cli, RunContext
from livekit.agents.llm import function_tool
from livekit.agents.voice import Agent, AgentSession
from livekit.agents.voice.room_io import RoomInputOptions
from livekit.plugins import deepgram, groq, silero

from livekit.agents.ipc.proc_pool import JobProcess

logger = logging.getLogger("restaurant-example")
logger.setLevel(logging.INFO)

load_dotenv(".env.local")

# Models configuration
models = {
    "llm": groq.LLM(model="llama-3.3-70b-versatile"),
    "tts": deepgram.TTS(model="aura-asteria-en"),
    "stt": deepgram.STT(),  # Using STT instead of STTv2
    "vad": silero.VAD.load(),
}

@dataclass
class UserData:
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    reservation_time: Optional[str] = None
    order: Optional[list[str]] = None
    customer_credit_card: Optional[str] = None
    customer_credit_card_expiry: Optional[str] = None
    customer_credit_card_cvv: Optional[str] = None
    expense: Optional[float] = None
    checked_out: Optional[bool] = None
    agents: dict[str, Agent] = field(default_factory=dict)
    prev_agent: Optional[Agent] = None

    def summarize(self) -> str:
        data = {
            "customer_name": self.customer_name or "unknown",
            "customer_phone": self.customer_phone or "unknown",
            "reservation_time": self.reservation_time or "unknown",
            "order": self.order or "unknown",
            "expense": self.expense or "unknown",
            "checked_out": self.checked_out or False,
        }
        return yaml.dump(data)

RunContext_T = RunContext[UserData]

# Common functions across agents
@function_tool()
async def update_name(
    context: RunContext_T,
    name: Annotated[str, Field(description="The customer's name")],
) -> str:
    """Called when the user provides their name."""
    context.userdata.customer_name = name
    return f"The name is updated to {name}"

@function_tool()
async def update_phone(
    context: RunContext_T,
    phone: Annotated[str, Field(description="The customer's phone number")],
) -> str:
    """Called when the user provides their phone number."""
    context.userdata.customer_phone = phone
    return f"The phone number is updated to {phone}"

@function_tool()
async def to_greeter(
    context: RunContext_T,
    # ADDED DUMMY ARGUMENT
    intent: Annotated[str, Field(description="The user's intent to switch context")] = "switch"
) -> tuple[Agent, str]:
    """Called when user asks unrelated questions."""
    curr_agent: BaseAgent = context.session.current_agent
    return await curr_agent._transfer_to_agent("greeter", context)

class BaseAgent(Agent):
    async def on_enter(self) -> None:
        agent_name = self.__class__.__name__
        logger.info(f"entering task {agent_name}")
        
        userdata: UserData = self.session.userdata
        chat_ctx = self.chat_ctx.copy()

        # Add previous agent's context
        if isinstance(userdata.prev_agent, Agent):
            truncated_chat_ctx = userdata.prev_agent.chat_ctx.copy(
                exclude_instructions=True, exclude_function_call=False
            ).truncate(max_items=6)
            existing_ids = {item.id for item in chat_ctx.items}
            items_copy = [item for item in truncated_chat_ctx.items if item.id not in existing_ids]
            chat_ctx.items.extend(items_copy)

        chat_ctx.add_message(
            role="system",
            content=f"You are {agent_name} agent. Current user data is {userdata.summarize()}",
        )
        await self.update_chat_ctx(chat_ctx)
        self.session.generate_reply(tool_choice="none")

    async def _transfer_to_agent(self, name: str, context: RunContext_T) -> tuple[Agent, str]:
        userdata = context.userdata
        current_agent = context.session.current_agent
        next_agent = userdata.agents[name]
        userdata.prev_agent = current_agent
        return next_agent, f"Transferring to {name}."

class Greeter(BaseAgent):
    def __init__(self, menu: str) -> None:
        super().__init__(
            instructions=(
                f"You are a friendly restaurant receptionist. The menu is: {menu}\n"
                "Your jobs are to greet the caller and understand if they want to "
                "make a reservation or order takeaway. Guide them to the right agent using tools."
            ),
            llm=models["llm"],
            tts=models["tts"]
        )
        self.menu = menu

    @function_tool()
    async def to_reservation(
        self,
        context: RunContext_T,
        # ADDED DUMMY ARGUMENT
        request: Annotated[str, Field(description="User request confirmation")] = "reservation",
    ) -> tuple[Agent, str]:
        """Called when user wants to make a reservation."""
        return await self._transfer_to_agent("reservation", context)

    @function_tool()
    async def to_takeaway(
        self,
        context: RunContext_T,
        # ADDED DUMMY ARGUMENT
        request: Annotated[str, Field(description="User request confirmation")] = "takeaway",
    ) -> tuple[Agent, str]:
        """Called when the user wants to place a takeaway order."""
        return await self._transfer_to_agent("takeaway", context)

class Reservation(BaseAgent):
    def __init__(self) -> None:
        super().__init__(
            instructions="You are a reservation agent at a restaurant. Your jobs are to ask for "
            "the reservation time, then customer's name, and phone number. Then "
            "confirm the reservation details with the customer.",
            tools=[update_name, update_phone, to_greeter],
            llm=models["llm"],
            tts=models["tts"]
        )

    @function_tool()
    async def update_reservation_time(
        self,
        context: RunContext_T,
        time: Annotated[str, Field(description="The reservation time")],
    ) -> str:
        """Called when the user provides their reservation time."""
        context.userdata.reservation_time = time
        return f"The reservation time is updated to {time}"

    @function_tool()
    async def confirm_reservation(
        self,
        context: RunContext_T,
        # ADDED DUMMY ARGUMENT
        confirmation: Annotated[str, Field(description="User confirmed details")] = "yes",
    ) -> str | tuple[Agent, str]:
        """Called when the user confirms the reservation."""
        userdata = context.userdata
        if not userdata.customer_name or not userdata.customer_phone:
            return "Please provide your name and phone number first."
        if not userdata.reservation_time:
            return "Please provide reservation time first."
        return await self._transfer_to_agent("greeter", context)

class Takeaway(BaseAgent):
    def __init__(self, menu: str) -> None:
        super().__init__(
            instructions=(
                f"Your are a takeaway agent that takes orders from the customer. "
                f"Our menu is: {menu}\n"
                "Clarify special requests and confirm the order with the customer."
            ),
            tools=[to_greeter],
            llm=models["llm"],
            tts=models["tts"]
        )

    @function_tool()
    async def update_order(
        self,
        context: RunContext_T,
        items: Annotated[list[str], Field(description="The items of the full order")],
    ) -> str:
        """Called when the user creates or updates their order."""
        context.userdata.order = items
        return f"The order is updated to {items}"

    @function_tool()
    async def to_checkout(
        self,
        context: RunContext_T,
        # ADDED DUMMY ARGUMENT
        action: Annotated[str, Field(description="User wants to checkout")] = "checkout",
    ) -> str | tuple[Agent, str]:
        """Called when the user confirms the order."""
        userdata = context.userdata
        if not userdata.order:
            return "No takeaway order found. Please make an order first."
        return await self._transfer_to_agent("checkout", context)

class Checkout(BaseAgent):
    def __init__(self, menu: str) -> None:
        super().__init__(
            instructions=(
                f"You are a checkout agent at a restaurant. The menu is: {menu}\n"
                "Your are responsible for confirming the expense of the "
                "order and then collecting customer's name, phone number and credit card "
                "information, including the card number, expiry date, and CVV step by step."
            ),
            tools=[update_name, update_phone, to_greeter],
            llm=models["llm"],
            tts=models["tts"]
        )

    @function_tool()
    async def confirm_expense(
        self,
        context: RunContext_T,
        expense: Annotated[float, Field(description="The expense of the order")],
    ) -> str:
        """Called when the user confirms the expense."""
        context.userdata.expense = expense
        return f"The expense is confirmed to be {expense}"

    @function_tool()
    async def update_credit_card(
        self,
        context: RunContext_T,
        number: Annotated[str, Field(description="The credit card number")],
        expiry: Annotated[str, Field(description="The expiry date")],
        cvv: Annotated[str, Field(description="The CVV")],
    ) -> str:
        """Called when the user provides credit card information."""
        userdata = context.userdata
        userdata.customer_credit_card = number
        userdata.customer_credit_card_expiry = expiry
        userdata.customer_credit_card_cvv = cvv
        return f"The credit card number is updated to {number}"

    @function_tool()
    async def confirm_checkout(
        self,
        context: RunContext_T,
        # ADDED DUMMY ARGUMENT
        final_confirm: Annotated[str, Field(description="Final confirmation")] = "yes",
    ) -> str | tuple[Agent, str]:
        """Called when the user confirms the checkout."""
        userdata = context.userdata
        if not userdata.expense:
            return "Please confirm the expense first."
        if not all([userdata.customer_credit_card, 
                   userdata.customer_credit_card_expiry, 
                   userdata.customer_credit_card_cvv]):
            return "Please provide the credit card information first."
        userdata.checked_out = True
        return await to_greeter(context)

    @function_tool()
    async def to_takeaway(
        self,
        context: RunContext_T,
        # ADDED DUMMY ARGUMENT
        action: Annotated[str, Field(description="Return to takeaway")] = "back",
    ) -> tuple[Agent, str]:
        """Called when the user wants to update their order."""
        return await self._transfer_to_agent("takeaway", context)

# def prewarm(proc: JobProcess):
#     proc.userdata["vad"] = silero.VAD.load()

# server = AgentServer()

# server.setup_fnc = prewarm

# @server.rtc_session()
# async def my_agent(ctx: JobContext):
#     # Logging setup
#     # Add any other context you want in all log entries here
#     ctx.log_context_fields = {
#         "room": ctx.room.name,
#     }

#     # Set up a voice AI pipeline using OpenAI, Cartesia, AssemblyAI, and the LiveKit turn detector
#     session = AgentSession[UserData](
#         userdata=UserData(),
#         stt=models["stt"],
#         llm=models["llm"],
#         tts=models["tts"],
#         turn_detection=MultilingualModel(),
#         vad=ctx.proc.userdata["vad"],
#         preemptive_generation=True,
#     )

#     # Start the session, which initializes the voice pipeline and warms up the models
#     await session.start(
#         agent=Assistant(),
#         room=ctx.room,
#         room_options=room_io.RoomOptions(
#             audio_input=room_io.AudioInputOptions(
#                 noise_cancellation=lambda params: noise_cancellation.BVCTelephony()
#                 if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
#                 else noise_cancellation.BVC(),
#             ),
#         ),
#     )

#     await ctx.room.local_participant.publish_data(
#         payload="Hello! Welcome to our restaurant. May I have your name?",
#         reliable=True
#     )

#     # Join the room and connect to the user
#     await ctx.connect()


async def entrypoint(ctx: JobContext):
    menu = "Pizza: $10, Salad: $5, Ice Cream: $3, Coffee: $2"
    userdata = UserData()
    userdata.agents.update({
        "greeter": Greeter(menu),
        "reservation": Reservation(),
        "takeaway": Takeaway(menu),
        "checkout": Checkout(menu),
    })
    
    session = AgentSession[UserData](
        userdata=userdata,
        stt=models["stt"],
        llm=models["llm"],
        tts=models["tts"],
        vad=models["vad"],
        max_tool_steps=5,
    )

    await session.start(
        agent=userdata.agents["greeter"],
        room=ctx.room,
        room_input_options=RoomInputOptions(),
    )

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))

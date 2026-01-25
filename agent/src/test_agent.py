from typing import Annotated
from dotenv import load_dotenv

from livekit import agents, rtc
from livekit.agents import AgentServer,AgentSession, Agent, AgentTask, function_tool, room_io
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from pydantic import Field
from src.dataclass import UserData

load_dotenv(".env.local")



class CollectInfoTask(AgentTask[UserData]):
    def __init__(self) -> None:
        super().__init__(
            instructions="Collect the user's name and phone number one by one.",
        )
        print( "📌 Initializing CollectInfoTask" )
        self.userdata: UserData = UserData()
        
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
            
    # def on_exit(self):
    #     print("✔ Exiting CollectInfoTask")
        

class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are a helpful voice AI assistant.
            Your task is to collect the user's name and phone number using the CollectInfoTask.
            one by one
            """,
        )
        
    async def on_enter(self) -> None:
        collect_info_task = CollectInfoTask()
        try:
            await collect_info_task
            user_data: UserData = collect_info_task.userdata
            
            print("🤖 Collected User Data:", user_data)
            
            await self.session.generate_reply(
                instructions=f"Thank you! I've collected your information: Name - {user_data['customer_name']}, Phone - {user_data['customer_phone']}."
            )
        except Exception as e:
            await self.session.say("Sorry, there was an error collecting your information.")
            # agents.logger.error(f"Error in CollectInfoTask: {e}")

server = AgentServer()

@server.rtc_session()
async def my_agent(ctx: agents.JobContext):
    session = AgentSession(
        stt="assemblyai/universal-streaming:en",
        llm="openai/gpt-4.1-mini",
        tts="cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
        vad=silero.VAD.load(),
        turn_detection=MultilingualModel(),
    )

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: noise_cancellation.BVCTelephony() if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP else noise_cancellation.BVC(),
            ),
        ),
    )

    await session.generate_reply(
        instructions="Greet the user and offer your assistance."
    )


if __name__ == "__main__":
    agents.cli.run_app(server)
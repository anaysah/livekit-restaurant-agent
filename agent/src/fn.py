from livekit.agents.llm import ChatContext
from livekit.agents import JobContext

import time
import random
import json

from src.logger_config import agent_flow

async def summarize_agent_handoff(
    previous_agent_chat_ctx: ChatContext,
    current_agent_chat_ctx: ChatContext,
    llm_v,  # self.session.llm
) -> ChatContext:
    chat_ctx = current_agent_chat_ctx.copy()

    full_prev_ctx = previous_agent_chat_ctx.copy(
        exclude_instructions=True,
        exclude_function_call=False,
    )

    items = full_prev_ctx.items  # ✅ items

    if len(items) > 6:
        older_ctx = full_prev_ctx.copy()
        older_ctx.items = items[:-6]  # ✅ items

        summarized = await older_ctx._summarize(llm_v=llm_v)

        existing_ids = {item.id for item in chat_ctx.items}
        for item in summarized.items:  # ✅ items
            if item.id not in existing_ids:
                chat_ctx.items.append(item)
                existing_ids.add(item.id)

        last_6 = items[-6:]
        for item in last_6:
            if item.id not in existing_ids:
                chat_ctx.items.append(item)
                existing_ids.add(item.id)
    else:
        existing_ids = {item.id for item in chat_ctx.items}
        for item in items:
            if item.id not in existing_ids:
                chat_ctx.items.append(item)
                existing_ids.add(item.id)
                
    agent_flow.info("Summarized previous agent context and merged with current context for handoff.")

    return chat_ctx



# Helper function to send messages to UI
async def send_to_ui(ctx: JobContext, type: str, payload: dict):
    """Send a message to the frontend via data channel"""
    message = {
        "id": f"msg_{int(time.time() * 1000)}_{random.randint(1000, 9999)}",
        "timestamp": int(time.time() * 1000),
        "type": type,
        "payload": payload
    }
    
    try:
        # Encode and send via data channel
        data = json.dumps(message).encode("utf-8")
        await ctx.room.local_participant.publish_data(
            payload=data,
            topic="agent-to-ui",
            destination_identities=[]  # Empty list for broadcast
        )
        agent_flow.info(f"📤 Sent to UI: {type} - {payload}")
    except Exception as e:
        agent_flow.error(f"❌ Failed to send message to UI {type} {payload} and error: {e}")
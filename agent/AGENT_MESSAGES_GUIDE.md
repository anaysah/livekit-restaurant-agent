# Agent Side - Message Protocol Guide

## 📡 Sending Messages from Agent (Python)

Yeh guide hai ki aap apne LiveKit agent se kaise messages send karoge.

---

## 🔌 Setup

```python
# agent/src/agent.py
import json
from livekit.agents import JobContext

async def send_to_ui(ctx: JobContext, topic: str, payload: dict):
    """Helper function to send messages to UI"""
    message = {
        "id": f"msg_{int(time.time() * 1000)}_{random.randint(1000, 9999)}",
        "timestamp": int(time.time() * 1000),
        "topic": topic,
        "direction": "to_ui",
        "payload": payload
    }
    
    # Send via data channel
    await ctx.room.local_participant.publish_data(
        json.dumps(message).encode("utf-8"),
        topic="agent-bridge"
    )
    
    print(f"[Agent] Sent to UI: {topic}", payload)
```

---

## 📨 Message Types

### 1. Navigate User

User ko kisi aur page par bhejo:

```python
await send_to_ui(ctx, "agent:navigation", {
    "to": "booking",  # Context name
    "route": "/booking",  # Optional: Next.js route
    "metadata": {
        "reason": "user_requested"
    }
})
```

**Use case**: User says "I want to make a reservation"

---

### 2. Prefill Form

Form fields ko automatically fill karo:

```python
await send_to_ui(ctx, "agent:form", {
    "context": "booking",
    "formId": "booking-form",
    "values": {
        "name": "John Doe",
        "email": "john@example.com",
        "date": "2024-02-15",
        "time": "19:00",
        "guests": "4"
    },
    "merge": True  # True = merge with existing, False = replace all
})
```

**Use case**: User ne conversation mein details di, ab form prefill kar do

---

### 3. UI Command

Specific UI actions trigger karo:

```python
# Navigate
await send_to_ui(ctx, "agent:command", {
    "command": "navigate",
    "data": {"route": "/menu"}
})

# Scroll to element
await send_to_ui(ctx, "agent:command", {
    "command": "scroll",
    "target": "#special-offers"
})

# Focus on field
await send_to_ui(ctx, "agent:command", {
    "command": "focus",
    "target": "#email-input"
})

# Submit form
await send_to_ui(ctx, "agent:command", {
    "command": "submit",
    "target": "#booking-form"
})

# Show/Hide elements
await send_to_ui(ctx, "agent:command", {
    "command": "show",
    "target": ".special-offer-banner"
})

# Trigger custom action
await send_to_ui(ctx, "agent:command", {
    "command": "show-special-offer",  # From action registry
    "data": {"discount": 20}
})
```

---

### 4. Trigger Task

Background tasks trigger karo:

```python
await send_to_ui(ctx, "agent:task", {
    "taskId": "fetch-available-slots",
    "params": {
        "date": "2024-02-15",
        "restaurant_id": "loc_123"
    }
})
```

---

## 📥 Receiving Messages from UI

UI se yeh messages aayenge:

### 1. Context Change

```python
# Message format:
{
    "topic": "ui:context",
    "direction": "to_agent",
    "payload": {
        "from": "home",
        "to": "booking",
        "metadata": {...}
    }
}
```

**Handle karo**:
```python
async def handle_context_change(ctx: JobContext, payload: dict):
    new_context = payload["to"]
    
    if new_context == "booking":
        # Switch to booking agent/mode
        ctx.llm.set_system_prompt("You are a restaurant booking assistant...")
        await ctx.say("I can help you make a reservation!")
    
    elif new_context == "ordering":
        # Switch to ordering mode
        ctx.llm.set_system_prompt("You are a food ordering assistant...")
        await ctx.say("Let me help you order some delicious food!")
```

---

### 2. Form Update

```python
# Message format:
{
    "topic": "ui:form",
    "direction": "to_agent",
    "payload": {
        "context": "booking",
        "formId": "booking-form",
        "field": "date",
        "value": "2024-02-15",
        "allValues": {
            "name": "John",
            "date": "2024-02-15",
            "time": "19:00"
        }
    }
}
```

**Handle karo**:
```python
async def handle_form_update(ctx: JobContext, payload: dict):
    field = payload["field"]
    value = payload["value"]
    all_values = payload["allValues"]
    
    # Track what user is filling
    if field == "date":
        # Check availability for that date
        available = await check_availability(value)
        if not available:
            await ctx.say(f"Sorry, {value} is fully booked. How about tomorrow?")
    
    # Check if form is complete
    required_fields = ["name", "date", "time", "guests"]
    if all(all_values.get(f) for f in required_fields):
        await ctx.say("Great! All details are filled. Ready to confirm?")
```

---

### 3. User Action

```python
# Message format:
{
    "topic": "ui:action",
    "direction": "to_agent",
    "payload": {
        "context": "booking",
        "action": "submit-booking",
        "data": {
            "formId": "booking-form",
            "formData": {...}
        }
    }
}
```

**Handle karo**:
```python
async def handle_user_action(ctx: JobContext, payload: dict):
    action = payload["action"]
    data = payload.get("data", {})
    
    if action == "submit-booking":
        form_data = data.get("formData", {})
        # Process booking
        result = await create_booking(form_data)
        
        if result.success:
            await ctx.say(f"Perfect! Your table for {form_data['guests']} is booked!")
        else:
            await ctx.say("Oops! There was an issue. Let me help you with that.")
```

---

## 🎯 Complete Example

```python
# agent/src/agent.py

import json
from livekit.agents import JobContext, WorkerOptions, cli
from livekit.plugins import openai

async def entrypoint(ctx: JobContext):
    await ctx.connect()
    
    # Current context tracking
    current_context = "home"
    form_states = {}
    
    # Listen to data channel
    @ctx.room.on("data_received")
    async def on_data_received(data_packet):
        nonlocal current_context, form_states
        
        try:
            message = json.loads(data_packet.data.decode("utf-8"))
            
            if message["direction"] != "to_agent":
                return
            
            topic = message["topic"]
            payload = message["payload"]
            
            # Route messages
            if topic == "ui:context":
                current_context = payload["to"]
                print(f"[Agent] Context changed to: {current_context}")
                
                # Change behavior based on context
                if current_context == "booking":
                    await ctx.say("I can help you book a table! What date works for you?")
                elif current_context == "ordering":
                    await ctx.say("Let's order some food! What are you craving?")
            
            elif topic == "ui:form":
                form_id = payload["formId"]
                form_states[form_id] = payload["allValues"]
                
                # React to form changes
                if payload["field"] == "date":
                    date = payload["value"]
                    await ctx.say(f"Looking for {date}... Let me check availability!")
            
            elif topic == "ui:action":
                action = payload["action"]
                
                if action == "submit-booking":
                    # Process booking
                    await ctx.say("Confirming your reservation...")
                    # ... booking logic ...
                    await ctx.say("Done! You'll receive a confirmation email.")
        
        except Exception as e:
            print(f"[Agent] Error handling message: {e}")
    
    # Assistant logic
    assistant = openai.AssistantCreate(
        model="gpt-4",
        name="Restaurant Assistant",
        instructions="You are a helpful restaurant assistant..."
    )
    
    # When user says "I want to book a table"
    # Trigger navigation:
    await send_to_ui(ctx, "agent:navigation", {
        "to": "booking",
        "route": "/booking"
    })
    
    # When you have user's info from conversation
    # Prefill the form:
    await send_to_ui(ctx, "agent:form", {
        "formId": "booking-form",
        "values": {
            "name": "extracted from speech",
            "guests": "2"
        }
    })


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
```

---

## 🔄 State Management Strategy

Agent ko track karna chahiye:

1. **Current Context**: User kis page/form par hai
2. **Form States**: User ne kya fill kiya hai
3. **Intent**: User kya karna chahta hai
4. **Conversation History**: Previous messages

```python
class AgentState:
    def __init__(self):
        self.current_context = "home"
        self.form_states = {}
        self.user_intent = None
        self.history = []
    
    def update_context(self, context):
        self.history.append({
            "type": "context_change",
            "from": self.current_context,
            "to": context,
            "timestamp": time.time()
        })
        self.current_context = context
    
    def update_form(self, form_id, values):
        self.form_states[form_id] = values
    
    def get_context(self):
        return {
            "current_context": self.current_context,
            "form_states": self.form_states,
            "intent": self.user_intent
        }
```

---

## 💡 Tips

1. **Debounce form updates**: UI har keystroke par message send karega, agent ko handle karna hoga
2. **Validate before prefilling**: Form values ko validate karo before sending
3. **User feedback**: Jab bhi action perform karo, user ko batao (via TTS)
4. **Error handling**: Messages fail ho sakte hain, try-catch use karo
5. **Logging**: Sab messages log karo for debugging

---

## 🐛 Debugging

```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Log all incoming messages
@ctx.room.on("data_received")
async def on_data(data_packet):
    print(f"[DEBUG] Received: {data_packet.data.decode('utf-8')}")
```

Frontend console mein bhi logs dikhenge:
- `[AgentBridge] Sent to agent: ...`
- `[AgentBridge] Received from agent: ...`

---

Iske saath aapka bidirectional communication setup complete hai! 🎉

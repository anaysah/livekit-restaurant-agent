# 🧪 Testing Auto-Navigation Feature

## ✅ Implementation Complete!

Jab user bole **"I want to make a reservation"**, toh automatically frontend par **`/booking`** page open ho jayega.

---

## 🔧 Changes Made

### 1. **Agent Side** (`agent/src/agent.py`)

**Helper Function Added:**
```python
async def send_to_ui(ctx: JobContext, topic: str, payload: dict):
    """Send a message to the frontend via data channel"""
```

**Greeter Agent Updated:**
```python
@function_tool()
async def to_reservation(self, context: RunContext_T, ...):
    # Now sends navigation message before transfer
    await send_to_ui(
        userdata.job_ctx,
        "agent:navigation",
        {
            "to": "booking",
            "route": "/booking",
            ...
        }
    )
    return await self._transfer_to_agent("reservation", context)
```

### 2. **UserData Enhanced** (`agent/src/dataclass.py`)

```python
@dataclass
class UserData:
    # ... existing fields
    job_ctx: Optional[any] = None  # Store JobContext for sending messages
```

---

## 🧪 How to Test

### Step 1: Start Frontend

```bash
cd frontend
pnpm dev
```

Frontend will run on: `http://localhost:3000`

### Step 2: Start Agent

```bash
cd agent
python src/agent.py dev
```

### Step 3: Open Browser

1. Go to: `http://localhost:3000`
2. Open **Browser Console** (F12 → Console tab)
3. Connect to the agent (mic button)

### Step 4: Test Voice Command

Say any of these:
- **"I want to make a reservation"**
- **"Can I book a table?"**
- **"I'd like to reserve a table"**
- **"Book a table please"**

### Step 5: Watch Magic Happen! ✨

You should see:

**In Browser Console:**
```
[AgentBridge] Received from agent: {
  topic: "agent:navigation",
  payload: { to: "booking", route: "/booking" }
}
[AgentBridge] Auto-navigated to: booking
```

**In UI:**
- Page automatically switches to booking form
- URL changes to `/booking`
- Agent says something like "Let me help you with that..."

**In Agent Console:**
```
📤 Sent to UI: agent:navigation - {'to': 'booking', 'route': '/booking'}
🔄 Navigating user to booking page
🚀 ENTERING AGENT: Reservation
```

---

## 🎯 What's Happening Behind the Scenes

### 1. Voice Recognition
```
User speaks → STT → "I want to make a reservation"
```

### 2. Intent Detection
```
LLM detects intent → Calls to_reservation() function tool
```

### 3. Message Sent
```
Agent → Data Channel → Frontend
Message: {"topic": "agent:navigation", "payload": {...}}
```

### 4. Frontend Receives
```
useAgentBridge receives message → 
useAgentCommands handles it → 
router.push("/booking")
```

### 5. Context Update
```
Frontend updates context to "booking" →
Sends context change back to agent →
Agent switches to Reservation mode
```

---

## 🐛 Troubleshooting

### Navigation not working?

**Check 1: Frontend logs**
```
Open Console → Look for:
[AgentBridge] Received from agent: ...
```
If not visible → Agent message not reaching frontend

**Check 2: Agent logs**
```
Look for:
📤 Sent to UI: agent:navigation
```
If not visible → Agent not sending message

**Check 3: Data Channel**
```
Console → Network tab → Look for "agent-bridge"
```
If not visible → Data channel not connected

**Check 4: Route exists**
```
Try manually: http://localhost:3000/booking
```
If 404 → Route issue

### Agent not calling function?

**Check: LLM Model**
```python
# Make sure you're using a model with function calling
"llm": openai.LLM.with_cerebras(
    model="qwen-3-32b",
    tool_choice="auto",  # Important!
)
```

### Message sent but nothing happens?

**Check: AgentBridgeProvider**
```tsx
// ChatWithSession.tsx should have:
<AgentBridgeProvider>
  <AgentChatUI />
</AgentBridgeProvider>
```

---

## 📊 Success Indicators

### ✅ Working Correctly:
- User speaks → Page navigates automatically
- Console shows message sent/received
- No errors in console
- Agent enters Reservation mode

### ❌ Not Working:
- User speaks → Nothing happens
- Console errors visible
- No message in logs
- Agent doesn't transfer

---

## 🎉 Next Steps

Once this works, you can:

1. **Add More Navigation Commands**
   - "Show me the menu" → `/menu`
   - "I want to order food" → `/order`

2. **Add Form Prefilling**
   - Agent extracts name from speech
   - Sends form prefill message
   - Form auto-fills

3. **Add Context Awareness**
   - User clicks booking page manually
   - Agent receives context change
   - Agent switches mode automatically

---

## 🔍 Debug Commands

### Check if data channel is working:

**Browser Console:**
```javascript
// Should see data channel in room
console.log(room.dataChannels);
```

**Agent Side:**
```python
# Add in my_agent function:
print(f"📡 Room participants: {ctx.room.participants}")
print(f"📡 Local participant: {ctx.room.local_participant}")
```

### Manual test message:

**Agent Console (Python):**
```python
# Add this after session.start()
await ctx.room.local_participant.publish_data(
    json.dumps({"test": "message"}).encode("utf-8"),
    topic="agent-bridge"
)
print("✅ Test message sent")
```

**Browser Console:**
```
Should see: [AgentBridge] Received from agent: {test: "message"}
```

---

## 📝 Summary

**What's Implemented:**
- ✅ Agent can send navigation commands
- ✅ Frontend receives and executes them  
- ✅ Automatic page switching on voice command
- ✅ Context tracking

**What's Next:**
- ⏭️ Form prefilling
- ⏭️ Bidirectional sync
- ⏭️ More commands (scroll, focus, etc.)

---

## 🚀 Quick Test Script

Copy-paste this to test quickly:

```bash
# Terminal 1
cd frontend && pnpm dev

# Terminal 2  
cd agent && python src/agent.py dev

# Browser
# 1. Open http://localhost:3000
# 2. Connect mic
# 3. Say: "I want to make a reservation"
# 4. Watch page change to /booking
```

**Enjoy your auto-navigation feature!** 🎊

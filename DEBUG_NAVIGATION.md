# 🔧 Debug Guide - Fixing Navigation Issue

## Changes Made

### 1. **Enhanced Logging** (Frontend)
- Added detailed console logs in `useAgentBridge.tsx`
- Added navigation logs in `useAgentCommands.tsx`
- Shows exactly what messages are being received

### 2. **Debug Component** (Frontend)
- Created `DebugDataChannel.tsx`
- Shows data channel connection status
- Displays last received message
- **Yellow banner at top of chat**

### 3. **Test Message** (Agent)
- Agent now sends test message on connection
- Verifies data channel is working
- Logs success/failure

---

## 🧪 Step-by-Step Testing

### Step 1: Start Everything

```bash
# Terminal 1
cd frontend
pnpm dev

# Terminal 2
cd agent
python src/agent.py dev
```

### Step 2: Open Browser

Go to: `http://localhost:3000`

**Look for:**
- Yellow debug banner at top of chat saying "Data Channel Status: ✅ Connected"

### Step 3: Connect to Agent

Click the mic/connect button

**Watch for:**

**In Browser Console (F12):**
```
🔵 [DEBUG] Data channel send function: Available ✅
🟢 [DEBUG] Data channel message received: {"topic": "agent:command", ...}
[AgentBridge] 🔵 RAW MESSAGE RECEIVED: ...
[AgentBridge] 📦 PARSED MESSAGE: ...
```

**In Agent Console:**
```
🧪 Testing data channel connection...
📤 Sent to UI: agent:command - {'command': 'test', ...}
✅ Test message sent successfully
```

### Step 4: Test Navigation

Say: **"I want to make a reservation"**

**Watch for:**

**Agent Console:**
```
📤 Sent to UI: agent:navigation - {'to': 'booking', 'route': '/booking'}
🔄 Navigating user to booking page
🚀 ENTERING AGENT: Reservation
```

**Browser Console:**
```
[AgentBridge] 🔵 RAW MESSAGE RECEIVED: {"topic":"agent:navigation",...}
[AgentBridge] 📦 PARSED MESSAGE: {topic: "agent:navigation", ...}
[AgentBridge] ✅ Processing UI message: agent:navigation
[AgentCommands] 🧭 Navigation message received: ...
[AgentCommands] 🧭 Route: /booking Context: booking
[AgentCommands] 🚀 Navigating to: /booking
```

**UI:**
- Page should switch to booking form
- URL should change to `/booking`

---

## 🔍 Troubleshooting

### Issue 1: Data Channel Not Connected

**Symptom:**
```
🔵 [DEBUG] Data channel send function: Not available ❌
```

**Fix:**
1. Check if `AgentBridgeProvider` is wrapped properly in `ChatWithSession.tsx`
2. Restart both frontend and agent
3. Clear browser cache

---

### Issue 2: Test Message Not Received

**Symptom:**
- Agent logs show "✅ Test message sent"
- But browser doesn't show "🟢 [DEBUG] Data channel message received"

**Possible causes:**
1. **Data channel topic mismatch**
   - Agent sends to: `"agent-bridge"`
   - Frontend listens to: `"agent-bridge"`
   - Should match ✅

2. **Message sent before participant joined**
   - Wait a bit before sending test message
   - Add delay if needed

**Fix:** Add delay in agent code:
```python
await ctx.connect()
await asyncio.sleep(1)  # Wait for participant to join
await send_to_ui(ctx, "agent:command", {...})
```

---

### Issue 3: Navigation Message Received but Not Working

**Symptom:**
- Browser shows: `[AgentBridge] ✅ Processing UI message: agent:navigation`
- But page doesn't change

**Check:**
1. Is `useAgentCommands` being called?
   - Should be in `AgentBridgeProvider` ✅

2. Is router working?
   ```bash
   # Test manually in browser console:
   window.location.href = '/booking'
   ```

3. Is `/booking` route valid?
   ```bash
   # Try manually: http://localhost:3000/booking
   ```

**Fix:** If route doesn't exist, check:
```
frontend/app/@website/booking/page.tsx should exist ✅
```

---

### Issue 4: Function Tool Not Being Called

**Symptom:**
- Say "I want to make a reservation"
- Agent doesn't call `to_reservation()` function

**Check:**
1. **LLM supports function calling?**
   ```python
   # In agent.py
   "llm": openai.LLM.with_cerebras(
       model="qwen-3-32b",
       tool_choice="auto",  # Must be "auto" or "required"
   )
   ```

2. **Function tool properly decorated?**
   ```python
   @function_tool()
   async def to_reservation(self, context, ...):
   ```

**Try different phrases:**
- "I want to book a table"
- "Can I make a reservation?"
- "Book a table for 2"

---

## 📊 Expected Output

### ✅ Everything Working:

**Agent logs:**
```
🧪 Testing data channel connection...
📤 Sent to UI: agent:command - {'command': 'test', ...}
✅ Test message sent successfully
... (user speaks) ...
📤 Sent to UI: agent:navigation - {'to': 'booking', 'route': '/booking'}
🔄 Navigating user to booking page
🚀 ENTERING AGENT: Reservation
```

**Browser console:**
```
🔵 [DEBUG] Data channel send function: Available ✅
🟢 [DEBUG] Data channel message received: ...
[AgentBridge] 🔵 RAW MESSAGE RECEIVED: ...
[AgentBridge] 📦 PARSED MESSAGE: ...
[AgentBridge] ✅ Processing UI message: agent:navigation
[AgentCommands] 🧭 Route: /booking
[AgentCommands] 🚀 Navigating to: /booking
```

**UI:**
- Yellow banner shows "✅ Connected"
- Page navigates to booking
- Agent enters Reservation mode

---

## 🐛 Common Issues & Solutions

### 1. "Data channel not connected"
**Solution:** Restart both frontend and agent

### 2. "Message received but nothing happens"
**Solution:** Check browser console for errors, ensure AgentBridgeProvider is wrapped

### 3. "Agent doesn't call function"
**Solution:** Try clearer phrases, check LLM supports function calling

### 4. "Page exists but navigation doesn't work"
**Solution:** Check Next.js router is working, try manual navigation

---

## 🧹 After Testing

Once everything works, remove the debug component:

```tsx
// components/AgentChatUI.tsx
// Remove this line:
import { DebugDataChannel } from "@/components/DebugDataChannel";

// And remove this:
<DebugDataChannel />
```

---

## 📞 Quick Debug Commands

**Test data channel manually:**

**Frontend (Browser Console):**
```javascript
// Check if data channel exists
console.log("Data channels:", room?.dataChannels);
```

**Agent (Python):**
```python
# Add after ctx.connect()
print(f"Room: {ctx.room.name}")
print(f"Participants: {list(ctx.room.participants.keys())}")
```

---

## ✅ Success Checklist

- [ ] Yellow debug banner shows "✅ Connected"
- [ ] Test message appears in browser console
- [ ] Saying reservation phrase calls function
- [ ] Navigation message sent (agent logs)
- [ ] Navigation message received (browser logs)
- [ ] Page navigates to `/booking`
- [ ] Agent enters Reservation mode

---

**Agar sab kaam kar gaya toh debug component remove kar do aur production ready hai!** 🎉

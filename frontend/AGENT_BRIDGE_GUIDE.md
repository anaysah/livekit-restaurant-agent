# Agent Bridge System - Usage Guide

## 🎯 Overview

Yeh system aapko **bidirectional communication** provide karta hai UI aur AI Agent ke beech. Aap easily forms add kar sakte ho aur automatic sync hota rahega.

## 📦 What's Included

### 1. **Type Definitions** (`types/agent-bridge.ts`)
- Message protocols for UI ↔ Agent communication
- Type-safe message handling
- All message topics defined

### 2. **State Management** (`lib/store/app-store.ts`)
- Zustand store for app state
- Form states management
- Context tracking
- Navigation history

### 3. **Agent Bridge** (`hooks/useAgentBridge.tsx`)
- Main hook for sending/receiving messages
- Data channel wrapper
- Message routing

### 4. **Sync Hooks**
- `useContextSync`: Auto-sync context changes
- `useFormSync`: Auto-sync form field changes
- `useAgentCommands`: Handle agent commands

### 5. **Action Registry** (`lib/actions/action-registry.ts`)
- Define actions that can be triggered
- Agent can trigger UI actions by ID
- Easy to extend

---

## 🚀 Quick Start

### Step 1: Wrap Your App

Apne layout mein `AgentBridgeProvider` add karo:

```tsx
// app/layout.tsx
import { AgentBridgeProvider } from "@/components/AgentBridgeProvider";
import { AgentSessionProvider } from "@/components/agents-ui/agent-session-provider";

export default function Layout({ children }) {
  const session = useSession(); // Your LiveKit session

  return (
    <AgentSessionProvider session={session}>
      <AgentBridgeProvider>
        {children}
      </AgentBridgeProvider>
    </AgentSessionProvider>
  );
}
```

### Step 2: Create a Form

Form component mein `useFormSync` hook use karo:

```tsx
// components/MyForm.tsx
import { useFormSync } from "@/hooks/useFormSync";
import { useAppStore } from "@/lib/store/app-store";

export default function MyForm() {
  const { formState, updateField, sendAction } = useFormSync("my-form-id");
  const setContext = useAppStore((state) => state.setContext);

  useEffect(() => {
    setContext("my-context"); // Set context when form loads
  }, []);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      sendAction("submit-form", { formData: formState });
    }}>
      <input
        value={formState.name || ""}
        onChange={(e) => updateField("name", e.target.value)}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

**Bas itna! Ab:**
- ✅ Form changes automatically agent ko send ho rahe hain
- ✅ Context change agent ko pata chal raha hai
- ✅ Agent can prefill/modify form data

---

## 📨 Message Flow

### UI → Agent

```tsx
const { sendToAgent } = useAgentBridge();

// Context change
sendToAgent({
  topic: MessageTopic.CONTEXT_CHANGE,
  payload: { from: "home", to: "booking" }
});

// Form update
sendToAgent({
  topic: MessageTopic.FORM_UPDATE,
  payload: {
    context: "booking",
    formId: "booking-form",
    field: "date",
    value: "2024-02-15",
    allValues: { ... }
  }
});

// User action
sendToAgent({
  topic: MessageTopic.USER_ACTION,
  payload: { context: "booking", action: "submit-booking" }
});
```

### Agent → UI

Agent Python code se yeh messages send kar sakta hai:

```python
# Navigate user to booking page
await session.send_data({
    "topic": "agent:navigation",
    "direction": "to_ui",
    "payload": {
        "to": "booking",
        "route": "/booking"
    }
})

# Prefill form
await session.send_data({
    "topic": "agent:form",
    "direction": "to_ui",
    "payload": {
        "formId": "booking-form",
        "values": {
            "name": "John Doe",
            "date": "2024-02-15",
            "time": "19:00"
        }
    }
})

# Trigger UI command
await session.send_data({
    "topic": "agent:command",
    "direction": "to_ui",
    "payload": {
        "command": "scroll",
        "target": "#booking-section"
    }
})
```

---

## 🎬 Advanced Usage

### Register Custom Actions

```tsx
import actionRegistry from "@/lib/actions/action-registry";

actionRegistry.register({
  id: "show-special-offer",
  name: "Show Special Offer",
  context: ["ordering"],
  handler: (params) => {
    // Show modal, update UI, etc.
    showModal("Special Offer!", params.offerDetails);
  }
});

// Agent can trigger: { command: "show-special-offer", data: { ... } }
```

### Listen to Agent Messages

```tsx
const { onMessage } = useAgentBridge();

useEffect(() => {
  const unsubscribe = onMessage(MessageTopic.TASK_TRIGGER, (message) => {
    console.log("Agent triggered task:", message.payload.taskId);
  });

  return unsubscribe; // Cleanup
}, []);
```

### Manual Context Switch

```tsx
import { useAppStore } from "@/lib/store/app-store";

const setContext = useAppStore((state) => state.setContext);

// User clicks "Order Food"
setContext("ordering"); // Automatically syncs with agent!
```

---

## 🧪 Testing

### Check Console Logs

Browser console mein dekho:
- `[AgentBridge] Sent to agent: ...`
- `[AgentBridge] Received from agent: ...`
- `[ContextSync] Context changed: ...`

### Debug Form State

Forms mein debug section hai jo current state show karta hai.

---

## 🔧 Customization

### Add New Context

```tsx
// types/agent-bridge.ts
export type AppContext = 
  | "home" 
  | "booking" 
  | "ordering" 
  | "profile"
  | "support"
  | "my-new-context";  // Add karo
```

### Add New Message Topic

```tsx
// types/agent-bridge.ts
export enum MessageTopic {
  // ... existing
  MY_NEW_TOPIC = "ui:my-topic",
}
```

---

## 💡 Best Practices

1. **Context ko sahi set karo**: Har form/page load par context set karo
2. **Immediate updates**: Important fields ke liye `updateField(field, value, true)` use karo
3. **Actions use karo**: Complex operations ke liye action registry use karo
4. **Error handling**: Agent messages ko try-catch mein wrap karo

---

## 🐛 Troubleshooting

**Messages nahi ja rahe?**
- Check if `AgentBridgeProvider` wrapped hai
- Check if LiveKit session connected hai
- Console logs dekho

**Form state update nahi ho raha?**
- Correct `formId` use kar rahe ho?
- `useFormSync` hook use kiya hai?

**Agent commands kaam nahi kar rahe?**
- `useAgentCommands` hook registered hai?
- Message format sahi hai?

---

## 📚 Examples

- **Booking Form**: `components/website/booking-form.tsx`
- **Order Form**: `components/website/order-form.tsx`

Bas in examples ko dekho aur apne forms mein same pattern follow karo!

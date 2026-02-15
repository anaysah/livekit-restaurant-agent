# 🚀 Integration Example

## Quick Integration Steps

### Step 1: Update ChatWithSession.tsx

Add `AgentBridgeProvider` inside `AgentSessionProvider`:

```tsx
"use client"

// components/ChatWithSession.tsx

import { useMemo } from 'react'
import { TokenSource } from 'livekit-client'
import { useSession } from '@livekit/components-react'
import { APP_CONFIG_DEFAULTS } from '@/app-config'
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider'
import { AgentBridgeProvider } from '@/components/AgentBridgeProvider'  // ✅ Add this
import AgentChatUI from '@/components/AgentChatUI'

export default function ChatWithSession() {
  const tokenSource = useMemo(() => {
    return TokenSource.endpoint('/api/connection-details')
  }, [])

  const session = useSession(
    tokenSource,
    APP_CONFIG_DEFAULTS.agentName ? { agentName: APP_CONFIG_DEFAULTS.agentName } : undefined
  )

  return (
    <AgentSessionProvider session={session}>
      <AgentBridgeProvider>  {/* ✅ Add this wrapper */}
        <div className="w-1/4 min-w-[300px] bg-card border-r border-border h-screen">
          <AgentChatUI />
        </div>
      </AgentBridgeProvider>
    </AgentSessionProvider>
  )
}
```

### Step 2: Add Forms to Website

Create a page to test the forms:

```tsx
// app/@website/booking/page.tsx

import BookingForm from "@/components/website/booking-form";

export default function BookingPage() {
  return (
    <div className="flex-1 overflow-auto">
      <BookingForm />
    </div>
  );
}
```

```tsx
// app/@website/order/page.tsx

import OrderForm from "@/components/website/order-form";

export default function OrderPage() {
  return (
    <div className="flex-1 overflow-auto">
      <OrderForm />
    </div>
  );
}
```

### Step 3: Add Navigation to Website

Update your website to allow navigation between forms:

```tsx
// app/@website/page.tsx

"use client";

import { useAppStore } from "@/lib/store/app-store";
import Link from "next/link";

export default function WebsiteHome() {
  const setContext = useAppStore((state) => state.setContext);

  return (
    <div className="flex-1 overflow-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Welcome to Our Restaurant</h1>
      
      <div className="grid grid-cols-2 gap-6 max-w-4xl">
        <Link 
          href="/@website/booking"
          onClick={() => setContext("booking")}
          className="p-6 border rounded-lg hover:bg-gray-50 text-center"
        >
          <h2 className="text-2xl font-semibold mb-2">Make a Reservation</h2>
          <p className="text-gray-600">Book a table for your next visit</p>
        </Link>
        
        <Link 
          href="/@website/order"
          onClick={() => setContext("ordering")}
          className="p-6 border rounded-lg hover:bg-gray-50 text-center"
        >
          <h2 className="text-2xl font-semibold mb-2">Order Food</h2>
          <p className="text-gray-600">Browse our menu and order delivery</p>
        </Link>
      </div>
      
      {/* Debug Info */}
      <div className="mt-12 p-4 bg-gray-100 rounded-md max-w-4xl">
        <p className="font-semibold mb-2">Debug Info:</p>
        <p className="text-sm">
          Current Context: {useAppStore((s) => s.currentContext)}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Try saying: "I want to make a reservation" or "I want to order food"
        </p>
      </div>
    </div>
  );
}
```

---

## Testing the Setup

### 1. Start Your App

```bash
cd frontend
pnpm dev
```

### 2. Open Browser Console

Check for these logs:
- `[AgentBridge] Sent to agent: ...`
- `[ContextSync] Context changed: ...`

### 3. Test UI → Agent Communication

1. Click on "Make a Reservation"
2. Fill in some fields
3. Check console - you should see messages being sent

### 4. Test Agent → UI Communication

From your agent (Python), send a message:

```python
# Navigate to booking
await send_to_ui(ctx, "agent:navigation", {
    "to": "booking",
    "route": "/@website/booking"
})

# Prefill form
await send_to_ui(ctx, "agent:form", {
    "formId": "booking-form",
    "values": {
        "name": "Test User",
        "date": "2024-02-20"
    }
})
```

---

## What You Just Built 🎉

### ✅ Bidirectional Communication
- UI changes → Agent knows
- Agent commands → UI updates

### ✅ Automatic Sync
- Form changes auto-sync (debounced)
- Context changes notify agent immediately

### ✅ Easy to Extend
- Add new forms: Just use `useFormSync`
- Add new contexts: Update the type
- Add custom actions: Register in action registry

### ✅ Type-Safe
- Full TypeScript support
- No runtime errors from wrong message formats

---

## Next Steps

1. **Add More Forms**: Use the same pattern as booking/order forms
2. **Customize Actions**: Add your own actions to action registry
3. **Agent Logic**: Implement intent detection and form prefilling
4. **Error Handling**: Add proper error boundaries
5. **Persistence**: Add form state persistence to localStorage/DB

---

## File Structure Summary

```
frontend/
├── types/
│   └── agent-bridge.ts           # All type definitions
├── lib/
│   ├── store/
│   │   └── app-store.ts          # Zustand state management
│   └── actions/
│       └── action-registry.ts    # Action definitions
├── hooks/
│   ├── useAgentBridge.tsx        # Core communication hook
│   ├── useContextSync.tsx        # Auto context sync
│   ├── useFormSync.tsx           # Auto form sync
│   └── useAgentCommands.tsx      # Handle agent commands
├── components/
│   ├── AgentBridgeProvider.tsx   # Wrapper component
│   ├── ChatWithSession.tsx       # Updated with provider
│   └── website/
│       ├── booking-form.tsx      # Example form
│       └── order-form.tsx        # Example form
└── AGENT_BRIDGE_GUIDE.md         # Usage documentation
```

---

## Troubleshooting

**Q: Messages not sending?**
- Ensure `AgentBridgeProvider` is wrapped inside `AgentSessionProvider`
- Check if LiveKit session is connected
- Look for errors in console

**Q: Form state not updating?**
- Verify you're using correct `formId`
- Check if `useFormSync` is called in the component

**Q: Agent commands not working?**
- Ensure `useAgentCommands` is called (it's in `AgentBridgeProvider`)
- Verify message format matches the protocol

---

Congratulations! Aapka bidirectional agent-UI communication system ready hai! 🚀

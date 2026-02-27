# Project Context — Terra Restaurant AI Agent

## What is it

A restaurant website (Terra) with an embedded AI voice + text assistant. The user talks or types
to the agent to make table reservations, place food orders, and ask general questions — while the
website UI reacts in real time: agent navigates pages, pre-fills forms, and scrolls the viewport
on behalf of the user. The website and the AI agent behave as one coupled system.

---

## Why it exists

Traditional restaurant websites are passive — users fill forms manually. This project makes the UI
agent-driven: the assistant guides the user through the entire flow, fills forms on their behalf,
and navigates pages for them. The goal is a fully conversational restaurant experience where the
user never has to touch a form.

---

## Architecture

### Two sides, one system

```
┌─────────────────────────┬────────────────────────────────────┐
│   Chat Panel (left)     │   Restaurant Website (right)        │
│   300px, collapsible    │   Next.js App Router pages          │
│                         │                                     │
│   Agent voice/text UI   │   Home / Booking / Order pages      │
│   LiveKit session       │   Forms, Seating Plan, Menu         │
└─────────────────────────┴────────────────────────────────────┘
```

Both sides share a single Zustand store (`AppStore`) as the source of truth. The agent drives the
right side; the user can also interact with the website directly and the agent stays in sync.

### Core principle — Agent executes, UI collects

The agent is the decision-maker and the only entity that calls the backend (make reservation,
place order, etc.). The UI's job is to collect and display data — not to call APIs directly.

```
User (voice or form)  →  data reaches agent  →  agent calls backend tool
                               ↕
                         UI displays state
```

The "Confirm Booking" / "Place Order" submit buttons do **not** call any backend API. They
dispatch a `FORM_SUBMITTED` signal to the agent, which then decides to call `make_reservation()`
or `place_order()` tools. This means:

- A voice user saying "yes, confirm" and a UI user clicking "Confirm" trigger the same agent path.
- The UI form is an alternate input method, not an independent system.
- The agent is the single source of backend truth.

---

## Backend — Python Agent (`/agent/src/`)

Runtime: LiveKit Agents framework (Python).

### Multi-Agent System

Three specialist agents, all extending `BaseAgent` (`agents/base.py`):

- **Greeter** — entry point. Detects intent (reservation vs order) and immediately calls
  `to_reservation()` or `to_order_food()` tool, which sends `NAVIGATE_PAGE` to the UI and
  transfers to the target agent. Does not collect any details itself.
- **Reservation** — collects the 6 booking fields (name, phone, date, time, guests, special
  requests) one by one, saves each via a dedicated tool, pre-fills the UI form via `FORM_PREFILL`.
- **OrderFood** — handles food ordering flow.

Agent switching happens two ways:
1. **Voice intent** — agent calls a transfer tool (`_transfer_to_agent`), which also sends
   `NAVIGATE_PAGE` so the UI navigates in sync.
2. **Page navigation** — user clicks a nav link → `PAGE_CHANGED` sent to agent →
   `PAGE_AGENT_MAP` resolves the target agent → `_switch_agent_for_page` fires automatically.

### BaseAgent (`agents/base.py`)

All shared behaviour lives here.

**`on_enter`:**
- Stores `self._userdata` and `self._room` (used by sync callbacks to avoid accessing
  `self.session` after the agent exits — prevents `RuntimeError: no activity context`).
- Registers `data_received` on the room and `agent_state_changed` on the session.
- Builds a system message from `userdata.summarize_form(_context_form_id)` or
  `userdata.summarize()` and injects it into `chat_ctx`.
- If `page_switch_trigger` is set in `userdata.meta` (written by `_switch_agent_for_page`),
  injects an additional system message telling the agent which page activated it and to greet
  accordingly. Clears the trigger after use.
- Calls `session.generate_reply()` to produce the opening message.

**`on_exit`:**
- Cancels the debounce task and silence watchdog.
- Calls `room.off("data_received", ...)` to unregister the listener so stale agents don't crash
  on room events after transition.
- Calls `session.off("agent_state_changed", ...)`.

**UI message handling (`_on_data_received`):**

All messages arrive on topic `ui-to-agent`. The handler is a sync callback — uses `self._userdata`
never `self.session`.

| Message | Action |
|---|---|
| `FORM_UPDATE` / `FORM_SUBMITTED` | `apply_form_update(form_id, values)` then `_queue_llm_update` |
| `SESSION_SYNC` | Saves all pre-filled forms, sets current page, then runs `PAGE_AGENT_MAP` switch logic same as `PAGE_CHANGED` |
| `PAGE_CHANGED` | Sets `current_page` in meta, looks up `PAGE_AGENT_MAP`, switches agent if different, else `_queue_llm_update` |

**Debounce (`_queue_llm_update` + `_debounced_reply`):**
Rapid UI messages (e.g. multiple field changes) are batched. Each call appends to
`_pending_updates` and resets a 1-second debounce timer. When the timer fires, all updates are
joined into one `[UI Updates]` message (role `user` — not `system`, required by Mistral's strict
role ordering), injected into the chat context, then `session.interrupt(force=True)` +
`session.generate_reply()` are called.

**Silence watchdog:**
`agent_state_changed` listener watches for `thinking` state → starts a 5-second watchdog task.
If the agent doesn't reach `speaking` within 5 seconds, fires `session.say()` with a fallback
message. Cancelled on `speaking`.

**Auto page switching (`_switch_agent_for_page`):**
1. Cancels debounce task and silence watchdog.
2. Sets `page_switch_trigger` in `userdata.meta`.
3. `await session.interrupt(force=True)`.
4. `await asyncio.sleep(0.1)` — yields to event loop so queued TTS audio drains before switch.
5. `session.update_agent(next_agent)` — triggers `on_enter` of the target agent.

**`PAGE_AGENT_MAP` (class attribute, overridable):**
```python
PAGE_AGENT_MAP = {
    "booking": "reservation",
    "order":   "order_food",
    "home":    "greeter",
}
```
Maps frontend `page.id` values (from `constants.ts PAGES`) to `userdata.agents` keys.

**`_context_form_id` (class attribute):**
Subclasses set this to scope the `on_enter` data summary to a specific form.
`Reservation` sets it to `BOOKING_FORM_ID` so only the booking form is injected, not the full
`summarize()` output.

### Reservation — `llm_node` sliding window

`Reservation` overrides `llm_node` to prevent chat history from growing unbounded and causing
hallucinations (same field value appearing multiple times confuses the LLM).

Before each LLM call:
1. Split `chat_ctx.items` into instruction items (system, not a snapshot) and conversation items.
2. Drop any existing `[STATE_SNAPSHOT]` messages.
3. Keep only the last 6 conversation items (`_WINDOW_SIZE = 6`).
4. Inject a fresh `[STATE_SNAPSHOT]` system message with the current booking form state from
   `summarize_form(BOOKING_FORM_ID)`.
5. Pass `instruction_items + [snapshot] + windowed_conv` to the parent `llm_node`.

### UserData (`dataclass.py`)

Holds `BookingFormData`, `OrderFormData`, `meta` dict, `agents` dict, `prev_agent`, `job_ctx`.

- `apply_form_update(form_id, values)` — merges values into the correct form dataclass.
- `summarize()` — returns all fields across all forms with `(not collected yet)` for missing ones.
- `summarize_form(form_id)` — same but scoped to one form.
- `update_meta(data)` / `get_meta(key)` — general key-value metadata (current page, flags, etc.).

### Mistral constraint

Mistral rejects messages where `role="system"` follows `role="tool"`. UI update messages injected
into chat context must use `role="user"`, not `role="system"`.

---

## Frontend — Next.js (`/frontend/`)

**Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4, Zustand, LiveKit Components React.

### Layout

Root layout (`app/layout.tsx`):
```
<div class="flex h-screen">
  <AgentChatWithSession />   ← chat panel (collapsible, 300px)
  {children}                 ← website pages via App Router
</div>
```

Website pages live under `app/(website)/`. All nav uses Next.js `<Link>` — never `<a>` — to
prevent full-page reloads that would destroy the LiveKit session.

### State — Zustand AppStore (`lib/store/app-store.ts`)

Single store:
- `currentPage` — active page ID
- `forms` — all form data keyed by form ID (`"booking-form"`, `"order-form"`)
- `signal` — latest inbound message from agent (agent → UI)
- `outboundSignal` — latest outbound message (UI → agent)

### Agent ↔ UI Bridge (`AgentBridgeProvider`)

Sits inside the LiveKit session context. Sends `outboundSignal` to agent via data channel
(topic `ui-to-agent`). Receives messages on topic `agent-to-ui` and dispatches them as signals
into Zustand.

**Inbound events (agent → UI):**

| Event | What the UI does |
|---|---|
| `NAVIGATE_PAGE` | `router.push` to target page |
| `FORM_PREFILL` | Merges partial data into `forms[formId]` in Zustand |
| `STATE_UPDATE` | Bulk updates any slice of AppStore |
| `UI_ACTION` / `SCROLL_TO` | Scrolls viewport to a registered element |

**Outbound events (UI → agent):**

| Event | When |
|---|---|
| `SESSION_SYNC` | Once when agent first joins — sends current page + any pre-filled form values |
| `FORM_UPDATE` | Per-field change, debounced, sent via `useFormSync` |
| `FORM_SUBMITTED` | When user submits a form |
| `PAGE_CHANGED` | When user navigates manually |

### Key Hooks

| Hook | Purpose |
|---|---|
| `useAgentSessionInit` | Fires `SESSION_SYNC` once when agent joins; sends current page + non-empty form fields |
| `useFormSync` | Watches a form's Zustand slice, auto-sends changed fields to agent; skips echoing back fields that the agent itself just pre-filled (`agentPrefillRef` echo-loop prevention) |
| `useNavigationSync` | Detects route changes via `usePathname`, sends `PAGE_CHANGED` to agent |
| `useAgentVisuals` | Handles inbound signals — `NAVIGATE_PAGE`, `FORM_PREFILL`, `UI_ACTION` |
| `useRegisterElement` | Registers a DOM element by ID so agent can trigger `SCROLL_TO` on it |

### Echo-loop prevention (`useFormSync`)

When agent sends `FORM_PREFILL`, `useFormSync` would normally detect the store change and send
`FORM_UPDATE` back to the agent — causing an interrupt loop. Prevented by `agentPrefillRef`: when
`FORM_PREFILL` arrives, the affected field keys are stored in the ref. When `useFormSync` detects
those same fields changing, it skips sending them. Ref entries are cleared after skipping so the
user can overwrite them later.

### Forms

Forms read from and write to `AppStore.forms` via `updateForm()`. State is never local to the
component. Agent pre-fills any field at any time and the form reflects it immediately.

### LiveKit Session (`AgentChatWithSession`)

```
AgentSessionProvider              ← LiveKit room context
  AgentBridgeProvider             ← data channel bridge + hooks
    ConnectedResizableContainer   ← collapsed strip UI
      AgentChatUI                 ← voice + text chat UI
```

---

## Data Flow — End to End (Table Booking)

### Via voice
1. User: *"I want to book a table"*
2. `Greeter` calls `to_reservation()` tool → sends `NAVIGATE_PAGE { page: "booking" }` → UI navigates → `PAGE_CHANGED` fires back → `Reservation` agent activates
3. `Reservation` asks for each field; saves via tool → sends `FORM_PREFILL` → form pre-fills live
4. User confirms → `FORM_SUBMITTED` → agent confirms verbally

### Via page navigation (auto-switch)
1. User clicks "Book Table" in header → Next.js client-side nav to `/booking`
2. `useNavigationSync` sends `PAGE_CHANGED { page: "booking" }`
3. `BaseAgent._on_data_received` → `PAGE_AGENT_MAP["booking"] = "reservation"` → `_switch_agent_for_page("reservation", "booking")`
4. Interrupts current agent, drains TTS buffer (100ms), switches to `Reservation`
5. `Reservation.on_enter` injects `page_switch_trigger` context → agent greets user for the booking page

### On connect with existing data
1. User fills booking form partially, then connects the agent
2. `useAgentSessionInit` detects agent joined → sends `SESSION_SYNC { page: "booking", forms: { "booking-form": { customer_name: "..." } } }`
3. Agent saves all form values → switches to `Reservation` because page is `"booking"` → greets knowing what's already filled

---

## Themes

Four themes: `light`, `dark`, `neon`, `pink` — set via `data-theme` on `<html>`. All colours are
CSS custom properties (`--color-primary`, `--color-background`, etc.) defined in `globals.css`.
Components use these variables directly — no hardcoded colours.


---

## Architecture

### Two sides, one system

```
┌─────────────────────────┬────────────────────────────────────┐
│   Chat Panel (left)     │   Restaurant Website (right)        │
│   300px, collapsible    │   Next.js App Router pages          │
│                         │                                     │
│   Agent voice/text UI   │   Home / Booking / Order pages      │
│   LiveKit session       │   Forms, Seating Plan, Menu         │
└─────────────────────────┴────────────────────────────────────┘
```

Both sides share a single Zustand store (`AppStore`) as the source of truth. The agent drives the
right side; the user can also interact with the website directly and the agent stays in sync.

---

## Backend — Python Agent (`/agent/src/`)

Runtime: LiveKit Agents framework (Python).

Three specialist agents that hand off to each other:

- **Greeter** (`agents/greeter.py`) — entry point, routes user to reservation or order agent based on intent
- **Reservation** (`agents/reservation.py`) — handles table booking, collects guest details
- **OrderFood** (`agents/order_food.py`) — handles food ordering flow

Each extends `BaseAgent` (`agents/base.py`) which holds shared LLM + TTS config.

**Agent → UI communication:** when an agent wants to change the UI it calls
`send_to_ui(job_ctx, event_type, payload)` which publishes a JSON message over the LiveKit data
channel on topic `agent-ui`.

```python
# Example — Greeter navigates to booking page then hands off
await send_to_ui(userdata.job_ctx, "NAVIGATE_PAGE", {"page": "booking"})
return await self._transfer_to_agent("reservation", context)
```

`RunContext_T` carries `userdata` across the pipeline — includes `job_ctx` (LiveKit room handle)
and accumulated user data (name, party size, preferences, etc.).

---

## Frontend — Next.js (`/frontend/`)

**Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4, Zustand, LiveKit Components React.

### Layout

Root layout (`app/layout.tsx`):
```
<div class="flex h-screen">
  <AgentChatWithSession />   ← chat panel (collapsible, 300px)
  {children}                 ← website pages via App Router
</div>
```

Website pages live under `app/(website)/` — shared layout includes `Header` and `DoodleBackground`
(decorative food SVG pattern, theme-aware).

### State — Zustand AppStore (`lib/store/app-store.ts`)

Single store with:
- `currentPage` — which page is active
- `forms` — all form data keyed by form ID (`"booking-form"`, `"order-form"`)
- `signal` — latest inbound message from agent (agent → UI)
- `outboundSignal` — latest outbound message from UI (UI → agent)

### Agent ↔ UI Bridge (`AgentBridgeProvider`)

Sits inside the LiveKit session context. Listens to the data channel (topic: `agent-ui`) and
dispatches incoming agent messages as signals into Zustand. Also subscribes to `outboundSignal`
in the store and sends those back to the agent.

**Inbound events the UI handles:**

| Event | What the UI does |
|---|---|
| `NAVIGATE_PAGE` | `router.push` to target page |
| `FORM_PREFILL` | Merges partial data into `forms[formId]` in Zustand |
| `STATE_UPDATE` | Bulk updates any slice of AppStore |
| `UI_ACTION` / `SCROLL_TO` | Scrolls viewport to a registered element |

**Outbound events the UI sends to agent:**

| Event | When |
|---|---|
| `SESSION_SYNC` | Once when agent joins — sends current page + any pre-filled form values |
| `FORM_SUBMITTED` | When user submits a form |
| `FORM_FIELD_CHANGED` | Per-field live sync, debounced, rules-controlled via `useFormSync` |
| `PAGE_CHANGED` | When user navigates manually |

### Key Hooks

| Hook | Purpose |
|---|---|
| `useFormSync` | Watches a form's Zustand slice, auto-sends changed fields to agent with debounce and per-field validation rules |
| `useNavigationSync` | Detects route changes, sends `PAGE_CHANGED` to agent |
| `useRegisterElement` | Registers a DOM element by ID so agent can trigger `SCROLL_TO` on it |
| `useAgentSessionInit` | Fires `SESSION_SYNC` once when agent first joins the room |

### Forms

Forms (`BookingForm`, `OrderForm`) do not manage their own state — they read from and write to
`AppStore.forms` via `updateForm()`. The agent can pre-fill any field at any time and the form
reflects it immediately. Each valid field change is auto-synced to the agent via `useFormSync`.

### LiveKit Session (`AgentChatWithSession`)

```
AgentSessionProvider              ← LiveKit room context
  AgentBridgeProvider             ← data channel bridge
    ConnectedResizableContainer   ← reads live agent state for collapsed strip UI
      AgentChatUI                 ← voice + text chat UI (messages, control bar, header)
```

The collapsed strip shows real-time agent state (`offline / connecting / listening / thinking /
speaking`) via `useVoiceAssistant()`, plus mic toggle and connect/disconnect controls.

---

## Data Flow — End to End (Table Booking)

1. User: *"I want to book a table"*
2. `Greeter` detects intent → calls `to_reservation()` tool
3. Tool sends `NAVIGATE_PAGE { page: "booking" }` over data channel
4. `AgentBridgeProvider` receives → `router.push("/booking")`
5. `Reservation` agent takes over, asks for name / date / party size
6. Agent sends `FORM_PREFILL { formId: "booking-form", data: {...} }` as user answers
7. `AppStore.forms["booking-form"]` updated → `BookingForm` renders prefilled values live
8. User confirms → form submits → `FORM_SUBMITTED` sent to agent
9. Agent confirms the booking verbally

---

## Themes

Four themes: `light`, `dark`, `neon`, `pink` — set via `data-theme` on `<html>`. All colours are
CSS custom properties (`--color-primary`, `--color-background`, etc.) defined in `globals.css`.
Components use these variables directly — no hardcoded colours.

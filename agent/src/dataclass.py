from dataclasses import dataclass, field, asdict
from typing import Any, Optional
from livekit.agents import Agent, metrics
import yaml

# Form IDs — must match frontend constants.ts
BOOKING_FORM_ID = "booking-form"
ORDER_FORM_ID   = "order-form"

from livekit.agents import RunContext

# ══════════════════════════════════════════════════════════════════════
# Per-form dataclasses
# ══════════════════════════════════════════════════════════════════════

@dataclass
class BookingFormData:
    """Maps 1-to-1 with frontend booking-form fields."""
    name:    Optional[str] = None   # Full name
    email:   Optional[str] = None
    phone:   Optional[str] = None
    guests:  Optional[int] = None
    date:    Optional[str] = None   # YYYY-MM-DD
    time:    Optional[str] = None   # HH:MM
    message: Optional[str] = None   # Special requests

    def update(self, data: dict[str, Any]) -> None:
        """Merge a partial dict (e.g. from FORM_UPDATE) into this dataclass."""
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)

    def to_dict(self) -> dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class OrderItem:
    """A single cart item — mirrors frontend CartItem interface."""
    id:          int
    name:        str
    price:       float
    quantity:    int
    category:    str = ""
    emoji:       str = ""
    description: str = ""


@dataclass
class OrderFormData:
    """Cart state — mirrors frontend order page state."""
    items:       list[OrderItem] = field(default_factory=list)
    total_price: float = 0.0
    total_items: int   = 0

    def _recalculate(self) -> None:
        self.total_items = sum(i.quantity for i in self.items)
        self.total_price = round(sum(i.price * i.quantity for i in self.items), 2)

    def add_item(self, item: OrderItem) -> None:
        existing = next((i for i in self.items if i.id == item.id), None)
        if existing:
            existing.quantity += item.quantity
        else:
            self.items.append(item)
        self._recalculate()

    def remove_item(self, item_id: int) -> None:
        self.items = [i for i in self.items if i.id != item_id]
        self._recalculate()

    def update(self, data: dict[str, Any]) -> None:
        """Apply a raw dict update from FORM_UPDATE signal."""
        if "items" in data:
            self.items = [
                OrderItem(**{k: v for k, v in item.items() if k in OrderItem.__dataclass_fields__})
                for item in data["items"]
            ]
        self._recalculate()

    def to_dict(self) -> dict[str, Any]:
        return {
            "items": [asdict(i) for i in self.items],
            "total_price": self.total_price,
            "total_items": self.total_items,
        }


# ══════════════════════════════════════════════════════════════════════
# Main UserData
# ══════════════════════════════════════════════════════════════════════

@dataclass
class UserData:
    booking: BookingFormData = field(default_factory=BookingFormData)
    order:   OrderFormData   = field(default_factory=OrderFormData)

    # Non-form session data (current_page, flags, etc.)
    meta: dict[str, Any] = field(default_factory=dict)

    # Infrastructure
    usage_collector: Optional[metrics.UsageCollector] = None
    agents: dict[str, Agent] = field(default_factory=dict)
    prev_agent: Optional[Agent] = None
    job_ctx: Optional[Any] = None

    # ── Form helpers ─────────────────────────────────────────────────

    def _form_by_id(self, form_id: str) -> "BookingFormData | OrderFormData | None":
        return {
            BOOKING_FORM_ID: self.booking,
            ORDER_FORM_ID:   self.order,
        }.get(form_id)

    def apply_form_update(self, form_id: str, values: dict[str, Any]) -> None:
        """Called when FORM_UPDATE / FORM_SUBMITTED arrives from UI."""
        form = self._form_by_id(form_id)
        if form is not None:
            form.update(values)

    def get_form(self, form_id: str) -> "BookingFormData | OrderFormData | None":
        return self._form_by_id(form_id)

    def get_field(self, form_id: str, key: str, default: Any = None) -> Any:
        """Get a single typed field from a form (used in tasks.py validation)."""
        form = self._form_by_id(form_id)
        return getattr(form, key, default) if form else default

    # ── Meta helpers ─────────────────────────────────────────────────

    def get_meta(self, key: str, default: Any = None) -> Any:
        return self.meta.get(key, default)

    def update_meta(self, data: dict[str, Any]) -> None:
        self.meta.update(data)

    # ── Backward compat: tasks.py uses self.userdata["customer_name"] ─
    # Routes directly to BookingFormData fields.

    def __getitem__(self, key: str) -> Any:
        return getattr(self.booking, key, None)

    def __setitem__(self, key: str, value: Any) -> None:
        if hasattr(self.booking, key):
            setattr(self.booking, key, value)

    # ── Summarize ─────────────────────────────────────────────────────

    def summarize(self) -> str:
        """Human-readable YAML summary passed to LLM context."""
        output: dict[str, Any] = {}

        booking_dict = self.booking.to_dict()
        if booking_dict:
            output[BOOKING_FORM_ID] = booking_dict

        order_dict = self.order.to_dict()
        if order_dict.get("items"):
            output[ORDER_FORM_ID] = order_dict

        if self.meta:
            output["meta"] = self.meta

        return yaml.dump(output, default_flow_style=False, indent=2) if output else "No data collected yet."

RunContext_T = RunContext[UserData]
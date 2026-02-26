from dataclasses import dataclass, field, asdict
from typing import Any, Optional
from livekit.agents import Agent, metrics

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
    customer_name:      Optional[str] = None
    customer_phone:     Optional[str] = None
    no_of_guests:       Optional[int] = None
    reservation_date:   Optional[str] = None   # YYYY-MM-DD
    reservation_time:   Optional[str] = None   # HH:MM
    special_requests:   Optional[str] = None
    table_id:           Optional[int] = None
    table_seats:        Optional[int] = None

    def update(self, data: dict[str, Any]) -> None:
        """Merge a partial dict into this dataclass.
        Frontend keys now match field names directly."""
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
        """Human-readable summary passed to LLM context.
        Shows ALL fields (collected + pending) so the agent knows exactly
        what's done and what still needs to be asked.
        """
        lines: list[str] = []

        # ── Booking / Reservation form ───────────────────────────────
        booking = self.booking
        booking_fields = {
            "customer_name":    booking.customer_name,
            "customer_phone":   booking.customer_phone,
            "no_of_guests":     booking.no_of_guests,
            "reservation_date": booking.reservation_date,
            "reservation_time": booking.reservation_time,
            "special_requests": booking.special_requests,
            "table_id":         booking.table_id,
            "table_seats":      booking.table_seats,
        }
        lines.append("=== Booking Reservation Form ===")
        for field_name, value in booking_fields.items():
            if value is not None:
                lines.append(f"  {field_name}: {value}")
            else:
                lines.append(f"  {field_name}: (not collected yet)")

        # ── Order / Cart form ────────────────────────────────────────
        if self.order.items:
            lines.append("=== Order Cart ===")
            for item in self.order.items:
                lines.append(f"  - {item.name} x{item.quantity} @ ₹{item.price}")
            lines.append(f"  total_items: {self.order.total_items}")
            lines.append(f"  total_price: ₹{self.order.total_price}")

        # ── Session meta ─────────────────────────────────────────────
        if self.meta:
            lines.append("=== Session Info ===")
            for k, v in self.meta.items():
                lines.append(f"  {k}: {v}")

        return "\n".join(lines) if lines else "No data collected yet."

    def summarize_form(self, form_id: str) -> str:
        """Return a summary of a single form by its ID.
        
        Usage:
            userdata.summarize_form(BOOKING_FORM_ID)
            userdata.summarize_form(ORDER_FORM_ID)
        """
        if form_id == BOOKING_FORM_ID:
            booking = self.booking
            fields = {
                "customer_name":    booking.customer_name,
                "customer_phone":   booking.customer_phone,
                "no_of_guests":     booking.no_of_guests,
                "reservation_date": booking.reservation_date,
                "reservation_time": booking.reservation_time,
                "special_requests": booking.special_requests,
                "table_id":         booking.table_id,
                "table_seats":      booking.table_seats,
            }
            lines = ["=== Booking Reservation Form ==="]
            for field_name, value in fields.items():
                if value is not None:
                    lines.append(f"  {field_name}: {value}")
                else:
                    lines.append(f"  {field_name}: (not collected yet)")
            return "\n".join(lines)

        if form_id == ORDER_FORM_ID:
            order = self.order
            if not order.items:
                return "=== Order Cart ===\n  (empty)"
            lines = ["=== Order Cart ==="]
            for item in order.items:
                lines.append(f"  - {item.name} x{item.quantity} @ ₹{item.price}")
            lines.append(f"  total_items: {order.total_items}")
            lines.append(f"  total_price: ₹{order.total_price}")
            return "\n".join(lines)

        return f"Unknown form_id: {form_id}"

RunContext_T = RunContext[UserData]
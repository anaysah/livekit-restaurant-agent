from dataclasses import dataclass,field
from typing import Annotated, Optional
from livekit.agents import Agent, metrics
import yaml

@dataclass
class UserData:
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    no_of_guests: Optional[int] = None
    reservation_time: Optional[str] = None
    reservation_date: Optional[str] = None
    cuisine_preference: Optional[str] = None
    special_requests: Optional[str] = None
    seating_preference: Optional[str] = None
    
    usage_collector: Optional[metrics.UsageCollector] = None
    agents: dict[str, Agent] = field(default_factory=dict)
    prev_agent: Optional[Agent] = None

    def __getitem__(self, key):
        return getattr(self, key)
    
    def __setitem__(self, key, value):
        setattr(self, key, value)

    def summarize(self) -> str:
        data = {
            "customer_name": self.customer_name or "unknown",
            "customer_phone": self.customer_phone or "unknown",
            "no_of_guests": self.no_of_guests or "unknown",
            "reservation_time": self.reservation_time or "unknown",
            "reservation_date": self.reservation_date or "unknown",
            "cuisine_preference": self.cuisine_preference or "unknown",
            "special_requests": self.special_requests or "unknown",
            "seating_preference": self.seating_preference or "unknown",
        }
        # add space before new lines for better readability
        formatted_data = {k: v.replace("\n", " \n ") if isinstance(v, str) else v for k, v in data.items()}
        return yaml.dump(formatted_data, default_flow_style=False, indent=2)

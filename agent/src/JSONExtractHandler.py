import logging
import json
import ast
import re
from datetime import datetime


class StatefulLLMLogger(logging.Handler):
    """
    Maintains one evolving request object:
    - Appends new messages from requests
    - Adds rate-limit + token snapshot per message from responses
    - Overwrites file with single updated object
    """

    def __init__(self, filename):
        super().__init__()
        self.filename = filename
        self.state = {
            "model": None,
            "messages": [],
            "usage": {},
            "rate_limit": {},
            "updated_at": None
        }

    def emit(self, record):
        try:
            msg = record.getMessage()

            if "Request options:" in msg:
                self._handle_request(msg)

            elif "HTTP Response:" in msg:
                self._handle_response(msg)

            self._flush()

        except Exception:
            pass  # logging should never crash app

    # ---------------- REQUEST ---------------- #

    def _handle_request(self, msg):
        if "'json_data':" not in msg:
            return

        # 🔍 Manually extract json_data block safely
        start = msg.find("'json_data':")
        brace_start = msg.find("{", start)
        if brace_start == -1:
            return

        brace_count = 0
        i = brace_start
        while i < len(msg):
            if msg[i] == "{":
                brace_count += 1
            elif msg[i] == "}":
                brace_count -= 1
                if brace_count == 0:
                    raw_json_data = msg[brace_start:i+1]
                    break
            i += 1
        else:
            return  # unbalanced braces

        try:
            json_data = ast.literal_eval(raw_json_data)
        except Exception:
            return

        # Save model
        if "model" in json_data:
            self.state["model"] = json_data["model"]

        # Append only new messages
        messages = json_data.get("messages", [])
        for m in messages:
            if m not in self.state["messages"]:
                self.state["messages"].append(m)

        self.state["updated_at"] = self._now()

    # ---------------- RESPONSE ---------------- #

    def _handle_response(self, msg):
        headers = self._extract_dict(msg)
        if not headers:
            return

        data = self._safe_parse(headers)
        if not data:
            return

        tokens_min = data.get("x-ratelimit-remaining-tokens-minute")

        # Save rate limits
        self.state["rate_limit"] = {
            "requests_min": data.get("x-ratelimit-remaining-requests-minute"),
            "requests_hour": data.get("x-ratelimit-remaining-requests-hour"),
            "tokens_min": tokens_min,
            "tokens_hour": data.get("x-ratelimit-remaining-tokens-hour"),
            "tokens_day": data.get("x-ratelimit-remaining-tokens-day")
        }

        # 🔥 Attach token snapshot + inference id to last message
        if self.state["messages"]:
            last_msg = self.state["messages"][-1]

            if tokens_min:
                last_msg["tokens_remaining_min"] = tokens_min

            inference_id = data.get("inference-id")
            if inference_id:
                last_msg["inference_id"] = inference_id

        self.state["updated_at"] = self._now()

    # ---------------- UTILITIES ---------------- #

    def _extract_dict(self, text):
        match = re.search(r'(\{.*\})', text, re.DOTALL)
        return match.group(1) if match else None

    def _safe_parse(self, raw):
        # Skip unsafe patterns
        if any(x in raw for x in ["Timeout(", "Headers(", "model_dump", "<", ">"]):
            return None
        try:
            return ast.literal_eval(raw)
        except Exception:
            return None

    def _flush(self):
        with open(self.filename, "w", encoding="utf-8") as f:
            json.dump(self.state, f, ensure_ascii=False, indent=2)

    def _now(self):
        return datetime.utcnow().isoformat() + "Z"

"""
Centralized logging configuration for the agent.
Import karke use karo: from src.logger_config import agent_flow, openai_logger
"""

import logging
import os
from src.JSONExtractHandler import StatefulLLMLogger

# Make logs directory if not exists
if not os.path.exists('logs'):
    os.makedirs('logs')

# A. ROOT LOGGER (Sab kuch yahan jaayega)
debug_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
debug_handler = logging.FileHandler('logs/full_debug.log')
debug_handler.setLevel(logging.DEBUG)
debug_handler.setFormatter(debug_formatter)

root_logger = logging.getLogger()
root_logger.setLevel(logging.DEBUG)
root_logger.addHandler(debug_handler)  # Sab kuch debug file mein daalo

# B. OPENAI LOGGER (Sirf isko VIP file se jodo)
# Base client logger: Logs only HTTP communication details from _base_client.py module
# Use this for debugging API requests without other OpenAI logs
# openai_logger = logging.getLogger("openai._base_client")

# Parent logger: Catches all OpenAI package logs including base_client, response, legacy_response etc.
# Setting level here affects all child loggers unless they're specifically configured
# vip_formatter = logging.Formatter('%(message)s')
# vip_handler = logging.FileHandler('logs/vip_agent.log')
# vip_handler.setLevel(logging.DEBUG) # DEBUG zaroori hai kyunki OpenAI raw data DEBUG level pe hota hai
# vip_handler.setFormatter(vip_formatter)

# Ye saare request aur response ko ek json file mein daal dega
openai_logger = logging.getLogger("openai._base_client")
openai_logger.setLevel(logging.DEBUG)
openai_logger.handlers.clear()  # Pehle saare handlers hatao
openai_logger.addHandler(StatefulLLMLogger("logs/live_request.json"))
openai_logger.propagate = False  # Root logger mein mat bhejna


temp_filehandler = logging.FileHandler('logs/vip_agent.log')
openai_logger.addHandler(temp_filehandler)

# C. CUSTOM AGENT LOGGER (Jo hum code mein use karenge)
agent_flow_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
agent_flow_handler = logging.FileHandler('logs/agent_flow.log')
agent_flow_handler.setLevel(logging.INFO)
agent_flow_handler.setFormatter(agent_flow_formatter)

agent_flow = logging.getLogger("agent_flow")
agent_flow.setLevel(logging.INFO)
agent_flow.addHandler(agent_flow_handler)
agent_flow.propagate = False  # Root logger mein mat jao


# D. OPTIONAL: Conversation logger (agar chahiye toh uncomment karo)
# conversation_formatter = logging.Formatter('%(asctime)s - %(message)s')
# conversation_handler = logging.FileHandler('logs/conversations.log')
# conversation_handler.setLevel(logging.INFO)
# conversation_handler.setFormatter(conversation_formatter)

# conversation_logger = logging.getLogger("conversation")
# conversation_logger.setLevel(logging.INFO)
# conversation_logger.addHandler(conversation_handler)
# conversation_logger.propagate = False


def get_logger(name: str) -> logging.Logger:
    """
    Custom logger create karne ke liye helper function.
    
    Usage:
        from src.logger_config import get_logger
        logger = get_logger(__name__)
        logger.info("Message")
    """
    return logging.getLogger(name)

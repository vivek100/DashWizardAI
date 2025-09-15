"""Context Tools
This module contains tools for extracting context from the agent's RunnableConfig.

"""

def extract_user_context(configFromFrontend):
    """
    Pulls user_id (and run_id) out of the agent’s RunnableConfig.
    Raises Exception if user_id is absent.
    """
    print("this is the config from frontend", configFromFrontend)
    cfg = (configFromFrontend or {}).get("configurable", {})
    
    if "user_id" not in cfg:
        raise Exception("Storage operations require a valid user_id in context.")
    
    user_id = cfg["user_id"]
    run_id  = cfg["run_id"]
    return user_id, run_id
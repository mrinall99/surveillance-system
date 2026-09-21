"""
Config Loader Module for Python CV Engine.
Reads config.yaml from root directory and exposes structured configuration dictionary.
"""
import os
import yaml

def load_config(config_path=None):
    if config_path is None:
        # Default to root directory config.yaml
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        config_path = os.path.join(base_dir, "config.yaml")

    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Configuration file not found at: {config_path}")

    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    return config

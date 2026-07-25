"""
config.py
=========
Config-as-classes: one base class with shared defaults, subclassed per
environment. `run.py` and `create_app()` pick which one to use from an
environment variable, so the same codebase behaves correctly whether it's
running locally, under pytest, or (hypothetically) in production.

Nothing here is actually secret today - there's no database, no API keys -
but SECRET_KEY is read from the environment anyway because that's the
pattern you want already in place *before* you need it, not bolted on
after a real secret gets hardcoded and committed by accident.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


class Config:
    """Shared defaults. Never instantiate this directly - use one of the
    environment-specific subclasses below."""
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
    MAX_CONTENT_LENGTH = 20 * 1024 * 1024  # 20 MB upload cap
    CHARTS_DIRNAME = "charts"  # relative to app/static/


class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False


class TestingConfig(Config):
    """Used by the pytest fixtures in tests/conftest.py. Charts still get
    written to disk (the visualizer methods require a real save_path) but
    to a separate directory so test runs never clash with dev-server runs."""
    DEBUG = False
    TESTING = True
    CHARTS_DIRNAME = "charts_test"


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}

"""
app/__init__.py
==================
The application factory. Nothing in this package runs a server or holds
state at import time - create_app() builds one fully-wired Flask app per
call, which is what makes it possible to have a dev-server instance and a
pytest instance coexist without stepping on each other.

Import order matters here: matplotlib's backend must be set to 'Agg'
BEFORE anything imports pyplot, including app.core.resume_screening_ai,
because this process has no display to render a GUI window to. That's
why it happens as the very first thing in this file.
"""

import os

import matplotlib
matplotlib.use("Agg")

from pathlib import Path

from flask import Flask

from config import config_by_name
from app.errors import register_error_handlers
from app.services.screening_session import ScreeningSession


def create_app(config_name: str | None = None) -> Flask:
    config_name = config_name or os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    charts_dir = Path(app.static_folder) / app.config["CHARTS_DIRNAME"]
    app.screening_session = ScreeningSession(charts_dir)

    register_error_handlers(app)

    from app.routes.pages import pages_bp
    from app.routes.job_description import jd_bp
    from app.routes.resumes import resumes_bp
    from app.routes.analysis import analysis_bp
    from app.routes.charts import charts_bp
    from app.routes.session import session_bp

    for blueprint in (pages_bp, jd_bp, resumes_bp, analysis_bp, charts_bp, session_bp):
        app.register_blueprint(blueprint)

    return app

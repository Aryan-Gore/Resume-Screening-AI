"""app/routes/pages.py - serves the wizard UI itself."""

from flask import Blueprint, render_template

pages_bp = Blueprint("pages", __name__)


@pages_bp.route("/")
def index():
    return render_template("index.html")

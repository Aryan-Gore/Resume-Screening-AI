"""app/routes/session.py - lets the frontend's "Start over" button get a
clean ScreeningSession without restarting the process."""

from flask import Blueprint, current_app, jsonify

session_bp = Blueprint("session", __name__, url_prefix="/api")


@session_bp.route("/reset", methods=["POST"])
def reset():
    current_app.screening_session.reset()
    return jsonify({"message": "Session reset"})

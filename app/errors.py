"""
app/errors.py
==============
One exception type for "expected" errors (bad input, wrong step order,
unknown candidate) plus the Flask error handlers that turn exceptions into
clean JSON responses. Kept separate from routes so every blueprint shares
the exact same error shape without repeating handler code.
"""

import traceback

from flask import Flask, jsonify


class ApiError(Exception):
    """Raise this anywhere in the app for an error the caller should see
    a clean message for for (bad input, wrong step order, 404, etc)."""

    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ApiError)
    def handle_api_error(err: ApiError):
        return jsonify({"error": err.message}), err.status

    @app.errorhandler(Exception)
    def handle_unexpected_error(err: Exception):
        # Anything that reaches here is a bug, not user error - log the
        # full traceback server-side but keep the client response generic.
        traceback.print_exc()
        return jsonify({"error": f"Unexpected server error: {err}"}), 500

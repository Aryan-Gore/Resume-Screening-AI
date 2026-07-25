"""
run.py
========
The entry point: `python run.py`. Deliberately thin - all it does is ask
the factory for an app and run it. Keeping this separate from app/ means
the app package itself never starts a server just by being imported,
which is exactly the property pytest needs to test it safely.
"""

import os

from dotenv import load_dotenv

load_dotenv()  # loads .env into os.environ if present; harmless no-op otherwise

from app import create_app

app = create_app()

if __name__ == "__main__":
    # use_reloader=False: Flask's debug reloader forks a second process to
    # actually serve requests, which is an extra moving part this local
    # single-user tool doesn't need. Restart with Ctrl+C after edits.
    app.run(
        debug=app.config["DEBUG"],
        port=int(os.environ.get("PORT", 5000)),
        use_reloader=False,
    )

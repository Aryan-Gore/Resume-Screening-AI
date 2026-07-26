# Gauge — Resume Screening AI

A web frontend for the `ResumeScreeningAI` engine, structured as a proper
Flask application: factory pattern, blueprints, environment-aware config,
and a real `pytest` suite — instead of one flat `app.py`.

## Quick start

```bash
pip install -r requirements.txt --break-system-packages   # drop the flag on Windows/most setups
python scripts/setup_nltk_data.py                          # one-time, downloads tokenizer/lemmatizer data
python run.py
```

Open **http://127.0.0.1:5000**. Use the sample-data links on steps 1–2 to
see a full ranked result in under a minute without real resumes on hand.

## Running the tests

```bash
pip install -r requirements-dev.txt --break-system-packages
pytest
```

39 tests, ~8 seconds, no server or curl required — everything runs through
Flask's in-process test client against a fresh, isolated app instance per
test (see `tests/conftest.py`).

## Project layout

```
resume-screening-app/
├── run.py                     # entry point: python run.py
├── demo.py                    # standalone CLI demo — no Flask needed at all
├── config.py                  # Config / DevelopmentConfig / TestingConfig / ProductionConfig
├── pytest.ini
├── requirements.txt           # runtime dependencies
├── requirements-dev.txt       # + pytest, for local development only
├── .env.example                # copy to .env for local secrets (gitignored)
├── .gitignore
│
├── core/                        # your original AI engine — byte-for-byte unchanged
│   └── resume_screening_ai.py   # deliberately NOT nested inside app/ (see below)
│
├── app/                        # the Flask application package
│   ├── __init__.py             # create_app() factory - the only place Flask() is constructed
│   ├── errors.py               # ApiError + shared error handlers
│   │
│   ├── services/                # business logic, framework-agnostic
│   │   ├── file_parser.py       # .txt/.pdf/.docx -> plain text
│   │   └── screening_session.py # wraps ResumeScreeningAI + session state as a class
│   │
│   ├── routes/                  # blueprints, one file per feature area
│   │   ├── pages.py             # GET /
│   │   ├── job_description.py   # POST /api/job-description
│   │   ├── resumes.py           # /api/resumes (GET/POST/DELETE)
│   │   ├── analysis.py          # /api/analyze, /api/top-candidates, /api/candidate
│   │   ├── charts.py            # /api/chart/*
│   │   └── session.py           # POST /api/reset
│   │
│   ├── templates/index.html
│   └── static/{css,js,charts}/
│
├── scripts/
│   └── setup_nltk_data.py
│
└── tests/
    ├── conftest.py              # shared fixtures: app -> client -> jd_client -> ready_client -> analyzed_client
    ├── test_job_description.py
    ├── test_resumes.py
    ├── test_analysis.py
    ├── test_charts.py
    └── test_session_and_pages.py
```

Run the standalone demo (prints a results table, saves `rankings.png` /
`summary.png` / `results.csv` to the current directory, no server needed):

```bash
python demo.py
```

## Why it's organized this way

- **`create_app()` instead of a module-level `app = Flask(__name__)`.**
  Every route used to reach into a global `state` dict. Now `create_app()`
  builds a fresh `ScreeningSession` per app instance and attaches it as
  `app.screening_session`. That one change is what makes the test suite
  possible: `create_app('testing')` in a pytest fixture gets its own
  isolated session automatically — no test can leak data into another.
- **Blueprints instead of one `app.py`.** The old file mixed JD handling,
  resume handling, scoring, charts, and error handling in ~400 lines.
  Now each feature area is a file you can open on its own.
- **`core/` sits outside `app/` entirely, not nested inside it.** It
  started as `app/core/`, but that meant importing it at all dragged in
  `app/__init__.py` — which imports Flask, config, the whole factory.
  The AI engine has nothing to do with the web layer that wraps it, so it
  shouldn't need Flask installed just to be imported. That's also why
  `demo.py` at the root can `from core.resume_screening_ai import ...`
  and run with zero Flask dependency — try `python demo.py` with Flask
  uninstalled and it still works.
- **Config as classes.** `TestingConfig` writes generated charts to
  `charts_test/` instead of `charts/`, so running the test suite while
  the dev server is also running never collides on files. That's a small
  thing here, but it's the same mechanism that would later separate a
  test database from a real one.
- **`.env.example` is committed, `.env` is not.** Nothing in this app is
  secret today, but the pattern is in place before it needs to be —
  much better than bolting it on after a real key gets hardcoded once.

## Feature → code map

| Feature | Where |
|---|---|
| Text preprocessing, skill/experience/education extraction | `core/resume_screening_ai.py` (unchanged), invoked from `app/routes/job_description.py` and `app/routes/resumes.py`, or directly via `demo.py` |
| Weighted scoring (`calculate_final_scores`) | `app/routes/analysis.py` |
| All 5 Matplotlib visualizations | `app/routes/charts.py`, calling `ScreeningSession.visualizer` directly — real PNGs, not a JS reimplementation |
| Session/state management | `app/services/screening_session.py` |
| File upload parsing (.txt/.pdf/.docx) | `app/services/file_parser.py` |
| Frontend wizard | `app/templates/index.html`, `app/static/js/app.js`, `app/static/css/style.css` — unchanged from before, just relocated |

## Extending it

- **Multi-user support:** `ScreeningSession` currently lives once per app
  instance. To support concurrent users, key a dict of sessions by
  `flask.session` id (or a real user id) instead of the single
  `app.screening_session` attribute — everything else stays the same.
- **A real database:** swap `ScreeningSession`'s in-memory `ResumeScreeningAI`
  for something backed by persistent storage, and add `DATABASE_URL` to
  `config.py` alongside `SECRET_KEY` — same environment-variable pattern.
- **CI:** the test suite has zero external dependencies beyond what's in
  `requirements-dev.txt`, so `pytest` is already CI-ready — a GitHub
  Actions workflow that runs `pip install -r requirements-dev.txt && pytest`
  on every push would need no further changes to this repo.

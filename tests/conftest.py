"""
tests/conftest.py
====================
Shared pytest fixtures. Each test gets a fresh `app` (and therefore a
fresh ScreeningSession - see app/services/screening_session.py) via the
'testing' config, so tests never leak state into each other even though
the app itself is single-session by design.

Fixtures build on each other (app -> client -> jd_client -> ready_client
-> analyzed_client) so each test file only asks for the level of setup it
actually needs.
"""

import json

import pytest

from app import create_app

SAMPLE_JD_TEXT = (
    "We are hiring a Full Stack Python Developer. Requirements: Python, Flask, "
    "React, AWS, Docker, SQL, Git, REST API. 3+ years of professional experience. "
    "Strong communication, teamwork, and problem solving skills. Bachelors degree "
    "in Computer Science required."
)

SAMPLE_RESUMES = [
    {
        "name": "Strong Match",
        "text": (
            "4 years of experience with Python, Flask, React, AWS, Docker, SQL, and Git. "
            "Strong communication and teamwork skills. B.Tech in Computer Science."
        ),
    },
    {
        "name": "Weak Match",
        "text": (
            "1 year of experience with HTML and CSS. Currently learning to code. "
            "High school diploma."
        ),
    },
]


@pytest.fixture
def app():
    return create_app("testing")


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def jd_client(client):
    """A client with a job description already loaded."""
    resp = client.post("/api/job-description", json={"text": SAMPLE_JD_TEXT})
    assert resp.status_code == 200
    return client


@pytest.fixture
def ready_client(jd_client):
    """A client with JD + two resumes loaded - everything /api/analyze needs."""
    resp = jd_client.post(
        "/api/resumes",
        data={"pasted": json.dumps(SAMPLE_RESUMES)},
        content_type="multipart/form-data",
    )
    assert resp.status_code == 200
    return jd_client


@pytest.fixture
def analyzed_client(ready_client):
    """A client that has already run a full analysis - ready for chart /
    candidate-report routes."""
    resp = ready_client.post("/api/analyze", json={})
    assert resp.status_code == 200
    return ready_client

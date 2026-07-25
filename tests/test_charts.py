"""tests/test_charts.py - GET /api/chart/*

Each of these calls straight into ResumeScreeningVisualizer, so these
tests double as confirmation that all 5 chart methods still run cleanly
end to end (correct save_path, no exceptions from matplotlib's Agg
backend, a real non-trivial PNG lands on disk).
"""

import os

import pytest

CHART_ROUTES_NEEDING_ONLY_ANALYSIS = [
    "/api/chart/rankings",
    "/api/chart/skills",
    "/api/chart/distribution",
    "/api/chart/summary",
]


@pytest.mark.parametrize("route", CHART_ROUTES_NEEDING_ONLY_ANALYSIS)
def test_chart_requires_analysis_first(ready_client, route):
    resp = ready_client.get(route)
    assert resp.status_code == 409


@pytest.mark.parametrize("route", CHART_ROUTES_NEEDING_ONLY_ANALYSIS)
def test_chart_generates_real_png(analyzed_client, app, route):
    resp = analyzed_client.get(route)
    assert resp.status_code == 200
    image_url = resp.get_json()["image_url"]
    assert image_url.startswith("/static/")

    disk_path = os.path.join(app.static_folder, image_url.removeprefix("/static/"))
    assert os.path.exists(disk_path)
    assert os.path.getsize(disk_path) > 5000  # a real chart, not an empty/broken file


def test_chart_breakdown_for_known_candidate(analyzed_client):
    resp = analyzed_client.get("/api/chart/breakdown?name=Strong+Match")
    assert resp.status_code == 200
    assert resp.get_json()["image_url"].startswith("/static/")


def test_chart_breakdown_unknown_candidate_404s(analyzed_client):
    resp = analyzed_client.get("/api/chart/breakdown?name=Nobody+Here")
    assert resp.status_code == 404


def test_chart_breakdown_requires_analysis_first(ready_client):
    resp = ready_client.get("/api/chart/breakdown?name=Strong+Match")
    assert resp.status_code == 409

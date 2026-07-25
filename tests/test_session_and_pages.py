"""tests/test_session_and_pages.py - GET /, POST /api/reset"""


def test_index_page_renders(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert b"Gauge" in resp.data


def test_reset_clears_loaded_state(analyzed_client):
    resp = analyzed_client.post("/api/reset")
    assert resp.status_code == 200

    # Everything that depended on prior state should require setup again
    assert analyzed_client.get("/api/top-candidates").status_code == 409
    assert analyzed_client.get("/api/resumes").get_json()["resumes"] == []

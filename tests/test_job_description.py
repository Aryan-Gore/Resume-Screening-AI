"""tests/test_job_description.py - POST /api/job-description"""

import io

from tests.conftest import SAMPLE_JD_TEXT


def test_load_valid_jd_detects_skills(client):
    resp = client.post("/api/job-description", json={"text": SAMPLE_JD_TEXT})
    assert resp.status_code == 200
    body = resp.get_json()
    assert "python" in body["detected_skills"]["technical"]
    assert "flask" in body["detected_skills"]["technical"]
    assert body["word_count"] == len(SAMPLE_JD_TEXT.split())


def test_jd_too_short_is_rejected(client):
    resp = client.post("/api/job-description", json={"text": "too short"})
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_jd_missing_text_is_rejected(client):
    resp = client.post("/api/job-description", json={})
    assert resp.status_code == 400


def test_jd_file_upload(client):
    file_data = io.BytesIO(SAMPLE_JD_TEXT.encode("utf-8"))
    resp = client.post(
        "/api/job-description",
        data={"file": (file_data, "job.txt")},
        content_type="multipart/form-data",
    )
    assert resp.status_code == 200
    assert "python" in resp.get_json()["detected_skills"]["technical"]


def test_jd_unsupported_file_type_is_rejected(client):
    file_data = io.BytesIO(b"not a real resume")
    resp = client.post(
        "/api/job-description",
        data={"file": (file_data, "job.exe")},
        content_type="multipart/form-data",
    )
    assert resp.status_code == 400


def test_loading_new_jd_resets_analyzed_flag(ready_client):
    """A fresh JD after analysis should invalidate the previous results -
    confirmed indirectly: /api/top-candidates should 409 until re-analyzed."""
    ready_client.post("/api/analyze", json={})
    resp = ready_client.post("/api/job-description", json={"text": SAMPLE_JD_TEXT})
    assert resp.status_code == 200

    resp = ready_client.get("/api/top-candidates")
    assert resp.status_code == 409

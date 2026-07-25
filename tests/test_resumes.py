"""tests/test_resumes.py - POST/GET/DELETE /api/resumes"""

import io
import json


def test_upload_pasted_resumes(client):
    resp = client.post(
        "/api/resumes",
        data={"pasted": json.dumps([{"name": "Test Candidate", "text": "Python developer with 3 years experience."}])},
        content_type="multipart/form-data",
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["resumes"][0]["name"] == "Test Candidate"


def test_upload_file_resume(client):
    file_data = io.BytesIO(b"5 years of Python and SQL experience. Bachelors degree.")
    resp = client.post(
        "/api/resumes",
        data={"files": (file_data, "jane_doe.txt")},
        content_type="multipart/form-data",
    )
    assert resp.status_code == 200
    # name_from_filename() should title-case and de-underscore the filename
    assert resp.get_json()["resumes"][0]["name"] == "Jane Doe"


def test_no_resumes_in_request_is_rejected(client):
    resp = client.post("/api/resumes", data={}, content_type="multipart/form-data")
    assert resp.status_code == 400


def test_duplicate_candidate_name_gets_deduped(client):
    payload = {"pasted": json.dumps([{"name": "Sam Lee", "text": "Python developer."}])}
    client.post("/api/resumes", data=payload, content_type="multipart/form-data")
    resp = client.post("/api/resumes", data=payload, content_type="multipart/form-data")

    names = [r["name"] for r in resp.get_json()["resumes"]]
    assert "Sam Lee" in names
    assert "Sam Lee (2)" in names


def test_resumes_accumulate_across_requests(client):
    client.post(
        "/api/resumes",
        data={"pasted": json.dumps([{"name": "First", "text": "Python developer."}])},
        content_type="multipart/form-data",
    )
    resp = client.post(
        "/api/resumes",
        data={"pasted": json.dumps([{"name": "Second", "text": "Java developer."}])},
        content_type="multipart/form-data",
    )
    assert len(resp.get_json()["resumes"]) == 2


def test_list_resumes(ready_client):
    resp = ready_client.get("/api/resumes")
    assert resp.status_code == 200
    assert len(resp.get_json()["resumes"]) == 2


def test_delete_resume(ready_client):
    resp = ready_client.delete("/api/resumes?name=Strong+Match")
    assert resp.status_code == 200
    remaining = [r["name"] for r in resp.get_json()["resumes"]]
    assert "Strong Match" not in remaining
    assert "Weak Match" in remaining


def test_delete_unknown_resume_still_succeeds_as_noop(ready_client):
    # Deleting a name that isn't present just leaves the pool unchanged -
    # it's not treated as an error, matching how the DELETE filter works.
    resp = ready_client.delete("/api/resumes?name=Nobody+Here")
    assert resp.status_code == 200
    assert len(resp.get_json()["resumes"]) == 2


def test_delete_requires_name_param(ready_client):
    resp = ready_client.delete("/api/resumes")
    assert resp.status_code == 400

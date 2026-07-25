"""tests/test_analysis.py - POST /api/analyze, GET /api/top-candidates,
GET /api/candidate"""


def test_analyze_requires_jd_first(client):
    resp = client.post("/api/analyze", json={})
    assert resp.status_code == 409


def test_analyze_requires_resumes_first(jd_client):
    resp = jd_client.post("/api/analyze", json={})
    assert resp.status_code == 409


def test_analyze_with_default_weights_ranks_strong_match_first(ready_client):
    resp = ready_client.post("/api/analyze", json={})
    assert resp.status_code == 200
    results = {r["Candidate"]: r for r in resp.get_json()["results"]}
    assert results["Strong Match"]["Final_Score"] > results["Weak Match"]["Final_Score"]
    assert results["Strong Match"]["Rank"] == 1


def test_analyze_with_custom_weights(ready_client):
    weights = {"text_similarity": 0.25, "skill_match": 0.45, "experience": 0.2, "education": 0.1}
    resp = ready_client.post("/api/analyze", json={"weights": weights})
    assert resp.status_code == 200
    assert resp.get_json()["weights_used"] == weights


def test_analyze_rejects_weights_not_summing_to_one(ready_client):
    weights = {"text_similarity": 0.9, "skill_match": 0.45, "experience": 0.2, "education": 0.1}
    resp = ready_client.post("/api/analyze", json={"weights": weights})
    assert resp.status_code == 400


def test_analyze_rejects_incomplete_weight_keys(ready_client):
    resp = ready_client.post("/api/analyze", json={"weights": {"text_similarity": 1.0}})
    assert resp.status_code == 400


def test_top_candidates_requires_analysis_first(ready_client):
    resp = ready_client.get("/api/top-candidates")
    assert resp.status_code == 409


def test_top_candidates_respects_n(analyzed_client):
    resp = analyzed_client.get("/api/top-candidates?n=1")
    assert resp.status_code == 200
    assert len(resp.get_json()["results"]) == 1


def test_candidate_report_found(analyzed_client):
    resp = analyzed_client.get("/api/candidate?name=Strong+Match")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["name"] == "Strong Match"
    assert body["rank"] == 1
    assert "python" in body["details"]["technical_skills"]


def test_candidate_report_not_found(analyzed_client):
    resp = analyzed_client.get("/api/candidate?name=Nobody+Here")
    assert resp.status_code == 404


def test_candidate_report_requires_name_param(analyzed_client):
    resp = analyzed_client.get("/api/candidate")
    assert resp.status_code == 400

"""
app/routes/analysis.py
=========================
Step 3 -> ResumeScreeningAI.calculate_final_scores() (which internally
exercises calculate_text_similarity / calculate_skill_match_score /
calculate_experience_score / calculate_education_score), plus
get_top_candidates() and generate_candidate_report() for step 4.
"""

from flask import Blueprint, current_app, jsonify, request

from core.resume_screening_ai import print_results_table
from app.errors import ApiError

analysis_bp = Blueprint("analysis", __name__, url_prefix="/api")

REQUIRED_WEIGHT_KEYS = {"text_similarity", "skill_match", "experience", "education"}


@analysis_bp.route("/analyze", methods=["POST"])
def analyze():
    session = current_app.screening_session
    if not session.jd_loaded:
        raise ApiError("Load a job description first.", 409)
    if not (session.resumes_loaded and len(session.ai.resumes_data) >= 1):
        raise ApiError("Add at least one resume first.", 409)

    data = request.get_json(silent=True) or {}
    weights = data.get("weights")

    if weights:
        if set(weights.keys()) != REQUIRED_WEIGHT_KEYS:
            raise ApiError(f"Weights must include exactly: {', '.join(sorted(REQUIRED_WEIGHT_KEYS))}.")
        total = sum(weights.values())
        if abs(total - 1.0) >= 0.01:
            raise ApiError(f"Weights must sum to 100% (got {round(total * 100)}%).")

    results = session.ai.calculate_final_scores(weights=weights)
    session.analyzed = True

    # Also exercises the module's console reporting feature, unchanged.
    print_results_table(results)

    return jsonify({
        "results": results.to_dict(orient="records"),
        "weights_used": weights or {
            "text_similarity": 0.4, "skill_match": 0.3, "experience": 0.2, "education": 0.1,
        },
    })


@analysis_bp.route("/top-candidates")
def top_candidates():
    session = current_app.screening_session
    if not session.analyzed:
        raise ApiError("Run analysis first.", 409)
    n = request.args.get("n", default=5, type=int)
    return jsonify({"results": session.ai.get_top_candidates(n).to_dict(orient="records")})


@analysis_bp.route("/candidate")
def candidate_report():
    session = current_app.screening_session
    if not session.analyzed:
        raise ApiError("Run analysis first.", 409)
    name = request.args.get("name", "")
    if not name:
        raise ApiError('Missing "name" query parameter.')
    try:
        report = session.ai.generate_candidate_report(name)
    except IndexError:
        raise ApiError(f'No candidate named "{name}" found.', 404)
    return jsonify(report)

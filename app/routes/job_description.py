"""
app/routes/job_description.py
================================
Step 1 of the wizard -> ResumeScreeningAI.load_job_description().
"""

from flask import Blueprint, current_app, jsonify, request

from app.errors import ApiError
from app.services.file_parser import UnsupportedFileTypeError, extract_text_from_upload

jd_bp = Blueprint("job_description", __name__, url_prefix="/api")


@jd_bp.route("/job-description", methods=["POST"])
def upload_job_description():
    session = current_app.screening_session
    text = ""

    if "file" in request.files and request.files["file"].filename:
        try:
            text = extract_text_from_upload(request.files["file"])
        except UnsupportedFileTypeError as e:
            raise ApiError(str(e))
    else:
        data = request.get_json(silent=True) or {}
        text = (data.get("text") or "").strip()

    if len(text) < 30:
        raise ApiError("That job description looks too short. Paste the full text or upload a file.")

    session.ai.load_job_description(text)
    session.jd_loaded = True
    session.analyzed = False  # a new JD invalidates any previous scoring

    skills = session.ai.job_description["skills"]
    return jsonify({
        "message": "Job description loaded",
        "preview": text[:500] + ("..." if len(text) > 500 else ""),
        "word_count": len(text.split()),
        "detected_skills": {
            "technical": sorted(skills["technical"]),
            "soft": sorted(skills["soft"]),
            "total_count": skills["total_count"],
        },
    })

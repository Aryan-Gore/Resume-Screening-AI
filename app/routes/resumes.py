"""
app/routes/resumes.py
========================
Step 2 of the wizard -> ResumeScreeningAI.load_resumes().
"""

import json

from flask import Blueprint, current_app, jsonify, request

from app.errors import ApiError
from app.services.file_parser import UnsupportedFileTypeError, extract_text_from_upload, name_from_filename

resumes_bp = Blueprint("resumes", __name__, url_prefix="/api")


@resumes_bp.route("/resumes", methods=["POST"])
def upload_resumes():
    """
    Accepts multipart/form-data with:
      - files:  zero or more uploaded resume files (.txt/.pdf/.docx)
      - pasted: a JSON string, e.g. '[{"name": "...", "text": "..."}]'
    New resumes are MERGED with anything already loaded.
    """
    session = current_app.screening_session
    incoming = []
    errors = []

    for f in request.files.getlist("files"):
        if not f.filename:
            continue
        try:
            text = extract_text_from_upload(f)
            incoming.append({"name": name_from_filename(f.filename), "text": text})
        except UnsupportedFileTypeError as e:
            errors.append(str(e))

    pasted_raw = request.form.get("pasted")
    if pasted_raw:
        try:
            pasted_items = json.loads(pasted_raw)
        except (TypeError, ValueError):
            pasted_items = []
        for item in pasted_items:
            name = (item.get("name") or "").strip()
            text = (item.get("text") or "").strip()
            if name and text:
                incoming.append({"name": name, "text": text})

    if len(incoming) == 0:
        raise ApiError("; ".join(errors) if errors else "No valid resumes found in the request.")

    existing = session.loaded_resumes_as_list()
    existing_names = {r["name"] for r in existing}
    for item in incoming:
        item["name"] = session.dedupe_name(item["name"], existing_names)
        existing_names.add(item["name"])

    session.ai.load_resumes(existing + incoming)
    session.resumes_loaded = True
    session.analyzed = False  # candidate pool changed - old scores are stale

    return jsonify({
        "message": f"{len(incoming)} resume(s) added ({len(existing) + len(incoming)} total)",
        "warnings": errors,
        "resumes": session.resume_summaries(),
    })


@resumes_bp.route("/resumes", methods=["GET"])
def list_resumes():
    return jsonify({"resumes": current_app.screening_session.resume_summaries()})


@resumes_bp.route("/resumes", methods=["DELETE"])
def remove_resume():
    session = current_app.screening_session
    name = request.args.get("name", "")
    if not name:
        raise ApiError('Missing "name" query parameter.')
    if not session.resumes_loaded:
        raise ApiError("No resumes loaded yet.", 409)

    remaining = [r for r in session.loaded_resumes_as_list() if r["name"] != name]
    if remaining:
        session.ai.load_resumes(remaining)
    else:
        session.ai.resumes_data = None
        session.resumes_loaded = False
    session.analyzed = False

    return jsonify({"message": f"Removed {name}", "resumes": session.resume_summaries()})

"""
app/routes/charts.py
=======================
Each route calls straight into ResumeScreeningVisualizer and hands back
the resulting PNG's URL. matplotlib.use('Agg') is set once in app/__init__.py
before this module (or resume_screening_ai) ever imports pyplot.
"""

import matplotlib.pyplot as plt
from flask import Blueprint, current_app, jsonify, request

from app.errors import ApiError

charts_bp = Blueprint("charts", __name__, url_prefix="/api/chart")


def _require_analyzed(session):
    if not session.analyzed:
        raise ApiError("Run analysis first.", 409)


@charts_bp.route("/rankings")
def chart_rankings():
    session = current_app.screening_session
    _require_analyzed(session)
    top_n = request.args.get("top_n", default=10, type=int)
    path, url = session.fresh_chart_path("rankings")
    session.visualizer.plot_candidate_rankings(top_n=top_n, save_path=path)
    plt.close("all")
    return jsonify({"image_url": url})


@charts_bp.route("/breakdown")
def chart_breakdown():
    session = current_app.screening_session
    _require_analyzed(session)
    name = request.args.get("name", "")
    if not name:
        raise ApiError('Missing "name" query parameter.')
    path, url = session.fresh_chart_path("breakdown")
    try:
        session.visualizer.plot_score_breakdown(name, save_path=path)
    except IndexError:
        raise ApiError(f'No candidate named "{name}" found.', 404)
    finally:
        plt.close("all")
    return jsonify({"image_url": url})


@charts_bp.route("/skills")
def chart_skills():
    session = current_app.screening_session
    _require_analyzed(session)
    top_n = request.args.get("top_n", default=5, type=int)
    path, url = session.fresh_chart_path("skills")
    session.visualizer.plot_skills_comparison(top_n=top_n, save_path=path)
    plt.close("all")
    return jsonify({"image_url": url})


@charts_bp.route("/distribution")
def chart_distribution():
    session = current_app.screening_session
    _require_analyzed(session)
    path, url = session.fresh_chart_path("distribution")
    session.visualizer.plot_score_distribution(save_path=path)
    plt.close("all")
    return jsonify({"image_url": url})


@charts_bp.route("/summary")
def chart_summary():
    session = current_app.screening_session
    _require_analyzed(session)
    path, url = session.fresh_chart_path("summary")
    session.visualizer.generate_summary_report(save_path=path)
    plt.close("all")
    return jsonify({"image_url": url})

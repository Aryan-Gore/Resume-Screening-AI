"""
app/services/screening_session.py
====================================
Wraps one screening "session" - a ResumeScreeningAI instance, its
Visualizer, and the flags that track what's been loaded - as a class
instead of a module-level global dict.

Why this matters: the previous version of this app kept state as a plain
dict at module scope. That works, but it means every Flask app instance
in the same process shares the exact same state - which is fine for one
person running `python app.py`, but makes writing isolated tests awkward
(one test's leftover data leaks into the next). Here, create_app() builds
a fresh ScreeningSession and attaches it to the app instance, so
`create_app('testing')` in a pytest fixture gets its own isolated session
automatically, with no manual reset-between-tests bookkeeping needed.
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any

from core.resume_screening_ai import ResumeScreeningAI, ResumeScreeningVisualizer


class ScreeningSession:
    def __init__(self, charts_dir: Path):
        self.charts_dir = charts_dir
        self.charts_dir.mkdir(parents=True, exist_ok=True)
        self.ai = ResumeScreeningAI()
        self.visualizer = ResumeScreeningVisualizer(self.ai)
        self.jd_loaded = False
        self.resumes_loaded = False
        self.analyzed = False

    def reset(self) -> None:
        self.ai = ResumeScreeningAI()
        self.visualizer = ResumeScreeningVisualizer(self.ai)
        self.jd_loaded = False
        self.resumes_loaded = False
        self.analyzed = False

    # -- resume pool helpers -------------------------------------------------
    def loaded_resumes_as_list(self) -> list[dict[str, str]]:
        """Read back whatever's currently loaded in the {'name','text'}
        shape load_resumes() expects, so 'add more resumes' requests can
        be merged with what's already there."""
        if not self.resumes_loaded or self.ai.resumes_data is None:
            return []
        return [
            {"name": row["name"], "text": row["raw_text"]}
            for _, row in self.ai.resumes_data.iterrows()
        ]

    def resume_summaries(self) -> list[dict[str, Any]]:
        if not self.resumes_loaded or self.ai.resumes_data is None:
            return []
        out = []
        for r in self.ai.resumes_data.to_dict(orient="records"):
            out.append({
                "name": r["name"],
                "word_count": len(r["raw_text"].split()),
                "technical_skills": r["skills"]["technical"],
                "soft_skills": r["skills"]["soft"],
                "years_of_experience": r["years_of_experience"],
                "education": r["education"],
            })
        return out

    @staticmethod
    def dedupe_name(name: str, existing_names: set[str]) -> str:
        """Avoid silently overwriting a candidate when two uploads share a
        name (e.g. two files both named 'resume.pdf' by their authors)."""
        if name not in existing_names:
            return name
        i = 2
        while f"{name} ({i})" in existing_names:
            i += 1
        return f"{name} ({i})"

    # -- chart output paths ---------------------------------------------------
    def fresh_chart_path(self, prefix: str) -> tuple[str, str]:
        """Every chart request gets a unique filename so the browser never
        caches a stale PNG at a reused URL. Returns (disk_path, url_path)."""
        filename = f"{prefix}_{uuid.uuid4().hex[:10]}.png"
        return str(self.charts_dir / filename), f"/static/{self.charts_dir.name}/{filename}"

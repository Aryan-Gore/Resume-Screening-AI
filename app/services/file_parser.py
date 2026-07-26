"""
app/services/file_parser.py
=============================
Turns an uploaded file (.txt, .pdf, .docx) into plain text so it can be
handed to ResumeScreeningAI.load_job_description() / load_resumes().

Kept separate from core/resume_screening_ai.py on purpose: that file
is the original AI engine, byte-for-byte untouched. Parsing uploaded file
formats is a web-app concern, not an AI-engine concern, so it lives here.
"""

from __future__ import annotations

import os

from werkzeug.datastructures import FileStorage

ALLOWED_EXTENSIONS = {".txt", ".pdf", ".docx"}


class UnsupportedFileTypeError(ValueError):
    """Raised when a file with an unsupported extension - or no
    extractable text - is uploaded."""


def extract_text_from_upload(file_storage: FileStorage) -> str:
    """Read a Flask FileStorage object and return its plain-text contents.

    Raises:
        UnsupportedFileTypeError: bad extension, or no extractable text
            (e.g. a scanned/image-only PDF).
    """
    filename = file_storage.filename or "upload"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise UnsupportedFileTypeError(
            f'"{filename}" has an unsupported file type ({ext or "no extension"}). '
            f"Please upload .txt, .pdf, or .docx files."
        )

    extractor = {".txt": _extract_txt, ".pdf": _extract_pdf, ".docx": _extract_docx}[ext]
    text = extractor(file_storage)

    if not text.strip():
        raise UnsupportedFileTypeError(
            f'"{filename}" appears to be empty or is a scanned/image-only file '
            f"that has no selectable text."
        )
    return text


def _extract_txt(file_storage: FileStorage) -> str:
    return file_storage.read().decode("utf-8", errors="ignore")


def _extract_pdf(file_storage: FileStorage) -> str:
    from pypdf import PdfReader

    reader = PdfReader(file_storage)
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _extract_docx(file_storage: FileStorage) -> str:
    import docx

    document = docx.Document(file_storage)
    return "\n".join(p.text for p in document.paragraphs)


def name_from_filename(filename: str) -> str:
    """Turn 'priya_sharma_resume.pdf' into 'Priya Sharma Resume' as a
    sensible default candidate name (the user can rename it in the UI)."""
    stem = os.path.splitext(filename)[0]
    cleaned = stem.replace("_", " ").replace("-", " ").strip()
    return " ".join(cleaned.split()).title() or "Unnamed Candidate"

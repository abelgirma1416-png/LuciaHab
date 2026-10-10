"""Validation checks for question drafts ensuring educational integrity and schema compliance."""
from __future__ import annotations
from typing import Dict, List, Any, Tuple

class QuestionValidator:
    def validate(self, question: Dict[str, Any]) -> Tuple[str, List[str]]:
        """Validate question fields. Returns (status, notes) where status is 'valid', 'warning', or 'error'."""
        errors: List[str] = []
        warnings: List[str] = []

        # 1. Missing field validation
        q_text = question.get("question_text", "").strip()
        if not q_text:
            errors.append("Question text is empty.")
        elif len(q_text) < 15:
            warnings.append("Question text is unusually short.")

        options = question.get("options", [])
        if not isinstance(options, list):
            errors.append("Options must be a list.")
        elif len(options) != 4:
            errors.append(f"Multiple-choice question must have exactly 4 options; found {len(options)}.")

        # 2. Duplicate option detection
        if isinstance(options, list) and len(options) > 1:
            clean_opts = [str(o).strip().lower() for o in options]
            if len(clean_opts) != len(set(clean_opts)):
                errors.append("Duplicate option detected among choices.")

        # 3. Correct answer consistency check
        correct_idx = question.get("correct_index")
        if correct_idx is None:
            errors.append("Missing correct_index.")
        elif not isinstance(correct_idx, int) or correct_idx < 0 or correct_idx >= len(options):
            errors.append(f"Invalid correct_index '{correct_idx}' for options count {len(options)}.")

        # 4. Explanation check
        explanation = question.get("explanation", "").strip()
        if not explanation:
            warnings.append("Missing explanatory solution.")
        elif len(explanation) < 10:
            warnings.append("Explanation is too brief.")

        # 5. Source traceability check
        source_doc = question.get("source_document", "").strip()
        source_page = question.get("source_page_start")
        if not source_doc:
            warnings.append("Missing source document attribution.")
        if source_page is None or source_page < 1:
            warnings.append("Missing or invalid source page number.")

        # 6. Difficulty validity
        diff = str(question.get("difficulty", "")).lower()
        if diff not in ["easy", "medium", "hard"]:
            warnings.append(f"Non-standard difficulty level '{diff}'.")

        # Determine overall validation status
        if errors:
            return "error", errors + warnings
        elif warnings:
            return "warning", warnings
        return "valid", []

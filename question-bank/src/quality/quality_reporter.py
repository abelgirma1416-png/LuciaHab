"""Aggregated quality assurance reporting across subjects, topics, and difficulty tiers."""
from __future__ import annotations
import json
from typing import List, Dict, Any
from collections import Counter
from .validator import QuestionValidator
from .duplicate_detector import DuplicateDetector
from .math_verifier import MathVerifier

class QualityReporter:
    def __init__(self):
        self.validator = QuestionValidator()
        self.dup_detector = DuplicateDetector()
        self.math_verifier = MathVerifier()

    def generate_report(self, questions: List[Dict[str, Any]]) -> Dict[str, Any]:
        total = len(questions)
        subject_counts = Counter(q.get("subject", "Unknown") for q in questions)
        difficulty_counts = Counter(q.get("difficulty", "medium").lower() for q in questions)
        type_counts = Counter(q.get("question_type", "multiple_choice") for q in questions)

        validation_statuses = Counter()
        all_warnings: List[str] = []
        all_errors: List[str] = []
        math_issues: List[str] = []

        for q in questions:
            status, notes = self.validator.validate(q)
            q["validation_status"] = status
            q["validation_notes"] = notes
            validation_statuses[status] += 1

            if status == "error":
                all_errors.extend(f"[{q.get('id')}]: {n}" for n in notes)
            elif status == "warning":
                all_warnings.extend(f"[{q.get('id')}]: {n}" for n in notes)

            # Math verification if calculation
            if q.get("question_type") == "calculation":
                is_valid_math, math_msg = self.math_verifier.verify_question(q)
                if not is_valid_math:
                    math_issues.append(f"[{q.get('id')}]: {math_msg}")

        # Duplicate detection
        dup_report = self.dup_detector.find_duplicates(questions)

        # Traceability metric
        traceable_count = sum(1 for q in questions if q.get("source_document") and q.get("source_page_start"))
        traceability_pct = round((traceable_count / total * 100), 1) if total > 0 else 0.0

        return {
            "total_questions": total,
            "traceability_percentage": traceability_pct,
            "subjects_breakdown": dict(subject_counts),
            "difficulty_breakdown": dict(difficulty_counts),
            "question_type_breakdown": dict(type_counts),
            "validation_summary": dict(validation_statuses),
            "exact_duplicate_count": dup_report["exact_duplicate_count"],
            "similarity_warning_count": dup_report["similarity_warning_count"],
            "math_issues_count": len(math_issues),
            "math_issues": math_issues,
            "error_sample": all_errors[:10],
            "warning_sample": all_warnings[:10],
            "similarity_warnings": dup_report["similarity_warnings"][:10]
        }

    def format_markdown_report(self, report: Dict[str, Any]) -> str:
        md = [
            "# Quality Assurance & Question Bank Validation Report",
            f"\n**Total Questions Evaluated**: {report['total_questions']}",
            f"**Source Traceability**: {report['traceability_percentage']}%\n",
            "## 1. Subject & Difficulty Distribution",
            "| Subject | Count |",
            "| :--- | :--- |"
        ]
        for subj, count in report["subjects_breakdown"].items():
            md.append(f"| {subj} | {count} |")

        md.extend([
            "\n| Difficulty | Count |",
            "| :--- | :--- |"
        ])
        for diff, count in report["difficulty_breakdown"].items():
            md.append(f"| {diff.capitalize()} | {count} |")

        md.extend([
            "\n## 2. Validation Status",
            f"- **Valid**: {report['validation_summary'].get('valid', 0)}",
            f"- **Warnings**: {report['validation_summary'].get('warning', 0)}",
            f"- **Errors**: {report['validation_summary'].get('error', 0)}",
            f"- **Exact Duplicates**: {report['exact_duplicate_count']}",
            f"- **Similarity Alerts**: {report['similarity_warning_count']}",
            f"- **Math Verification Discrepancies**: {report['math_issues_count']}"
        ])

        if report["error_sample"]:
            md.append("\n### Errors Sample:")
            for err in report["error_sample"]:
                md.append(f"- {err}")

        return "\n".join(md)

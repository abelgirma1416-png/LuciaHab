#!/usr/bin/env python3
"""
validate_math_json.py - Phase 5 Quality Validation Script for GameVerse Math Question Bank.
Checks schema compliance, duplicate IDs, question coverage, answer consistency,
option uniqueness, math expression validity, and produces detailed reports.
"""

from __future__ import annotations

import os
import sys
import json
import re
import argparse
from typing import Dict, List, Any, Set
from collections import Counter

# Configure UTF-8 stdout
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")


def validate_math_question_bank(
    json_path: str,
    review_json_path: Optional[str],
    reports_dir: str
) -> Dict[str, Any]:
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"JSON question bank not found: {json_path}")

    with open(json_path, "r", encoding="utf-8") as f:
        questions: List[Dict[str, Any]] = json.load(f)

    review_questions: List[Dict[str, Any]] = []
    if review_json_path and os.path.exists(review_json_path):
        with open(review_json_path, "r", encoding="utf-8") as f:
            review_questions = json.load(f)

    total_count = len(questions)
    print(f"Loaded {total_count} questions from {json_path}")

    # Metrics collectors
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    seen_ids: Set[str] = set()
    duplicate_ids: List[str] = []

    seen_numbers: Set[int] = set()
    duplicate_numbers: List[int] = []

    text_hashes: Dict[str, str] = {}
    duplicate_questions: List[Dict[str, Any]] = []

    difficulty_counts = Counter()
    area_counts = Counter()
    topic_counts = Counter()

    for idx, q in enumerate(questions):
        q_id = q.get("id")
        q_num = q.get("questionNumber")
        q_text = (q.get("question") or "").strip()
        options = q.get("options")
        correct_ans = q.get("correctAnswer")
        correct_idx = q.get("correctIndex")
        correct_letter = q.get("correctAnswerLetter")
        explanation = (q.get("explanation") or "").strip()
        difficulty = (q.get("difficulty") or "").lower()
        area = q.get("area") or "Unknown"
        topic = q.get("topic") or "Unknown"

        difficulty_counts[difficulty] += 1
        area_counts[area] += 1
        topic_counts[topic] += 1

        # 1. ID checks
        if not q_id:
            errors.append({"id": f"item_{idx}", "issue": "Missing question ID"})
        elif q_id in seen_ids:
            duplicate_ids.append(q_id)
            errors.append({"id": q_id, "issue": f"Duplicate ID '{q_id}'"})
        else:
            seen_ids.add(q_id)

        # 2. Question number checks
        if q_num is None:
            errors.append({"id": q_id, "issue": "Missing questionNumber"})
        elif q_num in seen_numbers:
            duplicate_numbers.append(q_num)
            errors.append({"id": q_id, "issue": f"Duplicate questionNumber {q_num}"})
        else:
            seen_numbers.add(q_num)

        # 3. Question text check
        if not q_text:
            errors.append({"id": q_id, "issue": "Question text is empty"})
        elif len(q_text) < 5:
            warnings.append({"id": q_id, "issue": f"Question text unusually short: '{q_text}'"})

        # Check for potential broken math expressions (unbalanced brackets/parentheses)
        for open_b, close_b, b_name in [('(', ')', 'parentheses'), ('[', ']', 'brackets'), ('{', '}', 'braces')]:
            if q_text.count(open_b) != q_text.count(close_b):
                warnings.append({"id": q_id, "issue": f"Unbalanced {b_name} in question: '{q_text[:60]}'"})

        # 4. Duplicate question text detection
        norm_text = re.sub(r'\s+', ' ', q_text.lower())
        if norm_text in text_hashes:
            duplicate_questions.append({
                "id": q_id,
                "first_seen_in": text_hashes[norm_text],
                "question": q_text[:80]
            })
        else:
            text_hashes[norm_text] = q_id

        # 5. Options check
        if not isinstance(options, list):
            errors.append({"id": q_id, "issue": "Options is not a list"})
        elif len(options) != 4:
            errors.append({"id": q_id, "issue": f"Question must have 4 options, found {len(options)}"})
        else:
            # Check empty options
            if any(opt is None or str(opt).strip() == "" for opt in options):
                errors.append({"id": q_id, "issue": "Contains empty option"})

            # Check duplicate options within the question
            str_opts = [str(o).strip().lower() for o in options]
            if len(str_opts) != len(set(str_opts)):
                warnings.append({"id": q_id, "issue": f"Contains identical options: {options}"})

        # 6. Correct answer consistency check
        if correct_letter not in ["A", "B", "C", "D"]:
            errors.append({"id": q_id, "issue": f"Invalid correctAnswerLetter '{correct_letter}'"})

        if correct_idx is None or not (0 <= correct_idx < 4):
            errors.append({"id": q_id, "issue": f"Invalid correctIndex '{correct_idx}'"})

        if isinstance(options, list) and 0 <= (correct_idx or -1) < len(options):
            expected_val = options[correct_idx]
            if correct_ans != expected_val:
                errors.append({
                    "id": q_id,
                    "issue": f"correctAnswer mismatch: expected '{expected_val}', got '{correct_ans}'"
                })

        # 7. Explanation check
        if not explanation:
            warnings.append({"id": q_id, "issue": "Missing solution explanation"})

    # Question coverage check
    all_expected = set(range(1, 1001))
    missing_numbers = sorted(list(all_expected - seen_numbers))

    is_all_valid = len(errors) == 0 and len(missing_numbers) == 0 and total_count == 1000

    report = {
        "status": "PASSED" if is_all_valid else "FAILED",
        "total_questions": total_count,
        "valid_questions_count": total_count - len(errors),
        "invalid_questions_count": len(errors),
        "review_required_count": len(review_questions),
        "warnings_count": len(warnings),
        "missing_question_numbers": missing_numbers,
        "duplicate_ids_count": len(duplicate_ids),
        "duplicate_ids": duplicate_ids,
        "duplicate_questions_count": len(duplicate_questions),
        "duplicate_questions_sample": duplicate_questions[:5],
        "difficulty_distribution": dict(difficulty_counts),
        "area_distribution": dict(area_counts),
        "topic_distribution": dict(topic_counts),
        "errors": errors[:50],
        "warnings": warnings[:50]
    }

    os.makedirs(reports_dir, exist_ok=True)
    report_json_path = os.path.join(reports_dir, "math_validation_report.json")
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    report_md_path = os.path.join(reports_dir, "math_validation_report.md")
    with open(report_md_path, "w", encoding="utf-8") as f:
        f.write("# GameVerse Math Question Bank Validation Report\n\n")
        f.write(f"**Overall Status:** `{'PASSED' if is_all_valid else 'ACTION REQUIRED'}`\n\n")
        f.write("## Summary Metrics\n\n")
        f.write(f"| Metric | Count |\n")
        f.write(f"| :--- | :--- |\n")
        f.write(f"| Total Questions in Bank | **{total_count}** |\n")
        f.write(f"| Valid Questions | **{total_count - len(errors)}** |\n")
        f.write(f"| Invalid Questions (Errors) | **{len(errors)}** |\n")
        f.write(f"| Review-Required Questions | **{len(review_questions)}** |\n")
        f.write(f"| Warnings | **{len(warnings)}** |\n")
        f.write(f"| Duplicate IDs | **{len(duplicate_ids)}** |\n")
        f.write(f"| Duplicate Text Items | **{len(duplicate_questions)}** |\n")
        f.write(f"| Missing Question Numbers (1–1000) | **{len(missing_numbers)}** |\n\n")

        f.write("## Difficulty Breakdown\n\n")
        for diff, cnt in difficulty_counts.most_common():
            f.write(f"- **{diff.capitalize()}:** {cnt} questions\n")
        f.write("\n")

        f.write("## Mathematical Areas\n\n")
        for area, cnt in area_counts.most_common():
            f.write(f"- **{area}:** {cnt} questions\n")
        f.write("\n")

        if errors:
            f.write("## Validation Errors\n\n")
            for err in errors[:25]:
                f.write(f"- `{err['id']}`: {err['issue']}\n")
            f.write("\n")

        if warnings:
            f.write("## Warnings (Informational)\n\n")
            for w in warnings[:25]:
                f.write(f"- `{w['id']}`: {w['issue']}\n")
            f.write("\n")

    print(f"Validation complete! Status: {report['status']}")
    print(f"Reports written to {report_json_path} and {report_md_path}")
    return report


def main():
    parser = argparse.ArgumentParser(description="Validate converted math question bank JSON")
    parser.add_argument("--json", default=r"question-bank\json\math_questions.json")
    parser.add_argument("--review-json", default=r"question-bank\json\math_questions_review.json")
    parser.add_argument("--reports-dir", default=r"question-bank\reports")
    args = parser.parse_args()

    validate_math_question_bank(
        json_path=args.json,
        review_json_path=args.review_json,
        reports_dir=args.reports_dir
    )


if __name__ == "__main__":
    main()

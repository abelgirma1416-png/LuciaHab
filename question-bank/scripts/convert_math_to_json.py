#!/usr/bin/env python3
"""
convert_math_to_json.py - Phase 4 Conversion Script for GameVerse Math Question Bank.
Parses extracted text into canonical JSON schema matching Turbo Math Challenge data model,
merging Part I (questions), Part II (answer keys), and Part III (worked solutions).
Flags any incomplete/ambiguous items for manual review.
"""

from __future__ import annotations

import os
import sys
import json
import re
import argparse
from typing import Dict, List, Any, Optional

# Configure UTF-8 stdout
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")


def convert_questions(
    extracted_json_path: str,
    output_json_path: str,
    review_json_path: str,
    reports_dir: str
) -> Dict[str, Any]:
    if not os.path.exists(extracted_json_path):
        raise FileNotFoundError(f"Extracted pages JSON not found: {extracted_json_path}")

    with open(extracted_json_path, "r", encoding="utf-8") as f:
        pages_data = json.load(f)

    # Reconstruct pages map: page_number -> text
    pages = {p["page_number"]: p["text"] for p in pages_data}
    total_pages = len(pages)
    print(f"Loaded {total_pages} pages from {extracted_json_path}")

    # 1. Parse Part II - Answer Key (pages 136 and 137)
    print("Parsing Part II (Answer Key)...")
    text_ak = pages.get(136, "") + "\n" + pages.get(137, "")
    ak_matches = re.findall(r'(\b\d{1,4})\s+([ABCD])\b', text_ak)
    answer_keys = {int(num): letter for num, letter in ak_matches}
    print(f"Found {len(answer_keys)} answer keys in Part II")

    # 2. Parse Part III - Worked Solutions (pages 138 to 188)
    print("Parsing Part III (Worked Solutions)...")
    full_sol_text = ""
    for p_num in range(138, 189):
        if p_num in pages:
            full_sol_text += pages[p_num] + "\n"

    sol_pattern = re.compile(r'(?:^|\n)(\d+)\.\s+Answer\s+([ABCD])\s+([^\n·]+)·\s*([^\n]+)\n')
    sol_matches = list(sol_pattern.finditer(full_sol_text))
    solutions: Dict[int, Dict[str, Any]] = {}
    for i in range(len(sol_matches)):
        m = sol_matches[i]
        q_num = int(m.group(1))
        ans_letter = m.group(2)
        topic = m.group(3).strip()
        difficulty = m.group(4).strip()

        start_pos = m.end()
        end_pos = sol_matches[i+1].start() if i + 1 < len(sol_matches) else len(full_sol_text)
        body = full_sol_text[start_pos:end_pos].strip()
        body_lines = [l for l in body.split('\n') if not l.startswith('GameVerse · Mathematics Question Bank')]
        explanation = "\n".join(body_lines).strip()

        solutions[q_num] = {
            "answer": ans_letter,
            "topic": topic,
            "difficulty": difficulty,
            "explanation": explanation
        }
    print(f"Found {len(solutions)} worked solutions in Part III")

    # 3. Parse Part I - Questions (pages 2 to 135)
    print("Parsing Part I (Questions)...")
    current_area = "Foundations"
    current_subtopic = "Arithmetic"

    area_pattern = re.compile(r'^[A-G]\.\s+(.*)$')
    q_header_pattern = re.compile(r'^Q(\d{4})\s*·\s*([^\n·]+)·\s*(?:≈(\d+)\s*s)?\s*·?\s*(.*)$')

    valid_questions: List[Dict[str, Any]] = []
    review_questions: List[Dict[str, Any]] = []

    for page_num in range(2, 136):
        page_text = pages.get(page_num, "")
        lines = [l.strip() for l in page_text.split("\n") if l.strip()]

        idx = 0
        while idx < len(lines):
            line = lines[idx]

            # Skip header/footer
            if "GameVerse · Mathematics Question Bank" in line or line.startswith("Part I – Questions"):
                idx += 1
                continue

            # Check Area
            area_m = area_pattern.match(line)
            if area_m and len(line) < 40 and not line.startswith("A. "):
                current_area = area_m.group(1).strip()
                idx += 1
                continue

            # Check Question Header
            q_m = q_header_pattern.match(line)
            if q_m:
                q_num = int(q_m.group(1))
                diff_hdr = q_m.group(2).strip().lower()
                est_seconds = int(q_m.group(3)) if q_m.group(3) else None
                level = q_m.group(4).strip() if q_m.group(4) else ""

                idx += 1
                q_text_parts = []
                while idx < len(lines) and not (lines[idx].startswith("A. ") or lines[idx] == "A."):
                    q_text_parts.append(lines[idx])
                    idx += 1

                raw_q_text = " ".join(q_text_parts)
                cleaned_q_text = re.sub(r'^\d+\.\s*', '', raw_q_text).strip()

                # Extract options A, B, C, D
                raw_options: Dict[str, str] = {}
                curr_opt = None
                curr_opt_lines = []

                while idx < len(lines):
                    opt_line = lines[idx]
                    if q_header_pattern.match(opt_line) or "GameVerse · Mathematics Question Bank" in opt_line:
                        break

                    m_opt = re.match(r'^([ABCD])\.\s*(.*)$', opt_line)
                    if m_opt:
                        if curr_opt:
                            raw_options[curr_opt] = " ".join(curr_opt_lines).strip()
                        curr_opt = m_opt.group(1)
                        curr_opt_lines = [m_opt.group(2)]
                    elif curr_opt:
                        curr_opt_lines.append(opt_line)
                    idx += 1

                    if len(raw_options) == 3 and curr_opt == "D" and (idx >= len(lines) or q_header_pattern.match(lines[idx])):
                        break

                if curr_opt:
                    raw_options[curr_opt] = " ".join(curr_opt_lines).strip()

                # Get answer and solution
                ans_key_letter = answer_keys.get(q_num)
                sol = solutions.get(q_num, {})
                sol_ans_letter = sol.get("answer")
                final_ans_letter = ans_key_letter or sol_ans_letter

                explanation = sol.get("explanation", "")
                topic = sol.get("topic", current_subtopic)
                difficulty = diff_hdr or sol.get("difficulty", "medium").lower()

                # Options list: [A, B, C, D]
                opt_list = [
                    raw_options.get("A", ""),
                    raw_options.get("B", ""),
                    raw_options.get("C", ""),
                    raw_options.get("D", "")
                ]

                letter_to_index = {"A": 0, "B": 1, "C": 2, "D": 3}
                correct_idx = letter_to_index.get(final_ans_letter) if final_ans_letter else None
                correct_answer_text = opt_list[correct_idx] if (correct_idx is not None and 0 <= correct_idx < 4) else None

                # Area mapping by official ID range from Table of Contents
                def get_area(qn: int) -> str:
                    if 1 <= qn <= 154:
                        return "Foundations"
                    elif 155 <= qn <= 330:
                        return "Calculus and Analysis"
                    elif 331 <= qn <= 462:
                        return "Algebra"
                    elif 463 <= qn <= 616:
                        return "Geometry and Topology"
                    elif 617 <= qn <= 748:
                        return "Discrete Mathematics and Logic"
                    elif 749 <= qn <= 832:
                        return "Probability and Statistics"
                    elif 833 <= qn <= 1000:
                        return "Applied Mathematics"
                    return current_area

                area_name = get_area(q_num)
                item_id = f"math_{q_num:04d}"
                q_item = {
                    "id": item_id,
                    "questionNumber": q_num,
                    "question": cleaned_q_text,
                    "options": opt_list,
                    "correctAnswer": correct_answer_text,
                    "correctAnswerLetter": final_ans_letter,
                    "correctIndex": correct_idx,
                    "explanation": explanation,
                    "topic": topic,
                    "area": area_name,
                    "difficulty": difficulty,
                    "targetTimeSeconds": est_seconds,
                    "gradeLevel": level,
                    "sourcePage": page_num,
                    "isVerified": bool(final_ans_letter and correct_answer_text and len(raw_options) == 4)
                }

                # Validation criteria for review vs valid
                review_reasons = []
                if not cleaned_q_text:
                    review_reasons.append("Empty question text")
                if len(raw_options) != 4 or any(not o for o in opt_list):
                    review_reasons.append(f"Options incomplete: found {len(raw_options)}/4")
                if not final_ans_letter:
                    review_reasons.append("Missing correct answer key")
                if correct_answer_text is None:
                    review_reasons.append("Correct answer does not match options")
                if not explanation:
                    review_reasons.append("Missing explanation")

                if review_reasons:
                    q_item["reviewReasons"] = review_reasons
                    review_questions.append(q_item)
                else:
                    valid_questions.append(q_item)
            else:
                idx += 1

    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    os.makedirs(os.path.dirname(review_json_path), exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)

    # Sort questions deterministically by questionNumber
    valid_questions.sort(key=lambda x: x["questionNumber"])
    review_questions.sort(key=lambda x: x["questionNumber"])

    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(valid_questions, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(valid_questions)} valid questions to: {output_json_path}")

    with open(review_json_path, "w", encoding="utf-8") as f:
        json.dump(review_questions, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(review_questions)} review questions to: {review_json_path}")

    summary = {
        "total_extracted": len(valid_questions) + len(review_questions),
        "valid_count": len(valid_questions),
        "review_count": len(review_questions),
        "output_path": output_json_path,
        "review_path": review_json_path
    }
    return summary


def main():
    parser = argparse.ArgumentParser(description="Convert extracted math text to canonical JSON")
    parser.add_argument("--extracted-json", default=r"question-bank\extracted\math_pdf_extracted.json")
    parser.add_argument("--output-json", default=r"question-bank\json\math_questions.json")
    parser.add_argument("--review-json", default=r"question-bank\json\math_questions_review.json")
    parser.add_argument("--reports-dir", default=r"question-bank\reports")
    args = parser.parse_args()

    convert_questions(
        extracted_json_path=args.extracted_json,
        output_json_path=args.output_json,
        review_json_path=args.review_json,
        reports_dir=args.reports_dir
    )


if __name__ == "__main__":
    main()

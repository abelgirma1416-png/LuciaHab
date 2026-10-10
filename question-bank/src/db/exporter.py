"""Exporter for formatting approved questions for Supabase and the GameVerse React client."""
from __future__ import annotations
import json
import os
from typing import List, Dict, Any

CATEGORY_MAP = {
    "mathematics": "ethiopian_science",
    "biology": "ethiopian_science",
    "physics": "ethiopian_science",
    "chemistry": "ethiopian_science",
    "computer science": "ethiopian_science",
    "history": "ethiopian_history",
    "geography": "ethiopian_geography",
    "english": "general_knowledge",
}

class QuestionExporter:
    @staticmethod
    def to_gameverse_format(question: Dict[str, Any]) -> Dict[str, Any]:
        """Convert an approved question draft to GameVerse TriviaQuestion format."""
        subject = question.get("subject", "General").lower()
        category = CATEGORY_MAP.get(subject, "ethiopian_science")

        q_en = question.get("question_text", "")
        options = question.get("options", ["", "", "", ""])
        correct_idx = question.get("correct_index", 0)
        expl_en = question.get("explanation", "")

        return {
            "id": question.get("id"),
            "category": category,
            "subject": question.get("subject", "General"),
            "difficulty": question.get("difficulty", "medium"),
            "question": {
                "en": q_en,
                "am": question.get("question_am") or q_en
            },
            "options": {
                "en": options,
                "am": question.get("options_am") or options
            },
            "correctIndex": correct_idx,
            "explanation": {
                "en": expl_en,
                "am": question.get("explanation_am") or expl_en
            },
            "source": {
                "document": question.get("source_document", ""),
                "chapter": question.get("source_chapter", ""),
                "page": question.get("source_page_start", 1)
            }
        }

    @staticmethod
    def export_to_json(approved_questions: List[Dict[str, Any]], output_path: str) -> None:
        formatted = [QuestionExporter.to_gameverse_format(q) for q in approved_questions]
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(formatted, f, indent=2, ensure_ascii=False)

    @staticmethod
    def generate_sql_upsert(approved_questions: List[Dict[str, Any]]) -> str:
        """Generate idempotent SQL UPSERT statements for Supabase."""
        lines = [
            "-- Idempotent SQL Upsert for Approved Questions",
            "INSERT INTO public.approved_questions (",
            "    id, question_en, question_am, options_en, options_am, correct_index,",
            "    explanation_en, explanation_am, category, subject, difficulty, source_document, source_chapter, source_page",
            ") VALUES"
        ]

        values_list = []
        for q in approved_questions:
            formatted = QuestionExporter.to_gameverse_format(q)
            q_id = q["id"].replace("'", "''")
            q_en = formatted["question"]["en"].replace("'", "''")
            q_am = formatted["question"]["am"].replace("'", "''")
            opts_en = json.dumps(formatted["options"]["en"]).replace("'", "''")
            opts_am = json.dumps(formatted["options"]["am"]).replace("'", "''")
            c_idx = formatted["correctIndex"]
            expl_en = formatted["explanation"]["en"].replace("'", "''")
            expl_am = formatted["explanation"]["am"].replace("'", "''")
            cat = formatted["category"]
            subj = formatted["subject"].replace("'", "''")
            diff = formatted["difficulty"]
            src_doc = formatted["source"]["document"].replace("'", "''")
            src_chap = formatted["source"]["chapter"].replace("'", "''")
            src_page = formatted["source"]["page"]

            row = f"('{q_id}', '{q_en}', '{q_am}', '{opts_en}'::jsonb, '{opts_am}'::jsonb, {c_idx}, '{expl_en}', '{expl_am}', '{cat}', '{subj}', '{diff}', '{src_doc}', '{src_chap}', {src_page})"
            values_list.append(row)

        if not values_list:
            return "-- No questions to export."

        lines.append(",\n".join(values_list))
        lines.append("ON CONFLICT (id) DO UPDATE SET")
        lines.append("    question_en = EXCLUDED.question_en,")
        lines.append("    options_en = EXCLUDED.options_en,")
        lines.append("    correct_index = EXCLUDED.correct_index,")
        lines.append("    explanation_en = EXCLUDED.explanation_en,")
        lines.append("    difficulty = EXCLUDED.difficulty;")

        return "\n".join(lines)

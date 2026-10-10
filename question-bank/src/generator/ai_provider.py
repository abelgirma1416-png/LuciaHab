"""AI Model question generation provider (OpenAI, Gemini, Anthropic, Ollama)."""
from __future__ import annotations
import json
import os
from typing import List, Dict, Any, Optional
from .base_provider import BaseQuestionGenerator, QuestionDraft

SYSTEM_PROMPT = """You are a senior educational psychometrician and curriculum expert.
Your job is to read an authentic textbook excerpt and generate original, high-quality quiz questions.

RULES:
1. Every question MUST be strictly traceable to the provided textbook excerpt. Do NOT invent facts or theories.
2. Generate 2 to 4 diverse questions per excerpt (e.g., conceptual understanding, definition, calculation/worked example, scenario/application).
3. Each question MUST have exactly 4 distinct answer options.
4. Exactly one option must be unequivocally correct. Distractors must be plausible but unambiguously wrong based on the excerpt.
5. Provide a clear, educational explanation citing the specific concept from the excerpt.
6. Tier the difficulty appropriately: 'easy', 'medium', or 'hard'.
7. Output strictly valid JSON matching this schema:
[
  {
    "question_text": "...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "explanation": "...",
    "difficulty": "medium",
    "question_type": "conceptual",
    "topic": "..."
  }
]
"""

class LLMQuestionGenerator(BaseQuestionGenerator):
    def __init__(
        self,
        provider: str = "openai",
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None
    ):
        self.provider = provider.lower()
        self.api_key = api_key or os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
        self.model = model
        self.base_url = base_url

    def generate_questions_for_chunk(self, chunk: Dict[str, Any]) -> List[QuestionDraft]:
        text = chunk.get("text", "")
        if not text.strip():
            return []

        doc_title = chunk.get("document_title", "Textbook")
        chapter = chunk.get("chapter_title", "General")
        section = chunk.get("section_title", "General")
        p_start = chunk.get("page_start", 1)
        p_end = chunk.get("page_end", 1)
        subject = chunk.get("subject", "General")

        user_prompt = f"""TEXTBOOK EXCERPT:
Document: {doc_title}
Subject: {subject}
Chapter: {chapter}
Section: {section}
Pages: {p_start} - {p_end}

CONTENT:
\"\"\"
{text[:3000]}
\"\"\"

Generate 2-3 high-quality educational quiz questions based strictly on the above content. Output ONLY valid JSON."""

        raw_json_str = self._call_llm_api(user_prompt)
        if not raw_json_str:
            return []

        try:
            # Strip markdown json codeblocks if any
            clean_str = raw_json_str.strip()
            if clean_str.startswith("```json"):
                clean_str = clean_str[7:]
            if clean_str.startswith("```"):
                clean_str = clean_str[3:]
            if clean_str.endswith("```"):
                clean_str = clean_str[:-3]
            clean_str = clean_str.strip()

            parsed = json.loads(clean_str)
            if not isinstance(parsed, list):
                parsed = [parsed]

            drafts: List[QuestionDraft] = []
            for item in parsed:
                q_text = item.get("question_text", "").strip()
                opts = item.get("options", [])
                correct_idx = item.get("correct_index", 0)
                expl = item.get("explanation", "")
                diff = item.get("difficulty", "medium").lower()
                q_type = item.get("question_type", "multiple_choice")
                topic = item.get("topic", section)

                if not q_text or len(opts) != 4 or not (0 <= correct_idx < 4):
                    continue

                q_id = QuestionDraft.generate_stable_id(doc_title, chapter, p_start, q_text)
                drafts.append(QuestionDraft(
                    id=q_id,
                    question_text=q_text,
                    options=opts,
                    correct_index=correct_idx,
                    explanation=expl,
                    subject=subject,
                    topic=topic,
                    difficulty=diff if diff in ["easy", "medium", "hard"] else "medium",
                    question_type=q_type,
                    source_document=doc_title,
                    source_chapter=chapter,
                    source_page_start=p_start,
                    source_page_end=p_end,
                    raw_source_snippet=text[:250]
                ))
            return drafts

        except Exception as e:
            print(f"[Warning] Failed to parse LLM response: {e}")
            return []

    def _call_llm_api(self, prompt: str) -> Optional[str]:
        """Call external LLM API if configured."""
        import requests

        if self.provider == "ollama":
            url = f"{self.base_url or 'http://localhost:11434'}/api/generate"
            payload = {
                "model": self.model or "llama3.2",
                "prompt": f"{SYSTEM_PROMPT}\n\n{prompt}",
                "stream": False
            }
            try:
                res = requests.post(url, json=payload, timeout=60)
                if res.status_code == 200:
                    return res.json().get("response")
            except Exception:
                return None

        elif self.provider == "openai" and self.api_key:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
            payload = {
                "model": self.model or "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2
            }
            try:
                res = requests.post(url, headers=headers, json=payload, timeout=60)
                if res.status_code == 200:
                    return res.json()["choices"][0]["message"]["content"]
            except Exception:
                return None

        return None

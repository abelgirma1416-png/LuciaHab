"""Abstract base interface and data structures for question generation."""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import hashlib

class QuestionDraft:
    def __init__(
        self,
        id: str,
        question_text: str,
        options: List[str],
        correct_index: int,
        explanation: str,
        subject: str,
        topic: str,
        difficulty: str,
        question_type: str,
        source_document: str,
        source_chapter: str,
        source_page_start: int,
        source_page_end: int,
        raw_source_snippet: str = "",
        review_status: str = "pending",
        validation_status: str = "valid",
        validation_notes: Optional[List[str]] = None
    ):
        self.id = id
        self.question_text = question_text
        self.options = options
        self.correct_index = correct_index
        self.explanation = explanation
        self.subject = subject
        self.topic = topic
        self.difficulty = difficulty # 'easy', 'medium', 'hard'
        self.question_type = question_type
        self.source_document = source_document
        self.source_chapter = source_chapter
        self.source_page_start = source_page_start
        self.source_page_end = source_page_end
        self.raw_source_snippet = raw_source_snippet
        self.review_status = review_status # 'pending', 'approved', 'rejected'
        self.validation_status = validation_status # 'valid', 'warning', 'error'
        self.validation_notes = validation_notes or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "question_text": self.question_text,
            "options": self.options,
            "correct_index": self.correct_index,
            "correct_option": self.options[self.correct_index] if 0 <= self.correct_index < len(self.options) else None,
            "explanation": self.explanation,
            "subject": self.subject,
            "topic": self.topic,
            "difficulty": self.difficulty,
            "question_type": self.question_type,
            "source_document": self.source_document,
            "source_chapter": self.source_chapter,
            "source_page_start": self.source_page_start,
            "source_page_end": self.source_page_end,
            "raw_source_snippet": self.raw_source_snippet[:200],
            "review_status": self.review_status,
            "validation_status": self.validation_status,
            "validation_notes": self.validation_notes
        }

    @staticmethod
    def generate_stable_id(source_doc: str, chapter: str, page: int, question_text: str) -> str:
        """Generate deterministic, reproducible question ID."""
        key = f"{source_doc}:{chapter}:{page}:{question_text.strip().lower()}"
        return f"q-{hashlib.sha256(key.encode('utf-8')).hexdigest()[:12]}"


class BaseQuestionGenerator(ABC):
    """Abstract interface for question generation providers."""

    @abstractmethod
    def generate_questions_for_chunk(self, chunk: Dict[str, Any]) -> List[QuestionDraft]:
        """Generate structured questions based strictly on the provided text chunk."""
        pass

"""Question generation orchestrator supporting provider switching and resumable batches."""
from __future__ import annotations
import os
from typing import List, Dict, Any, Optional
from .base_provider import BaseQuestionGenerator, QuestionDraft
from .template_provider import TemplateQuestionGenerator
from .ai_provider import LLMQuestionGenerator

class QuestionGenerationPipeline:
    def __init__(self, provider_name: Optional[str] = None):
        self.provider_name = (provider_name or os.getenv("AI_PROVIDER") or "template").lower()
        self.generator = self._init_generator()

    def _init_generator(self) -> BaseQuestionGenerator:
        if self.provider_name in ["openai", "gemini", "anthropic", "ollama"]:
            return LLMQuestionGenerator(
                provider=self.provider_name,
                model=os.getenv("OPENAI_MODEL") or os.getenv("OLLAMA_MODEL"),
                base_url=os.getenv("OLLAMA_BASE_URL")
            )
        # Default offline rule-based generator
        return TemplateQuestionGenerator()

    def generate_from_chunks(
        self,
        chunks: List[Dict[str, Any]],
        existing_draft_ids: Optional[set] = None,
        progress_callback = None
    ) -> List[QuestionDraft]:
        """Generate questions for a list of chunks, skipping already generated questions."""
        existing_ids = existing_draft_ids or set()
        all_drafts: List[QuestionDraft] = []

        total = len(chunks)
        for idx, chunk in enumerate(chunks):
            chunk_drafts = self.generator.generate_questions_for_chunk(chunk)
            for d in chunk_drafts:
                if d.id not in existing_ids:
                    all_drafts.append(d)
                    existing_ids.add(d.id)

            if progress_callback:
                progress_callback(idx + 1, total)

        return all_drafts

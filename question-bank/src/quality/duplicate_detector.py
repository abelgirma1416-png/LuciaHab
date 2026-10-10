"""Exact and similarity-based duplicate question detection."""
from __future__ import annotations
import re
from typing import List, Dict, Any, Tuple

class DuplicateDetector:
    def __init__(self, similarity_threshold: float = 0.80):
        self.similarity_threshold = similarity_threshold

    @staticmethod
    def normalize_text(text: str) -> str:
        """Lowercases, removes punctuation, collapses whitespace."""
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        return ' '.join(text.split())

    @staticmethod
    def get_tokens(text: str) -> set:
        normalized = DuplicateDetector.normalize_text(text)
        return set(normalized.split())

    @staticmethod
    def jaccard_similarity(set_a: set, set_b: set) -> float:
        if not set_a or not set_b:
            return 0.0
        intersection = len(set_a.intersection(set_b))
        union = len(set_a.union(set_b))
        return intersection / union if union > 0 else 0.0

    def find_duplicates(self, questions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Detect exact and fuzzy duplicates across a batch of questions."""
        exact_duplicates: List[Tuple[str, str, str]] = [] # (id1, id2, text)
        similarity_warnings: List[Dict[str, Any]] = []

        seen_normalized: Dict[str, str] = {} # norm_text -> id
        token_cache: Dict[str, set] = {}

        for q in questions:
            q_id = q.get("id", "")
            q_text = q.get("question_text", "")
            norm = self.normalize_text(q_text)

            # 1. Exact match check
            if norm in seen_normalized:
                prior_id = seen_normalized[norm]
                exact_duplicates.append((prior_id, q_id, q_text))
            else:
                seen_normalized[norm] = q_id

            token_cache[q_id] = self.get_tokens(q_text)

        # 2. Similarity check across distinct pairs
        q_ids = list(token_cache.keys())
        n = len(q_ids)
        for i in range(n):
            id1 = q_ids[i]
            tokens1 = token_cache[id1]
            for j in range(i + 1, n):
                id2 = q_ids[j]
                tokens2 = token_cache[id2]
                sim = self.jaccard_similarity(tokens1, tokens2)
                if sim >= self.similarity_threshold and sim < 1.0:
                    similarity_warnings.append({
                        "id_1": id1,
                        "id_2": id2,
                        "similarity_score": round(sim, 3),
                        "text_1": next(q["question_text"] for q in questions if q.get("id") == id1),
                        "text_2": next(q["question_text"] for q in questions if q.get("id") == id2)
                    })

        return {
            "exact_duplicate_count": len(exact_duplicates),
            "exact_duplicates": exact_duplicates,
            "similarity_warning_count": len(similarity_warnings),
            "similarity_warnings": similarity_warnings
        }

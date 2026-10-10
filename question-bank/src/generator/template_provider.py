"""Template and rule-based question generator for offline/manual workflow without external AI keys."""
from __future__ import annotations
import re
from typing import List, Dict, Any
from .base_provider import BaseQuestionGenerator, QuestionDraft

class TemplateQuestionGenerator(BaseQuestionGenerator):
    """Generates traceable questions from text chunks using grammatical and pedagogical rule extraction."""

    def __init__(self):
        # Common definition extraction patterns
        self.def_regexes = [
            re.compile(r'Definition\s*(?:\d+(?:\.\d+)?)?[:\.\s]+([^\.]+?)\s+(?:is|is defined as|refers to|means)\s+([^\.]+\.)', re.IGNORECASE),
            re.compile(r'(?:A|An|The)\s+([a-zA-Z\s]{3,30})\s+(?:is defined as|is called|is said to be|is a)\s+([^\.]+\.)', re.IGNORECASE),
            re.compile(r'([A-Z][a-zA-Z\s]{2,25})\s+is\s+(?:a|an)\s+([^\.]+\.)'),
        ]

    def generate_questions_for_chunk(self, chunk: Dict[str, Any]) -> List[QuestionDraft]:
        text = chunk.get("text", "")
        doc_title = chunk.get("document_title", "Document")
        chapter = chunk.get("chapter_title", "General")
        section = chunk.get("section_title", "General")
        p_start = chunk.get("page_start", 1)
        p_end = chunk.get("page_end", 1)
        subject = chunk.get("subject", "General")

        drafts: List[QuestionDraft] = []

        # 1. Extract definitions & concepts
        definitions_found = []
        for reg in self.def_regexes:
            for match in reg.finditer(text):
                term = match.group(1).strip()
                meaning = match.group(2).strip()
                if 1 <= len(term.split()) < 6 and len(meaning) > 15:
                    definitions_found.append((term, meaning, match.group(0)))

        # Generate definition questions
        for term, meaning, full_stmt in definitions_found[:2]:
            clean_term = term.rstrip(':').strip()
            # Distractors for definitions
            distractors = self._generate_definition_distractors(clean_term, subject)
            options = [f"It is {meaning.rstrip('.')}", distractors[0], distractors[1], distractors[2]]
            # Make sure options are unique
            options = list(dict.fromkeys(options))
            while len(options) < 4:
                options.append(f"An alternative characteristic of {clean_term} not defined here.")

            correct_idx = 0
            q_text = f"According to {chapter}, what is the mathematical definition of '{clean_term}'?"

            q_id = QuestionDraft.generate_stable_id(doc_title, chapter, p_start, q_text)
            drafts.append(QuestionDraft(
                id=q_id,
                question_text=q_text,
                options=options,
                correct_index=correct_idx,
                explanation=f"Based on the text on page {p_start}: {full_stmt}",
                subject=subject,
                topic=section,
                difficulty="easy",
                question_type="definition",
                source_document=doc_title,
                source_chapter=chapter,
                source_page_start=p_start,
                source_page_end=p_end,
                raw_source_snippet=full_stmt
            ))

        # 2. Extract math examples or calculation patterns if present
        if "relation" in text.lower() or "function" in text.lower():
            # Domain and Range conceptual question
            if "domain" in text.lower() and "range" in text.lower():
                q_text = "In the study of relations and functions, what is the 'domain' of a relation?"
                options = [
                    "The set of all first coordinates (inputs) from the ordered pairs",
                    "The set of all second coordinates (outputs) from the ordered pairs",
                    "The graph plotted only on the positive y-axis",
                    "The rule that maps multiple outputs to a single input"
                ]
                q_id = QuestionDraft.generate_stable_id(doc_title, chapter, p_start, q_text)
                drafts.append(QuestionDraft(
                    id=q_id,
                    question_text=q_text,
                    options=options,
                    correct_index=0,
                    explanation=f"As discussed in {chapter} (page {p_start}), the domain of a relation consists of the set of all first coordinates of the ordered pairs.",
                    subject=subject,
                    topic=section,
                    difficulty="medium",
                    question_type="conceptual",
                    source_document=doc_title,
                    source_chapter=chapter,
                    source_page_start=p_start,
                    source_page_end=p_end,
                    raw_source_snippet="Domain and range of a relation"
                ))

            # Function vs Relation classification
            if "function" in text.lower() and ("ordered pair" in text.lower() or "element" in text.lower()):
                q_text = "Which of the following conditions must be satisfied for a relation to be classified as a function?"
                options = [
                    "Every element in the domain is paired with exactly one element in the range",
                    "Every element in the range must be equal to zero",
                    "The relation must only contain negative integers",
                    "No two distinct inputs can produce the same output value"
                ]
                q_id = QuestionDraft.generate_stable_id(doc_title, chapter, p_start, q_text)
                drafts.append(QuestionDraft(
                    id=q_id,
                    question_text=q_text,
                    options=options,
                    correct_index=0,
                    explanation=f"Textbook definition (page {p_start}): A function is a relation where each input in the domain maps to exactly one output in the range.",
                    subject=subject,
                    topic=section,
                    difficulty="medium",
                    question_type="conceptual",
                    source_document=doc_title,
                    source_chapter=chapter,
                    source_page_start=p_start,
                    source_page_end=p_end,
                    raw_source_snippet="A relation is a function if each element in the domain is paired with exactly one element in the range."
                ))

        # 3. Calculation & Ordered Pairs Question
        pairs_match = re.search(r'\{\s*\((-?\d+)\s*,\s*(-?\d+)\)\s*,\s*\((-?\d+)\s*,\s*(-?\d+)\)\s*\}', text)
        if pairs_match:
            x1, y1, x2, y2 = pairs_match.groups()
            q_text = f"Given the relation R = {{({x1}, {y1}), ({x2}, {y2})}}, what is the domain of R?"
            correct_ans = f"{{{x1}, {x2}}}"
            wrong1 = f"{{{y1}, {y2}}}"
            wrong2 = f"{{{int(x1)+1}, {int(x2)+1}}}"
            wrong3 = f"{{{x1}, {y2}}}"
            options = [correct_ans, wrong1, wrong2, wrong3]
            q_id = QuestionDraft.generate_stable_id(doc_title, chapter, p_start, q_text)
            drafts.append(QuestionDraft(
                id=q_id,
                question_text=q_text,
                options=options,
                correct_index=0,
                explanation=f"The domain consists of all first coordinates: {correct_ans}. Source: page {p_start}.",
                subject=subject,
                topic=section,
                difficulty="easy",
                question_type="calculation",
                source_document=doc_title,
                source_chapter=chapter,
                source_page_start=p_start,
                source_page_end=p_end,
                raw_source_snippet=pairs_match.group(0)
            ))

        return drafts

    def _generate_definition_distractors(self, term: str, subject: str) -> List[str]:
        if subject.lower() == "mathematics":
            return [
                f"The geometric reflection of an arbitrary set across the origin.",
                f"A numerical sequence where consecutive terms differ by a constant ratio.",
                f"The subset of imaginary roots obtained by solving higher-degree polynomials."
            ]
        elif subject.lower() == "biology":
            return [
                "An organelle responsible for ATP production through oxidative phosphorylation.",
                "The process by which diploid gametes undergo somatic mitosis.",
                "A non-membrane-bound structure that synthesizes ribosomal subunits."
            ]
        return [
            "A secondary classification applied to non-standard phenomena.",
            "An observational property that remains constant across varying conditions.",
            "A theoretical framework used primarily in historical contexts."
        ]

"""Semantic chunking for educational textbooks preserving chapters, sections, and page references."""
from __future__ import annotations
import re
from typing import List, Dict, Any, Optional

class TextbookChunker:
    def __init__(self, target_chunk_size: int = 1200, max_chunk_size: int = 2500):
        self.target_chunk_size = target_chunk_size
        self.max_chunk_size = max_chunk_size

        # Unit / Chapter / Section header patterns
        self.unit_pattern = re.compile(r'^(?:UNIT|Unit|CHAPTER|Chapter)\s*(\d+)[:\.\s]*(.*)', re.IGNORECASE)
        self.section_pattern = re.compile(r'^(\d+\.\d+)\s+([A-Z][^\n]+)')
        self.definition_pattern = re.compile(r'\b(Definition\s+\d*(?:\.\d+)?|Definition:?)\b', re.IGNORECASE)
        self.example_pattern = re.compile(r'\b(Example\s+\d*(?:\.\d+)?|Worked Example:?)\b', re.IGNORECASE)

    def extract_document_meta(self, filename: str, first_pages_text: str) -> Dict[str, str]:
        """Infer subject, grade, title, author from filename or front matter."""
        title = filename
        subject = "General"
        grade = "Unknown"

        fn_lower = filename.lower()
        if "math" in fn_lower:
            subject = "Mathematics"
        elif "bio" in fn_lower:
            subject = "Biology"
        elif "physic" in fn_lower:
            subject = "Physics"
        elif "chem" in fn_lower:
            subject = "Chemistry"
        elif "geo" in fn_lower:
            subject = "Geography"
        elif "hist" in fn_lower:
            subject = "History"
        elif "eng" in fn_lower:
            subject = "English"
        elif "comp" in fn_lower or "ict" in fn_lower or "cs" in fn_lower:
            subject = "Computer Science"

        grade_match = re.search(r'grade[_-]?\s*(\d+)', fn_lower)
        if grade_match:
            grade = f"Grade {grade_match.group(1)}"

        # Search front matter for title
        lines = [line.strip() for line in first_pages_text.split('\n') if line.strip()]
        for line in lines[:20]:
            if any(s.lower() in line.lower() for s in ["mathematics", "biology", "physics", "chemistry", "geography", "history"]):
                title = line
                break

        return {
            "title": title,
            "subject": subject,
            "grade": grade,
            "author": "Ministry of Education / Educational Curriculum",
            "edition": "New Curriculum" if "new-curriculum" in fn_lower else "Standard"
        }

    def chunk_pages(
        self,
        pages_data: List[Dict[str, Any]],
        doc_meta: Optional[Dict[str, str]] = None
    ) -> List[Dict[str, Any]]:
        """Split page contents into semantically coherent topic chunks."""
        chunks: List[Dict[str, Any]] = []

        current_unit = "Introduction"
        current_section = "General"
        accumulated_text: List[str] = []
        page_start = None
        page_end = None
        chunk_index = 1
        has_formulas = False
        has_diagrams = False

        for page_info in pages_data:
            page_num = page_info["page_number"]
            text = page_info["text"]

            # Skip blank/scanned pages with negligible text
            if page_info["is_scanned"] and not text.strip():
                continue

            if page_info["has_math_formula"]:
                has_formulas = True
            if page_info["has_diagrams"]:
                has_diagrams = True

            if page_start is None:
                page_start = page_num
            page_end = page_num

            lines = text.split('\n')
            for line in lines:
                stripped = line.strip()
                if not stripped:
                    continue

                # Check for unit header
                unit_match = self.unit_pattern.match(stripped)
                if unit_match:
                    unit_num = unit_match.group(1)
                    unit_name = unit_match.group(2).strip() or f"Unit {unit_num}"
                    # If we have accumulated text, flush previous chunk
                    if accumulated_text:
                        full_chunk_text = "\n".join(accumulated_text).strip()
                        if len(full_chunk_text) >= 150:
                            chunks.append(self._create_chunk(
                                chunk_index=chunk_index,
                                doc_meta=doc_meta,
                                unit=current_unit,
                                section=current_section,
                                page_start=page_start,
                                page_end=page_end,
                                text=full_chunk_text,
                                has_formulas=has_formulas,
                                has_diagrams=has_diagrams
                            ))
                            chunk_index += 1
                        accumulated_text = []
                        page_start = page_num
                        has_formulas = False
                        has_diagrams = False
                    current_unit = f"Unit {unit_num}: {unit_name}"

                # Check for section header
                sec_match = self.section_pattern.match(stripped)
                if sec_match:
                    sec_code = sec_match.group(1)
                    sec_title = sec_match.group(2).strip()
                    # If accumulated text is substantial, flush
                    if sum(len(l) for l in accumulated_text) >= self.target_chunk_size:
                        full_chunk_text = "\n".join(accumulated_text).strip()
                        chunks.append(self._create_chunk(
                            chunk_index=chunk_index,
                            doc_meta=doc_meta,
                            unit=current_unit,
                            section=current_section,
                            page_start=page_start,
                            page_end=page_end,
                            text=full_chunk_text,
                            has_formulas=has_formulas,
                            has_diagrams=has_diagrams
                        ))
                        chunk_index += 1
                        accumulated_text = []
                        page_start = page_num
                        has_formulas = False
                        has_diagrams = False
                    current_section = f"{sec_code} {sec_title}"

                accumulated_text.append(stripped)

                # Check if chunk reached target size
                current_len = sum(len(l) for l in accumulated_text)
                if current_len >= self.max_chunk_size:
                    full_chunk_text = "\n".join(accumulated_text).strip()
                    chunks.append(self._create_chunk(
                        chunk_index=chunk_index,
                        doc_meta=doc_meta,
                        unit=current_unit,
                        section=current_section,
                        page_start=page_start,
                        page_end=page_end,
                        text=full_chunk_text,
                        has_formulas=has_formulas,
                        has_diagrams=has_diagrams
                    ))
                    chunk_index += 1
                    accumulated_text = []
                    page_start = page_num
                    has_formulas = False
                    has_diagrams = False

        # Flush final chunk
        if accumulated_text:
            full_chunk_text = "\n".join(accumulated_text).strip()
            if len(full_chunk_text) >= 100:
                chunks.append(self._create_chunk(
                    chunk_index=chunk_index,
                    doc_meta=doc_meta,
                    unit=current_unit,
                    section=current_section,
                    page_start=page_start or 1,
                    page_end=page_end or 1,
                    text=full_chunk_text,
                    has_formulas=has_formulas,
                    has_diagrams=has_diagrams
                ))

        return chunks

    def _create_chunk(
        self,
        chunk_index: int,
        doc_meta: Optional[Dict[str, str]],
        unit: str,
        section: str,
        page_start: int,
        page_end: int,
        text: str,
        has_formulas: bool,
        has_diagrams: bool
    ) -> Dict[str, Any]:
        meta = doc_meta or {}
        
        # Analyze concepts inside text
        definitions = re.findall(r'Definition[:\s]+([^\n\.]+\.)', text, re.IGNORECASE)
        examples = re.findall(r'Example[:\s\d]*([^\n\.]+\.)', text, re.IGNORECASE)

        return {
            "chunk_id": f"chunk-{chunk_index:04d}",
            "document_title": meta.get("title", "Textbook"),
            "subject": meta.get("subject", "General"),
            "grade": meta.get("grade", "Unknown"),
            "author": meta.get("author", "Curriculum"),
            "edition": meta.get("edition", "Standard"),
            "chapter_title": unit,
            "section_title": section,
            "page_start": page_start,
            "page_end": page_end,
            "has_formulas": has_formulas,
            "has_diagrams": has_diagrams,
            "text": text,
            "char_count": len(text),
            "key_definitions": definitions[:3],
            "key_examples": examples[:3]
        }

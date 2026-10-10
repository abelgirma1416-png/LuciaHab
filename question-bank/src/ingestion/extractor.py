"""PDF text extraction, scanned page detection, and math/formula flagging."""
from __future__ import annotations
import os
import re
from typing import Dict, List, Any, Optional
import pdfplumber

class PDFExtractor:
    def __init__(self, min_char_threshold: int = 50):
        self.min_char_threshold = min_char_threshold
        # Regex patterns for math formulas and scientific symbols
        self.math_patterns = [
            r'[\u2200-\u22FF]',      # Mathematical Operators (∀, ∃, ∈, ∉, ∑, ∏, √, ∝, ∞, ∠, ∧, ∨, ∩, ∪, ∫, ≈, ≠, ≡, ≤, ≥)
            r'[\u0370-\u03FF]',      # Greek letters (α, β, γ, θ, π, λ, etc.)
            r'\b[fgh]\s*\([a-z]\)',  # f(x), g(x), h(x)
            r'[a-zA-Z]\s*=\s*[-+]?\d+', # Simple equations e.g. x = 5
            r'[\^²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾]',     # Superscripts
            r'[\₀\₁\₂\₃\₄\₅\₆\₇\₈\₉]', # Subscripts
            r'[-+*/=<>]\s*\d+\s*[-+*/=<>]', # Math operations
            r'\b(?:sin|cos|tan|log|ln|lim)\b', # Math functions
        ]
        self.combined_math_regex = re.compile('|'.join(self.math_patterns))

    def analyze_page(self, page, page_num: int) -> Dict[str, Any]:
        """Extract text and metadata from a single PDF page."""
        try:
            text = page.extract_text(layout=False) or ""
        except Exception as e:
            return {
                "page_number": page_num,
                "text": "",
                "char_count": 0,
                "is_scanned": True,
                "has_ocr_needed": True,
                "has_math_formula": False,
                "has_diagrams": False,
                "image_count": 0,
                "error": str(e)
            }

        # Check for images / diagrams
        images = getattr(page, 'images', [])
        image_count = len(images) if images else 0
        has_diagrams = image_count > 0

        # Scan detection
        char_count = len(text.strip())
        is_scanned = False
        has_ocr_needed = False

        if char_count < self.min_char_threshold:
            is_scanned = True
            if image_count > 0:
                has_ocr_needed = True

        # Math formula and equation detection
        has_math_formula = bool(self.combined_math_regex.search(text))

        # Check for potential math extraction corruption (e.g. broken expressions or orphaned superscripts)
        math_warnings = []
        if has_math_formula:
            # Check unbalanced parentheses in formula lines
            for line in text.split('\n'):
                if any(k in line for k in ['=', '+', '-', '*', '/', '^', '√']):
                    if line.count('(') != line.count(')'):
                        math_warnings.append(f"Unbalanced parentheses in line: {line.strip()[:60]}")
                    if line.count('[') != line.count(']'):
                        math_warnings.append(f"Unbalanced brackets in line: {line.strip()[:60]}")

        return {
            "page_number": page_num,
            "text": text,
            "char_count": char_count,
            "is_scanned": is_scanned,
            "has_ocr_needed": has_ocr_needed,
            "has_math_formula": has_math_formula,
            "has_diagrams": has_diagrams,
            "image_count": image_count,
            "math_warnings": math_warnings[:5],
            "error": None
        }

    def extract_document(
        self,
        pdf_path: str,
        start_page: int = 1,
        end_page: Optional[int] = None,
        progress_callback = None
    ) -> Dict[str, Any]:
        """Extract text and metadata from a PDF file across specified page range."""
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        filename = os.path.basename(pdf_path)
        pages_data: List[Dict[str, Any]] = []
        scanned_count = 0
        math_count = 0
        diagram_count = 0
        errors: List[Dict[str, Any]] = []

        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            effective_end = min(end_page or total_pages, total_pages)

            for p_idx in range(start_page - 1, effective_end):
                page_num = p_idx + 1
                page = pdf.pages[p_idx]
                page_result = self.analyze_page(page, page_num)
                pages_data.append(page_result)

                if page_result["is_scanned"]:
                    scanned_count += 1
                if page_result["has_math_formula"]:
                    math_count += 1
                if page_result["has_diagrams"]:
                    diagram_count += 1
                if page_result["error"]:
                    errors.append({"page": page_num, "error": page_result["error"]})

                if progress_callback:
                    progress_callback(page_num, effective_end)

        return {
            "source_file": filename,
            "source_path": pdf_path,
            "total_pages": total_pages,
            "extracted_page_range": [start_page, effective_end],
            "scanned_pages_count": scanned_count,
            "math_pages_count": math_count,
            "diagram_pages_count": diagram_count,
            "errors": errors,
            "pages": pages_data
        }

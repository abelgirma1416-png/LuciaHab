import pdfplumber
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r'question-bank\pdfs\math_questions.pdf'

with pdfplumber.open(pdf_path) as pdf:
    p = pdf.pages[3]  # Page 4
    for y_tol in [2, 3, 4, 5, 6]:
        print(f"--- y_tolerance={y_tol} ---")
        lines = p.extract_text(y_tolerance=y_tol).split('\n')
        for line in lines[:8]:
            print(line)

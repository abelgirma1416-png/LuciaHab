import pdfplumber
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r'question-bank\pdfs\math_questions.pdf'

with pdfplumber.open(pdf_path) as pdf:
    p = pdf.pages[3]  # Page 4
    # Find chars around "14" and "252"
    q_chars = [c for c in p.chars if 60 <= c['top'] <= 75 and 200 <= c['x0'] <= 250]
    for c in sorted(q_chars, key=lambda x: x['x0']):
        print(f"Char: {repr(c['text']):<6} font={c['fontname']:<15} size={c['size']:.2f} top={c['top']:.2f} y0={c['y0']:.2f} y1={c['y1']:.2f} x0={c['x0']:.2f}")

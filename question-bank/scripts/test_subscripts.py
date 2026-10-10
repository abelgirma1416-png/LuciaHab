import pdfplumber
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r'question-bank\pdfs\math_questions.pdf'

with pdfplumber.open(pdf_path) as pdf:
    p = pdf.pages[49]  # Page 50
    # Q0371
    q_chars = [c for c in p.chars if 'Z' in c['text'] or (50 <= c['top'] <= 85 and 270 <= c['x0'] <= 340)]
    for c in sorted(q_chars, key=lambda x: (round(x['top']/10), x['x0'])):
        print(f"Char: {repr(c['text']):<6} size={c['size']:.2f} top={c['top']:.2f} y0={c['y0']:.2f} x0={c['x0']:.2f}")

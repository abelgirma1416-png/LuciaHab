import pdfplumber
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r'question-bank\pdfs\math_questions.pdf'

with pdfplumber.open(pdf_path) as pdf:
    p = pdf.pages[19]  # Page 20
    q_chars = [c for c in p.chars if 50 <= c['top'] <= 85]
    print("Page 20 Q141 chars:")
    for c in sorted(q_chars, key=lambda x: (round(x['top']/15), x['x0'])):
        if c['top'] > 60: # question line
            print(f"'{c['text']}' top={c['top']:.2f} size={c['size']:.2f} x0={c['x0']:.2f}")

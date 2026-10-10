import pdfplumber
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r'question-bank\pdfs\math_questions.pdf'

with pdfplumber.open(pdf_path) as pdf:
    p = pdf.pages[3]  # Page 4 (0-indexed: 3)
    words = p.extract_words()
    top_words = [w for w in words if w['top'] < 130]
    print("Words in top region of Page 4:")
    for w in sorted(top_words, key=lambda x: (x['top'], x['x0'])):
        print(f"{w['text']:<20} top={w['top']:.2f} bottom={w['bottom']:.2f} x0={w['x0']:.2f} x1={w['x1']:.2f}")

    print("\nDefault extract_text:")
    print(p.extract_text()[:400])

    print("\nlayout=True extract_text:")
    print(p.extract_text(layout=True)[:400])

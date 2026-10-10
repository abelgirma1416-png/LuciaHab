import pdfplumber
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r'question-bank\pdfs\math_questions.pdf'

with pdfplumber.open(pdf_path) as pdf:
    # Pages 136 and 137 (0-indexed: 135 and 136)
    text_p2 = pdf.pages[135].extract_text() + "\n" + pdf.pages[136].extract_text()
    
    # Extract all "<number> <A|B|C|D>"
    # Pattern: number followed by space and A/B/C/D
    matches = re.findall(r'(\b\d{1,4})\s+([ABCD])\b', text_p2)
    print(f"Total answer key matches found: {len(matches)}")
    if matches:
        print(f"First match: {matches[0]}")
        print(f"Last match: {matches[-1]}")
        nums = [int(m[0]) for m in matches]
        print(f"Min num: {min(nums)}, Max num: {max(nums)}")
        # Check if all 1 to 1000 are present
        missing = set(range(1, 1001)) - set(nums)
        print(f"Missing question numbers in answer key: {missing}")

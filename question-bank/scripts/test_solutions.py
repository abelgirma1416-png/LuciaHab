import pdfplumber
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r'question-bank\pdfs\math_questions.pdf'

solutions = {}

with pdfplumber.open(pdf_path) as pdf:
    # Pages 138 to 188 (0-indexed: 137 to 187)
    full_sol_text = ""
    for p_idx in range(137, 188):
        full_sol_text += pdf.pages[p_idx].extract_text() + "\n"

# Pattern: e.g. "1. Answer A Arithmetic · Easy\nMultiplication precedes addition: ..."
# Each solution starts with `(\d+)\.\s+Answer\s+([ABCD])\s+(.*?)\s*·\s*(\w+)`
# Let's split or finditer
pattern = re.compile(r'(?:^|\n)(\d+)\.\s+Answer\s+([ABCD])\s+([^\n·]+)·\s*([^\n]+)\n')
matches = list(pattern.finditer(full_sol_text))
print(f"Total solution headers matched: {len(matches)}")

for i in range(len(matches)):
    m = matches[i]
    q_num = int(m.group(1))
    ans_letter = m.group(2)
    topic = m.group(3).strip()
    difficulty = m.group(4).strip()
    
    start_pos = m.end()
    end_pos = matches[i+1].start() if i + 1 < len(matches) else len(full_sol_text)
    body = full_sol_text[start_pos:end_pos].strip()
    # Filter out footer lines like "GameVerse · Mathematics Question Bank · 1,000 original questions Page \d+"
    body_lines = [l for l in body.split('\n') if not l.startswith('GameVerse · Mathematics Question Bank')]
    explanation = "\n".join(body_lines).strip()
    
    solutions[q_num] = {
        'answer': ans_letter,
        'topic': topic,
        'difficulty': difficulty,
        'explanation': explanation
    }

print(f"Total parsed solutions: {len(solutions)}")
missing_sols = set(range(1, 1001)) - set(solutions.keys())
print(f"Missing solutions: {missing_sols}")
if 1 in solutions:
    print(f"Sample solution 1: {solutions[1]}")
if 1000 in solutions:
    print(f"Sample solution 1000: {solutions[1000]}")

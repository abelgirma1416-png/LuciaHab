import pdfplumber
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r'question-bank\pdfs\math_questions.pdf'

# Let's inspect pages where areas and topics appear
# We know from Page 1:
# A. Foundations
# B. Calculus and Analysis
# C. Algebra
# D. Geometry and Topology
# E. Discrete Mathematics and Logic
# F. Probability and Statistics
# G. Applied Mathematics

with pdfplumber.open(pdf_path) as pdf:
    for p_num in [2, 10, 25, 45, 65, 85, 105, 125]:
        text = pdf.pages[p_num - 1].extract_text()
        first_few_lines = text.split('\n')[:6]
        print(f"Page {p_num}: {first_few_lines}")

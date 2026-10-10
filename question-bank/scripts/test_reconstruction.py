import pdfplumber
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Superscript mapping
SUPERSCRIPTS = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ'
}

# Subscript mapping
SUBSCRIPTS = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
    'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ', 'i': 'ᵢ',
    'j': 'ⱼ', 'k': 'ₖ', 'm': 'ₘ', 'n': 'ₙ', 'p': 'ₚ'
}

def extract_text_preserving_math(page):
    """Reconstruct lines of text while detecting superscripts and subscripts by font size and y-offset."""
    chars = page.chars
    if not chars:
        return ""

    # Group characters into visual lines using a baseline clustering
    # Sort characters by top, then x0
    # First, let's cluster characters whose vertical span overlaps significantly
    chars_sorted = sorted(chars, key=lambda c: (c['top'], c['x0']))
    
    # We can group characters into line bands. A line band has a median baseline (y0) or top.
    lines = []
    current_line = []
    
    for c in chars:
        if not current_line:
            current_line.append(c)
            continue
        
        # Check if character belongs to current line
        # Base font size of line
        base_sizes = [x['size'] for x in current_line if x['text'].strip()]
        base_size = max(base_sizes) if base_sizes else 9.4
        
        # Vertical distance from median top/bottom
        curr_tops = [x['top'] for x in current_line if x['size'] >= base_size * 0.85]
        ref_top = sum(curr_tops) / len(curr_tops) if curr_tops else current_line[0]['top']
        
        # If c's top is within ~8 points of ref_top, consider it same line band
        if abs(c['top'] - ref_top) < 7.5:
            current_line.append(c)
        else:
            lines.append(current_line)
            current_line = [c]
            
    if current_line:
        lines.append(current_line)
        
    # Now within each line band:
    reconstructed_lines = []
    for line in lines:
        # Sort left to right
        line_chars = sorted(line, key=lambda c: c['x0'])
        
        # Determine dominant font size and baseline top
        normal_chars = [c for c in line_chars if c['text'].strip() and c['size'] > 8.5]
        if not normal_chars:
            normal_size = 9.4
            normal_top = line_chars[0]['top']
        else:
            normal_size = sum(c['size'] for c in normal_chars) / len(normal_chars)
            normal_top = sum(c['top'] for c in normal_chars) / len(normal_chars)
            
        line_text = ""
        prev_x1 = None
        
        for c in line_chars:
            t = c['text']
            # Check for space if x0 - prev_x1 is large enough and c['text'] is not a space
            if prev_x1 is not None and c['x0'] - prev_x1 > 2.5 and t != ' ' and not line_text.endswith(' '):
                line_text += ' '
                
            # Is it superscript or subscript?
            is_smaller = c['size'] < normal_size * 0.88
            if is_smaller:
                if c['top'] < normal_top - 1.0: # superscript
                    t = "".join(SUPERSCRIPTS.get(ch, ch) for ch in t)
                elif c['top'] > normal_top + 3.0: # subscript
                    t = "".join(SUBSCRIPTS.get(ch, ch) for ch in t)
            
            line_text += t
            prev_x1 = c['x1']
            
        reconstructed_lines.append(line_text)
        
    return "\n".join(reconstructed_lines)

pdf_path = r'question-bank\pdfs\math_questions.pdf'
with pdfplumber.open(pdf_path) as pdf:
    for p_num in [4, 20, 50]:
        print(f"=== PAGE {p_num} ===")
        txt = extract_text_preserving_math(pdf.pages[p_num - 1])
        for l in txt.split('\n')[:12]:
            if l.strip():
                print(l)

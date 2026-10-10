import pdfplumber
import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

SUPERSCRIPTS = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ'
}

SUBSCRIPTS = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
    'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ', 'i': 'ᵢ',
    'j': 'ⱼ', 'k': 'ₖ', 'm': 'ₘ', 'n': 'ₙ', 'p': 'ₚ'
}

def extract_text_preserving_math(page):
    chars = page.chars
    if not chars:
        return ""

    lines = []
    current_line = []
    
    for c in chars:
        if not current_line:
            current_line.append(c)
            continue
        
        base_sizes = [x['size'] for x in current_line if x['text'].strip()]
        base_size = max(base_sizes) if base_sizes else 9.4
        curr_tops = [x['top'] for x in current_line if x['size'] >= base_size * 0.85]
        ref_top = sum(curr_tops) / len(curr_tops) if curr_tops else current_line[0]['top']
        
        if abs(c['top'] - ref_top) < 7.5:
            current_line.append(c)
        else:
            lines.append(current_line)
            current_line = [c]
            
    if current_line:
        lines.append(current_line)
        
    reconstructed_lines = []
    for line in lines:
        line_chars = sorted(line, key=lambda c: c['x0'])
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
            if prev_x1 is not None and c['x0'] - prev_x1 > 2.5 and t != ' ' and not line_text.endswith(' '):
                line_text += ' '
                
            is_smaller = c['size'] < normal_size * 0.88
            if is_smaller:
                if c['top'] < normal_top - 1.0:
                    t = "".join(SUPERSCRIPTS.get(ch, ch) for ch in t)
                elif c['top'] > normal_top + 3.0:
                    t = "".join(SUBSCRIPTS.get(ch, ch) for ch in t)
            
            line_text += t
            prev_x1 = c['x1']
            
        reconstructed_lines.append(line_text)
        
    return "\n".join(reconstructed_lines)

def run_test():
    pdf_path = r'question-bank\pdfs\math_questions.pdf'
    
    with pdfplumber.open(pdf_path) as pdf:
        # 1. Parse Answer Key (Part II: pages 136-137)
        print("Parsing Part II (Answer Key)...")
        text_ak = pdf.pages[135].extract_text() + "\n" + pdf.pages[136].extract_text()
        ak_matches = re.findall(r'(\b\d{1,4})\s+([ABCD])\b', text_ak)
        answer_key = {int(num): letter for num, letter in ak_matches}
        print(f"Answer key entries: {len(answer_key)}")

        # 2. Parse Solutions (Part III: pages 138-188)
        print("Parsing Part III (Worked Solutions)...")
        full_sol_text = ""
        for p_idx in range(137, 188):
            full_sol_text += pdf.pages[p_idx].extract_text() + "\n"

        sol_pattern = re.compile(r'(?:^|\n)(\d+)\.\s+Answer\s+([ABCD])\s+([^\n·]+)·\s*([^\n]+)\n')
        sol_matches = list(sol_pattern.finditer(full_sol_text))
        solutions = {}
        for i in range(len(sol_matches)):
            m = sol_matches[i]
            q_num = int(m.group(1))
            ans_letter = m.group(2)
            topic = m.group(3).strip()
            difficulty = m.group(4).strip()
            
            start_pos = m.end()
            end_pos = sol_matches[i+1].start() if i + 1 < len(sol_matches) else len(full_sol_text)
            body = full_sol_text[start_pos:end_pos].strip()
            body_lines = [l for l in body.split('\n') if not l.startswith('GameVerse · Mathematics Question Bank')]
            explanation = "\n".join(body_lines).strip()
            
            solutions[q_num] = {
                'answer': ans_letter,
                'topic': topic,
                'difficulty': difficulty,
                'explanation': explanation
            }
        print(f"Solutions entries: {len(solutions)}")

        # 3. Parse Questions (Part I: pages 2 to 135)
        print("Parsing Part I (Questions)...")
        current_area = "Foundations"
        current_subtopic = "Arithmetic"
        questions = {}
        
        # Regex to detect Area headers e.g. "A. Foundations"
        area_pattern = re.compile(r'^[A-G]\.\s+(.*)$')
        # Regex for Q header e.g. "Q0001 · Easy · ≈43 s · Middle/High School"
        q_header_pattern = re.compile(r'^Q(\d{4})\s*·\s*([^\n·]+)·\s*(?:≈(\d+)\s*s)?\s*·?\s*(.*)$')
        
        for page_idx in range(1, 135):
            page_num = page_idx + 1
            page = pdf.pages[page_idx]
            page_text = extract_text_preserving_math(page)
            
            lines = [l.strip() for l in page_text.split('\n') if l.strip()]
            
            idx = 0
            while idx < len(lines):
                line = lines[idx]
                
                # Check for footer or title
                if 'GameVerse · Mathematics Question Bank' in line or line.startswith('Part I – Questions'):
                    idx += 1
                    continue
                
                # Check for Area
                area_m = area_pattern.match(line)
                if area_m and len(line) < 40 and not line.startswith('A. '): # avoid option A
                    current_area = area_m.group(1).strip()
                    idx += 1
                    continue
                
                # Check for Q header
                q_m = q_header_pattern.match(line)
                if q_m:
                    q_num = int(q_m.group(1))
                    difficulty_hdr = q_m.group(2).strip().lower()
                    est_seconds = int(q_m.group(3)) if q_m.group(3) else None
                    level = q_m.group(4).strip() if q_m.group(4) else ""
                    
                    idx += 1
                    # Next line should be question number e.g. "1. ..."
                    q_text_parts = []
                    # Read until we hit option A
                    while idx < len(lines) and not (lines[idx].startswith('A. ') or lines[idx] == 'A.'):
                        q_text_parts.append(lines[idx])
                        idx += 1
                        
                    raw_q_text = " ".join(q_text_parts)
                    # Strip leading question number e.g. "1. " or "1000. "
                    cleaned_q_text = re.sub(r'^\d+\.\s*', '', raw_q_text).strip()
                    
                    # Now extract options A, B, C, D
                    options = {}
                    curr_opt_letter = None
                    curr_opt_text = []
                    
                    while idx < len(lines):
                        opt_line = lines[idx]
                        if q_header_pattern.match(opt_line) or 'GameVerse · Mathematics Question Bank' in opt_line:
                            break
                        
                        m_opt = re.match(r'^([ABCD])\.\s*(.*)$', opt_line)
                        if m_opt:
                            if curr_opt_letter:
                                options[curr_opt_letter] = " ".join(curr_opt_text).strip()
                            curr_opt_letter = m_opt.group(1)
                            curr_opt_text = [m_opt.group(2)]
                        elif curr_opt_letter:
                            curr_opt_text.append(opt_line)
                        else:
                            # Unexpected line before options
                            pass
                        idx += 1
                        if len(options) == 3 and curr_opt_letter == 'D' and (idx >= len(lines) or q_header_pattern.match(lines[idx])):
                            break
                            
                    if curr_opt_letter:
                        options[curr_opt_letter] = " ".join(curr_opt_text).strip()
                        
                    questions[q_num] = {
                        'q_num': q_num,
                        'question_text': cleaned_q_text,
                        'options': options,
                        'difficulty': difficulty_hdr,
                        'est_seconds': est_seconds,
                        'level': level,
                        'source_page': page_num,
                        'area': current_area
                    }
                else:
                    idx += 1

        print(f"Total questions parsed from Part I: {len(questions)}")
        missing_q = set(range(1, 1001)) - set(questions.keys())
        print(f"Missing questions in Part I: {missing_q}")
        
        # Check option counts
        invalid_opts = [q_num for q_num, q in questions.items() if len(q['options']) != 4]
        print(f"Questions without exactly 4 options: {len(invalid_opts)}")
        if invalid_opts:
            print(f"Examples of invalid option counts: {invalid_opts[:10]}")
            for bad_q in invalid_opts[:3]:
                print(f"Q{bad_q}: {questions[bad_q]}")

run_test()

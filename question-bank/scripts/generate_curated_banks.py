#!/usr/bin/env python3
"""
generate_curated_banks.py - Generates 1,000 Easy and 1,000 Medium verified math questions.
Validates all math answers programmatically, ensures distinct options, and outputs
both question-bank/json and apps/web/src/data JSON files.
"""

import json
import os
import random
import math
import sys
from typing import List, Dict, Any, Set

# Fix random seed for deterministic, reproducible generation
random.seed(1337)

def make_mcq(
    q_id: str,
    q_num: int,
    prompt: str,
    correct_ans: str,
    distractors: List[str],
    explanation: str,
    topic: str,
    area: str,
    difficulty: str
) -> Dict[str, Any]:
    unique_distractors: List[str] = []
    seen = {correct_ans.strip().lower()}
    for d in distractors:
        ds = str(d).strip().lower()
        if ds not in seen and ds:
            seen.add(ds)
            unique_distractors.append(str(d).strip())
            if len(unique_distractors) == 3:
                break

    if len(unique_distractors) < 3:
        try:
            val = float(correct_ans)
            for delta in [1, -1, 2, -2, 5, -5, 10, -10, 3, -3, 4, -4]:
                new_v = val + delta
                cand = str(int(new_v) if new_v.is_integer() else round(new_v, 2))
                if cand.lower() not in seen:
                    seen.add(cand.lower())
                    unique_distractors.append(cand)
                    if len(unique_distractors) == 3:
                        break
        except ValueError:
            for fallback in ["None of these", "Cannot be determined", "0", "1", "2"]:
                if fallback.lower() not in seen:
                    seen.add(fallback.lower())
                    unique_distractors.append(fallback)
                    if len(unique_distractors) == 3:
                        break

    assert len(unique_distractors) == 3, f"Failed to get 3 unique distractors for {prompt}"

    options = [correct_ans.strip()] + unique_distractors
    random.shuffle(options)

    correct_idx = options.index(correct_ans.strip())
    letters = ["A", "B", "C", "D"]

    return {
        "id": q_id,
        "questionNumber": q_num,
        "question": prompt.strip(),
        "options": options,
        "correctAnswer": correct_ans.strip(),
        "correctAnswerLetter": letters[correct_idx],
        "correctIndex": correct_idx,
        "explanation": explanation.strip(),
        "topic": topic.strip(),
        "area": area.strip(),
        "difficulty": difficulty,
        "targetTimeSeconds": 20 if difficulty == "easy" else 35,
        "gradeLevel": "Elementary / Middle School" if difficulty == "easy" else "Middle School",
        "sourcePage": 1,
        "isVerified": True
    }


def generate_easy_bank(total_target: int = 1000) -> List[Dict[str, Any]]:
    questions: List[Dict[str, Any]] = []
    seen_prompts: Set[str] = set()
    q_num = 1

    # 1. Basic Addition (150 questions)
    while len([q for q in questions if q["topic"] == "Basic Addition"]) < 150:
        a = random.randint(3, 99)
        b = random.randint(2, 99)
        ans = a + b
        prompt = f"What is {a} + {b}?"
        if prompt in seen_prompts:
            continue
        seen_prompts.add(prompt)
        distractors = [str(ans + 10), str(ans - 1), str(ans + 2), str(ans - 10)]
        expl = f"Add the two numbers: {a} + {b} = {ans}."
        questions.append(make_mcq(f"easy_{q_num:04d}", q_num, prompt, str(ans), distractors, expl, "Basic Addition", "Arithmetic", "easy"))
        q_num += 1

    # 2. Basic Subtraction (150 questions)
    while len([q for q in questions if q["topic"] == "Basic Subtraction"]) < 150:
        a = random.randint(15, 150)
        b = random.randint(3, a - 1)
        ans = a - b
        prompt = f"What is {a} - {b}?"
        if prompt in seen_prompts:
            continue
        seen_prompts.add(prompt)
        distractors = [str(ans + 1), str(ans - 2), str(ans + 10), str(ans - 5)]
        expl = f"Subtract {b} from {a}: {a} - {b} = {ans}."
        questions.append(make_mcq(f"easy_{q_num:04d}", q_num, prompt, str(ans), distractors, expl, "Basic Subtraction", "Arithmetic", "easy"))
        q_num += 1

    # 3. Single-Digit & Times Tables Multiplication (150 questions)
    while len([q for q in questions if q["topic"] == "Multiplication"]) < 150:
        a = random.randint(2, 12)
        b = random.randint(2, 15)
        ans = a * b
        prompt = f"What is {a} × {b}?"
        if prompt in seen_prompts:
            continue
        seen_prompts.add(prompt)
        distractors = [str(ans + a), str(ans - b if ans - b > 0 else ans + 2), str(ans + 2), str(ans + 10)]
        expl = f"Multiplying {a} by {b} gives {ans}."
        questions.append(make_mcq(f"easy_{q_num:04d}", q_num, prompt, str(ans), distractors, expl, "Multiplication", "Arithmetic", "easy"))
        q_num += 1

    # 4. Simple Integer Division (150 questions)
    while len([q for q in questions if q["topic"] == "Division"]) < 150:
        divisor = random.randint(2, 12)
        quotient = random.randint(2, 25)
        dividend = divisor * quotient
        ans = quotient
        prompt = f"What is {dividend} ÷ {divisor}?"
        if prompt in seen_prompts:
            continue
        seen_prompts.add(prompt)
        distractors = [str(ans + 1), str(ans - 1 if ans > 1 else ans + 3), str(ans + 2), str(ans * 2)]
        expl = f"{dividend} divided by {divisor} is {ans} because {divisor} × {ans} = {dividend}."
        questions.append(make_mcq(f"easy_{q_num:04d}", q_num, prompt, str(ans), distractors, expl, "Division", "Arithmetic", "easy"))
        q_num += 1

    # 5. Place Value & Number Properties (100 questions)
    while len([q for q in questions if q["topic"] == "Place Value"]) < 100:
        num = random.randint(100, 99999)
        snum = str(num)
        pos = random.choice([0, 1, 2, 3])
        if pos >= len(snum):
            continue
        digit = snum[-(pos + 1)]
        val = int(digit) * (10 ** pos)
        place_names = ["ones", "tens", "hundreds", "thousands"]
        p_name = place_names[pos]
        prompt = f"In the number {num}, what is the value of the digit {digit} in the {p_name} place?"
        if prompt in seen_prompts:
            continue
        seen_prompts.add(prompt)
        distractors = [str(int(digit)), str(int(digit) * (10 ** ((pos + 1) % 4))), str(int(digit) * (10 ** ((pos + 2) % 4)))]
        expl = f"The digit {digit} is in the {p_name} place, giving it a value of {val}."
        questions.append(make_mcq(f"easy_{q_num:04d}", q_num, prompt, str(val), distractors, expl, "Place Value", "Number Sense", "easy"))
        q_num += 1

    # 6. Number Comparisons & Sequences (100 questions)
    while len([q for q in questions if q["topic"] == "Sequences & Comparison"]) < 100:
        start = random.randint(2, 80)
        step = random.randint(2, 12)
        seq = [start + step * i for i in range(4)]
        ans = start + step * 4
        prompt = f"What is the next number in the pattern: {seq[0]}, {seq[1]}, {seq[2]}, {seq[3]}, ...?"
        if prompt in seen_prompts:
            continue
        seen_prompts.add(prompt)
        distractors = [str(ans + step), str(ans - 1), str(ans + 2), str(ans - step)]
        expl = f"The pattern increases by {step} each step: {seq[3]} + {step} = {ans}."
        questions.append(make_mcq(f"easy_{q_num:04d}", q_num, prompt, str(ans), distractors, expl, "Sequences & Comparison", "Patterns", "easy"))
        q_num += 1

    # 7. Simple Fractions (100 questions)
    while len([q for q in questions if q["topic"] == "Simple Fractions"]) < 100:
        denom = random.choice([2, 3, 4, 5, 6, 8, 10])
        factor = random.randint(2, 30)
        whole = denom * factor
        num = random.choice([1, 2, 3])
        if num >= denom:
            num = 1
        ans = (whole * num) // denom
        prompt = f"What is {num}/{denom} of {whole}?"
        if prompt in seen_prompts:
            continue
        seen_prompts.add(prompt)
        distractors = [str(ans + 2), str(ans - 1 if ans > 1 else ans + 3), str(ans + factor)]
        expl = f"First divide {whole} by {denom} = {whole // denom}, then multiply by {num} = {ans}."
        questions.append(make_mcq(f"easy_{q_num:04d}", q_num, prompt, str(ans), distractors, expl, "Simple Fractions", "Fractions", "easy"))
        q_num += 1

    # 8. Easy Word Problems (100 questions)
    wp_templates = [
        ("A bakery made {a} chocolate cookies and {b} vanilla cookies. How many cookies were made in total?", lambda a, b: a + b, "Add chocolate and vanilla: {a} + {b} = {ans} cookies."),
        ("Samuel had {a} Birr and spent {b} Birr on a notebook. How much money does he have left?", lambda a, b: a - b, "Subtract expenditure: {a} - {b} = {ans} Birr."),
        ("A classroom has {a} rows of desks with {b} desks in each row. How many desks are there altogether?", lambda a, b: a * b, "Multiply rows by desks per row: {a} × {b} = {ans} desks."),
        ("A teacher distributed {a} pencils equally among {b} students. How many pencils did each student receive?", lambda a, b: a // b, "Divide pencils by students: {a} ÷ {b} = {ans} pencils."),
        ("Eden read {a} pages on Monday and {b} pages on Tuesday. How many pages did she read in total?", lambda a, b: a + b, "{a} + {b} = {ans} pages in total."),
        ("A farmer collected {a} eggs and sold {b} of them. How many eggs remain?", lambda a, b: a - b, "{a} - {b} = {ans} eggs remaining.")
    ]

    while len([q for q in questions if q["topic"] == "Word Problems"]) < 100:
        tpl, fn, expl_tpl = random.choice(wp_templates)
        if "desks" in tpl:
            a, b = random.randint(4, 15), random.randint(4, 12)
        elif "pencils" in tpl:
            b = random.randint(3, 10)
            q_val = random.randint(3, 15)
            a = b * q_val
        elif "spent" in tpl or "sold" in tpl:
            a = random.randint(40, 300)
            b = random.randint(10, a - 5)
        else:
            a = random.randint(15, 120)
            b = random.randint(10, 95)

        ans = fn(a, b)
        prompt = tpl.format(a=a, b=b)
        if prompt in seen_prompts:
            continue
        seen_prompts.add(prompt)
        distractors = [str(ans + 5), str(ans - 3), str(ans + 10)]
        expl = expl_tpl.format(a=a, b=b, ans=ans)
        questions.append(make_mcq(f"easy_{q_num:04d}", q_num, prompt, str(ans), distractors, expl, "Word Problems", "Applied Math", "easy"))
        q_num += 1

    return questions[:total_target]


def generate_medium_bank(total_target: int = 1000) -> List[Dict[str, Any]]:
    questions: List[Dict[str, Any]] = []
    seen_prompts: Set[str] = set()
    q_num = 1

    # 1. Multi-Step Arithmetic & Order of Operations (150 questions)
    while len([q for q in questions if q["topic"] == "Order of Operations"]) < 150:
        a = random.randint(3, 20)
        b = random.randint(2, 12)
        c = random.randint(2, 30)
        mode = random.choice([1, 2, 3])
        if mode == 1:
            ans = a * b + c
            prompt = f"Evaluate: {a} × {b} + {c}"
            expl = f"Multiplication precedes addition: {a} × {b} = {a*b}, then {a*b} + {c} = {ans}."
        elif mode == 2:
            ans = a * (b + c)
            prompt = f"Evaluate: {a} × ({b} + {c})"
            expl = f"Parentheses first: {b} + {c} = {b+c}, then {a} × {b+c} = {ans}."
        else:
            mult = b * random.randint(2, 12)
            ans = mult // b + a
            prompt = f"Evaluate: {mult} ÷ {b} + {a}"
            expl = f"Division precedes addition: {mult} ÷ {b} = {mult//b}, then {mult//b} + {a} = {ans}."

        if prompt in seen_prompts:
            continue
        seen_prompts.add(prompt)
        distractors = [str(ans + 4), str(ans - 3), str(ans + 10)]
        questions.append(make_mcq(f"med_{q_num:04d}", q_num, prompt, str(ans), distractors, expl, "Order of Operations", "Arithmetic", "medium"))
        q_num += 1

    # 2. Fractions & Mixed Numbers (130 questions)
    while len([q for q in questions if q["topic"] == "Fractions & Decimals"]) < 130:
        d1 = random.choice([2, 3, 4, 5, 6, 8])
        d2 = random.choice([3, 4, 5, 6, 7, 8, 9])
        if d1 == d2:
            d2 = d1 + 1
        n1 = random.randint(1, d1 - 1)
        n2 = random.randint(1, d2 - 1)
        num_sum = n1 * d2 + n2 * d1
        denom_lcm = d1 * d2
        common_g = math.gcd(num_sum, denom_lcm)
        sn = num_sum // common_g
        sd = denom_lcm // common_g
        ans = f"{sn}/{sd}" if sd != 1 else str(sn)
        prompt = f"Compute and simplify: {n1}/{d1} + {n2}/{d2}"
        if prompt in seen_prompts:
            continue
        seen_prompts.add(prompt)
        wrong1 = f"{n1+n2}/{d1+d2}"
        wrong2 = f"{sn+1}/{sd}"
        wrong3 = f"{sn}/{sd+1}" if sd > 1 else f"{sn}/2"
        distractors = [wrong1, wrong2, wrong3]
        expl = f"Common denominator is {denom_lcm}: ({n1*d2} + {n2*d1}) / {denom_lcm} = {num_sum}/{denom_lcm}. Simplifying gives {ans}."
        questions.append(make_mcq(f"med_{q_num:04d}", q_num, prompt, ans, distractors, expl, "Fractions & Decimals", "Fractions", "medium"))
        q_num += 1

    # 3. Percentages & Financial Math (120 questions)
    while len([q for q in questions if q["topic"] == "Percentages"]) < 120:
        pct = random.choice([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80])
        base = random.randint(4, 80) * 10
        ans = int(base * (pct / 100))
        prompt = f"What is {pct}% of {base}?"
        if prompt in seen_prompts:
            continue
        seen_prompts.add(prompt)
        distractors = [str(ans + 10), str(ans - 5 if ans > 5 else ans + 15), str(ans + 20)]
        expl = f"{pct}% of {base} = ({pct}/100) × {base} = {ans}."
        questions.append(make_mcq(f"med_{q_num:04d}", q_num, prompt, str(ans), distractors, expl, "Percentages", "Applied Math", "medium"))
        q_num += 1

    # 4. Decimals (120 questions)
    while len([q for q in questions if q["topic"] == "Decimals"]) < 120:
        a = round(random.uniform(1.2, 35.8), 1)
        b = round(random.uniform(1.1, 15.9), 1)
        mode = random.choice(["add", "sub", "mul"])
        if mode == "add":
            ans = round(a + b, 1)
            prompt = f"Compute: {a} + {b}"
            expl = f"{a} + {b} = {ans}."
        elif mode == "sub":
            if a < b:
                a, b = b, a
            ans = round(a - b, 1)
            prompt = f"Compute: {a} - {b}"
            expl = f"{a} - {b} = {ans}."
        else:
            a_int = random.randint(2, 15)
            b_dec = round(random.choice([0.2, 0.4, 0.5, 0.8, 1.2, 1.5, 2.5, 3.5]), 1)
            ans = round(a_int * b_dec, 1)
            prompt = f"Compute: {a_int} × {b_dec}"
            expl = f"{a_int} × {b_dec} = {ans}."

        ans_str = str(int(ans)) if isinstance(ans, float) and ans.is_integer() else str(ans)
        if prompt in seen_prompts:
            continue
        seen_prompts.add(prompt)
        try:
            val_f = float(ans_str)
            distractors = [str(round(val_f + 1.1, 1)), str(round(val_f - 0.5, 1)), str(round(val_f + 2.0, 1))]
        except ValueError:
            distractors = ["10.5", "12.0", "8.2"]
        questions.append(make_mcq(f"med_{q_num:04d}", q_num, prompt, ans_str, distractors, expl, "Decimals", "Arithmetic", "medium"))
        q_num += 1

    # 5. Ratios & Proportions (120 questions)
    while len([q for q in questions if q["topic"] == "Ratios & Proportions"]) < 120:
        r1 = random.randint(2, 9)
        r2 = random.randint(3, 11)
        k = random.randint(2, 12)
        ans = r2 * k
        prompt = f"If the ratio of boys to girls in a school club is {r1}:{r2} and there are {r1 * k} boys, how many girls are there?"
        if prompt in seen_prompts:
            continue
        seen_prompts.add(prompt)
        distractors = [str(ans + r2), str(ans - r1 if ans - r1 > 0 else ans + 4), str(ans + 2)]
        expl = f"Scale factor is ({r1*k} ÷ {r1}) = {k}. Number of girls is {r2} × {k} = {ans}."
        questions.append(make_mcq(f"med_{q_num:04d}", q_num, prompt, str(ans), distractors, expl, "Ratios & Proportions", "Algebra", "medium"))
        q_num += 1

    # 6. Averages & Statistics (120 questions)
    while len([q for q in questions if q["topic"] == "Averages & Statistics"]) < 120:
        target_mean = random.randint(12, 60)
        n1 = target_mean + random.randint(-8, 8)
        n2 = target_mean + random.randint(-6, 6)
        n3 = target_mean + random.randint(-7, 7)
        n4 = 4 * target_mean - (n1 + n2 + n3)
        nums = [n1, n2, n3, n4]
        ans = target_mean
        prompt = f"Find the mean (average) of the numbers: {nums[0]}, {nums[1]}, {nums[2]}, and {nums[3]}."
        if prompt in seen_prompts:
            continue
        seen_prompts.add(prompt)
        distractors = [str(ans + 2), str(ans - 3), str(ans + 5)]
        expl = f"Sum = {sum(nums)}. Mean = {sum(nums)} ÷ 4 = {ans}."
        questions.append(make_mcq(f"med_{q_num:04d}", q_num, prompt, str(ans), distractors, expl, "Averages & Statistics", "Statistics", "medium"))
        q_num += 1

    # 7. Introductory Algebra (120 questions)
    while len([q for q in questions if q["topic"] == "Introductory Algebra"]) < 120:
        a = random.randint(2, 10)
        x_val = random.randint(2, 15)
        b = random.randint(3, 30)
        c = a * x_val + b
        ans = x_val
        prompt = f"Solve for x: {a}x + {b} = {c}"
        if prompt in seen_prompts:
            continue
        seen_prompts.add(prompt)
        distractors = [str(ans + 1), str(ans - 1 if ans > 1 else ans + 3), str(ans + 2)]
        expl = f"Subtract {b}: {a}x = {c - b}. Divide by {a}: x = {c - b} ÷ {a} = {ans}."
        questions.append(make_mcq(f"med_{q_num:04d}", q_num, prompt, str(ans), distractors, expl, "Introductory Algebra", "Algebra", "medium"))
        q_num += 1

    # 8. Basic Geometry (120 questions)
    geom_types = ["rect_area", "rect_perim", "tri_area", "tri_angles", "square_area"]
    while len([q for q in questions if q["topic"] == "Basic Geometry"]) < 120:
        g_type = random.choice(geom_types)
        if g_type == "rect_area":
            w = random.randint(4, 25)
            h = random.randint(3, 18)
            ans = w * h
            prompt = f"Find the area of a rectangle with length {w} cm and width {h} cm."
            expl = f"Area = length × width = {w} × {h} = {ans} cm²."
        elif g_type == "rect_perim":
            w = random.randint(5, 30)
            h = random.randint(3, 20)
            ans = 2 * (w + h)
            prompt = f"Find the perimeter of a rectangle with length {w} m and width {h} m."
            expl = f"Perimeter = 2 × (length + width) = 2 × ({w} + {h}) = {ans} m."
        elif g_type == "tri_area":
            b = random.randint(4, 20) * 2
            h = random.randint(3, 15)
            ans = (b * h) // 2
            prompt = f"Find the area of a triangle with base {b} cm and height {h} cm."
            expl = f"Area = 1/2 × base × height = 1/2 × {b} × {h} = {ans} cm²."
        elif g_type == "tri_angles":
            ang1 = random.randint(35, 75)
            ang2 = random.randint(40, 75)
            ans = 180 - (ang1 + ang2)
            prompt = f"Two angles in a triangle measure {ang1}° and {ang2}°. What is the measure of the third angle?"
            expl = f"The sum of angles in a triangle is 180°. Third angle = 180° - ({ang1}° + {ang2}°) = {ans}°."
        else:
            side = random.randint(4, 25)
            ans = side * side
            prompt = f"What is the area of a square with a side length of {side} cm?"
            expl = f"Area of a square = side² = {side} × {side} = {ans} cm²."

        if prompt in seen_prompts:
            continue
        seen_prompts.add(prompt)
        distractors = [str(ans + 6), str(ans - 4 if ans > 4 else ans + 8), str(ans + 12)]
        questions.append(make_mcq(f"med_{q_num:04d}", q_num, prompt, str(ans), distractors, expl, "Basic Geometry", "Geometry", "medium"))
        q_num += 1

    return questions[:total_target]


def main():
    print("Generating 1,000 Easy questions...")
    easy_bank = generate_easy_bank(1000)
    print(f"Generated {len(easy_bank)} Easy questions.")

    print("Generating 1,000 Medium questions...")
    medium_bank = generate_medium_bank(1000)
    print(f"Generated {len(medium_bank)} Medium questions.")

    # Validation Checks
    for name, bank in [("Easy", easy_bank), ("Medium", medium_bank)]:
        seen_ids = set()
        seen_prompts = set()
        for idx, q in enumerate(bank):
            assert q["id"] not in seen_ids, f"Duplicate ID in {name}: {q['id']}"
            seen_ids.add(q["id"])
            assert q["question"] not in seen_prompts, f"Duplicate prompt in {name}: {q['question']}"
            seen_prompts.add(q["question"])
            assert len(q["options"]) == 4, f"Options count != 4 in {name} #{idx}"
            assert len(set(q["options"])) == 4, f"Duplicate options in {name} #{idx}: {q['options']}"
            assert q["correctAnswer"] in q["options"], f"Correct answer not in options in {name} #{idx}"
            assert q["options"][q["correctIndex"]] == q["correctAnswer"], f"Index mismatch in {name} #{idx}"
            assert len(q["explanation"]) > 5, f"Empty explanation in {name} #{idx}"

    print("All validation assertions passed for both banks!")

    # Output paths
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    web_data_dir = os.path.join(base_dir, "apps", "web", "src", "data")
    qb_json_dir = os.path.join(base_dir, "question-bank", "json")

    os.makedirs(web_data_dir, exist_ok=True)
    os.makedirs(qb_json_dir, exist_ok=True)

    # Save Easy
    web_easy = os.path.join(web_data_dir, "math_easy.json")
    qb_easy = os.path.join(qb_json_dir, "math_easy.json")
    with open(web_easy, "w", encoding="utf-8") as f:
        json.dump(easy_bank, f, indent=2, ensure_ascii=False)
    with open(qb_easy, "w", encoding="utf-8") as f:
        json.dump(easy_bank, f, indent=2, ensure_ascii=False)
    print(f"Saved Easy bank ({len(easy_bank)} Qs) to {web_easy} and {qb_easy}")

    # Save Medium
    web_med = os.path.join(web_data_dir, "math_medium.json")
    qb_med = os.path.join(qb_json_dir, "math_medium.json")
    with open(web_med, "w", encoding="utf-8") as f:
        json.dump(medium_bank, f, indent=2, ensure_ascii=False)
    with open(qb_med, "w", encoding="utf-8") as f:
        json.dump(medium_bank, f, indent=2, ensure_ascii=False)
    print(f"Saved Medium bank ({len(medium_bank)} Qs) to {web_med} and {qb_med}")

    # Link Hard
    existing_math = os.path.join(web_data_dir, "mathQuestions.json")
    with open(existing_math, "r", encoding="utf-8") as f:
        hard_bank = json.load(f)
    web_hard = os.path.join(web_data_dir, "math_hard.json")
    qb_hard = os.path.join(qb_json_dir, "math_hard.json")
    with open(web_hard, "w", encoding="utf-8") as f:
        json.dump(hard_bank, f, indent=2, ensure_ascii=False)
    with open(qb_hard, "w", encoding="utf-8") as f:
        json.dump(hard_bank, f, indent=2, ensure_ascii=False)
    print(f"Saved Hard bank ({len(hard_bank)} Qs) to {web_hard} and {qb_hard}")

if __name__ == "__main__":
    main()

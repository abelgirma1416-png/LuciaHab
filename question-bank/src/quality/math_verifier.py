"""Programmatic validation for mathematical and numerical answers."""
from __future__ import annotations
import re
from typing import Dict, Any, Tuple

class MathVerifier:
    def verify_question(self, question: Dict[str, Any]) -> Tuple[bool, str]:
        """Check calculation questions for arithmetic correctness.
        Returns (is_valid, message).
        """
        q_text = question.get("question_text", "")
        options = question.get("options", [])
        correct_idx = question.get("correct_index", 0)

        if not options or not (0 <= correct_idx < len(options)):
            return False, "Invalid option index."

        correct_opt = str(options[correct_idx]).strip()

        # 1. Slope verification: (y2 - y1) / (x2 - x1)
        # e.g., "Find the slope of the line passing through (x1, y1) and (x2, y2)"
        slope_match = re.search(r'passing through\s*\((-?\d+),\s*(-?\d+)\)\s*and\s*\((-?\d+),\s*(-?\d+)\)', q_text)
        if slope_match:
            x1, y1, x2, y2 = map(int, slope_match.groups())
            if x2 == x1:
                expected = "undefined"
            else:
                m = (y2 - y1) / (x2 - x1)
                expected = f"{int(m)}" if m.is_integer() else f"{m:.2f}"
            if expected in correct_opt.lower():
                return True, f"Verified slope calculation {expected}."
            return False, f"Slope discrepancy: calculated {expected}, but correct option is '{correct_opt}'."

        # 2. Linear equation solving: ax + b = c
        # e.g., "Solve for x: 2x + 6 = 14"
        lin_match = re.search(r'([+-]?\d*)\s*x\s*([+-]\s*\d+)\s*=\s*([+-]?\d+)', q_text)
        if lin_match:
            a_str, b_str, c_str = lin_match.groups()
            a = int(a_str) if a_str and a_str not in ['+', '-'] else (-1 if a_str == '-' else 1)
            b = int(b_str.replace(" ", ""))
            c = int(c_str)
            if a != 0:
                expected_x = (c - b) / a
                exp_str = f"{int(expected_x)}" if expected_x.is_integer() else f"{expected_x:.2f}"
                if exp_str in correct_opt:
                    return True, f"Verified linear equation solution x = {exp_str}."
                return False, f"Equation discrepancy: calculated x = {exp_str}, got '{correct_opt}'."

        # 3. Simple arithmetic evaluation: What is 5 + 7?
        arith_match = re.search(r'(\d+)\s*([\+\-\*\/])\s*(\d+)', q_text)
        if arith_match and any(w in q_text.lower() for w in ['calculate', 'value', 'evaluate', 'what is']):
            n1, op, n2 = arith_match.groups()
            num1, num2 = int(n1), int(n2)
            res = None
            if op == '+': res = num1 + num2
            elif op == '-': res = num1 - num2
            elif op == '*': res = num1 * num2
            elif op == '/' and num2 != 0: res = num1 / num2

            if res is not None:
                exp_res = f"{int(res)}" if isinstance(res, float) and res.is_integer() else str(res)
                if exp_res in correct_opt:
                    return True, f"Verified arithmetic evaluation {exp_res}."

        return True, "No verifiable numeric calculation detected or pattern passed."

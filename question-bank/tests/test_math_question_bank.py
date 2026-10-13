"""Unit tests for the 3-Tier (3,000 Questions) Mathematics Question Bank."""
import unittest
import os
import json

class TestMathQuestionBank(unittest.TestCase):
    def setUp(self):
        self.base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        self.web_data_dir = os.path.abspath(os.path.join(self.base_dir, "..", "apps", "web", "src", "data"))
        self.qb_json_dir = os.path.join(self.base_dir, "json")

    def test_all_three_banks_exist_and_count_1000(self):
        for tier in ["easy", "medium", "hard"]:
            qb_file = os.path.join(self.qb_json_dir, f"math_{tier}.json")
            web_file = os.path.join(self.web_data_dir, f"math_{tier}.json")

            self.assertTrue(os.path.exists(qb_file), f"Missing {qb_file}")
            self.assertTrue(os.path.exists(web_file), f"Missing {web_file}")

            with open(qb_file, "r", encoding="utf-8") as f:
                qb_data = json.load(f)
            with open(web_file, "r", encoding="utf-8") as f:
                web_data = json.load(f)

            self.assertEqual(len(qb_data), 1000, f"{tier} count != 1000 in {qb_file}")
            self.assertEqual(len(web_data), 1000, f"{tier} count != 1000 in {web_file}")

    def test_bank_questions_integrity(self):
        for tier in ["easy", "medium", "hard"]:
            web_file = os.path.join(self.web_data_dir, f"math_{tier}.json")
            with open(web_file, "r", encoding="utf-8") as f:
                questions = json.load(f)

            seen_ids = set()
            for idx, q in enumerate(questions):
                # ID
                self.assertTrue(q.get("id"))
                self.assertNotIn(q["id"], seen_ids)
                seen_ids.add(q["id"])

                # Question text
                self.assertTrue(q.get("question") and len(q["question"].strip()) > 3)

                # Exactly 4 options
                options = q.get("options")
                self.assertIsInstance(options, list)
                self.assertEqual(len(options), 4)
                self.assertEqual(len(set(options)), 4, f"Duplicate options in {tier} #{idx}")

                # Answer matches options
                correct_ans = q.get("correctAnswer")
                self.assertIn(correct_ans, options)

                # Letter and Index
                self.assertIn(q.get("correctAnswerLetter"), ["A", "B", "C", "D"])
                correct_idx = q.get("correctIndex")
                self.assertIn(correct_idx, [0, 1, 2, 3])
                self.assertEqual(options[correct_idx], correct_ans)

                # Explanation
                self.assertTrue(q.get("explanation") and len(q["explanation"].strip()) > 0)

if __name__ == "__main__":
    unittest.main()

"""Comprehensive unit and integration test suite for the Textbook-to-Quiz pipeline."""
import unittest
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.ingestion.extractor import PDFExtractor
from src.ingestion.chunker import TextbookChunker
from src.generator.base_provider import QuestionDraft
from src.generator.template_provider import TemplateQuestionGenerator
from src.quality.validator import QuestionValidator
from src.quality.duplicate_detector import DuplicateDetector
from src.quality.math_verifier import MathVerifier
from src.quality.quality_reporter import QualityReporter
from src.db.exporter import QuestionExporter

class TestPDFIngestion(unittest.TestCase):
    def setUp(self):
        self.extractor = PDFExtractor(min_char_threshold=50)

    def test_math_formula_detection(self):
        text_with_math = "For any function f(x) = 2x + 1, the slope m = 2."
        self.assertTrue(self.extractor.combined_math_regex.search(text_with_math))

        text_plain = "This is a basic history introductory sentence with no symbols."
        self.assertFalse(self.extractor.combined_math_regex.search(text_plain))

    def test_chunker_metadata(self):
        chunker = TextbookChunker()
        meta = chunker.extract_document_meta("grade-10-mathematics-new-curriculum.pdf", "MATHEMATICS Grade 10")
        self.assertEqual(meta["subject"], "Mathematics")
        self.assertEqual(meta["grade"], "Grade 10")

class TestQuestionGeneration(unittest.TestCase):
    def setUp(self):
        self.generator = TemplateQuestionGenerator()

    def test_definition_generation(self):
        sample_chunk = {
            "chunk_id": "chunk-test-1",
            "document_title": "Mathematics Grade 10",
            "chapter_title": "Unit 1: Relations",
            "section_title": "1.1 Relations",
            "subject": "Mathematics",
            "page_start": 10,
            "page_end": 12,
            "text": "Definition 1.1: A relation is defined as a subset of Cartesian product A x B."
        }
        drafts = self.generator.generate_questions_for_chunk(sample_chunk)
        self.assertGreater(len(drafts), 0)
        q = drafts[0]
        self.assertEqual(len(q.options), 4)
        self.assertEqual(len(set(q.options)), 4) # All options unique
        self.assertEqual(q.correct_index, 0)
        self.assertEqual(q.source_page_start, 10)

    def test_stable_id_generation(self):
        id1 = QuestionDraft.generate_stable_id("DocA", "Unit 1", 10, "What is a relation?")
        id2 = QuestionDraft.generate_stable_id("DocA", "Unit 1", 10, "What is a relation?")
        self.assertEqual(id1, id2)

class TestQualityValidation(unittest.TestCase):
    def setUp(self):
        self.validator = QuestionValidator()
        self.dup_detector = DuplicateDetector()
        self.math_verifier = MathVerifier()

    def test_valid_question(self):
        q = {
            "id": "q-1",
            "question_text": "What is the primary condition for a relation to be a function?",
            "options": ["Each input maps to one output", "Range is empty", "Domain is infinite", "Slope is zero"],
            "correct_index": 0,
            "explanation": "Every input element in the domain must map to a unique output.",
            "source_document": "Math Book",
            "source_page_start": 15,
            "difficulty": "medium"
        }
        status, notes = self.validator.validate(q)
        self.assertEqual(status, "valid")
        self.assertEqual(len(notes), 0)

    def test_detect_duplicate_options(self):
        q = {
            "id": "q-2",
            "question_text": "What is the slope of a horizontal line in Cartesian coordinates?",
            "options": ["Zero", "Undefined", "Zero", "One"],
            "correct_index": 0,
            "explanation": "Horizontal lines have a slope of zero.",
            "source_document": "Math Book",
            "source_page_start": 20,
            "difficulty": "easy"
        }
        status, notes = self.validator.validate(q)
        self.assertEqual(status, "error")
        self.assertTrue(any("Duplicate option detected" in n for n in notes))

    def test_exact_and_similarity_duplicates(self):
        q1 = {"id": "1", "question_text": "What is the mathematical definition of a relation in set theory?"}
        q2 = {"id": "2", "question_text": "What is the mathematical definition of a relation in set theory?"}
        q3 = {"id": "3", "question_text": "What is the exact mathematical definition of a relation in set theory?"}

        dups = self.dup_detector.find_duplicates([q1, q2, q3])
        self.assertEqual(dups["exact_duplicate_count"], 1)
        self.assertGreater(dups["similarity_warning_count"], 0)

    def test_math_calculation_verification(self):
        # Linear equation test
        q_math = {
            "question_text": "Solve for x: 2x + 6 = 14",
            "options": ["4", "5", "6", "10"],
            "correct_index": 0
        }
        is_valid, msg = self.math_verifier.verify_question(q_math)
        self.assertTrue(is_valid)
        self.assertIn("Verified linear equation", msg)

        # Discrepancy test
        q_wrong = {
            "question_text": "Solve for x: 2x + 6 = 14",
            "options": ["99", "5", "6", "10"],
            "correct_index": 0
        }
        is_valid, msg = self.math_verifier.verify_question(q_wrong)
        self.assertFalse(is_valid)
        self.assertIn("discrepancy", msg.lower())

class TestExporter(unittest.TestCase):
    def test_gameverse_format_conversion(self):
        draft = {
            "id": "q-abc",
            "subject": "Mathematics",
            "difficulty": "medium",
            "question_text": "What is a function?",
            "options": ["A", "B", "C", "D"],
            "correct_index": 0,
            "explanation": "Valid mapping.",
            "source_document": "Grade 10 Math",
            "source_chapter": "Unit 1",
            "source_page_start": 12
        }
        gv = QuestionExporter.to_gameverse_format(draft)
        self.assertEqual(gv["id"], "q-abc")
        self.assertEqual(gv["category"], "ethiopian_science")
        self.assertEqual(gv["question"]["en"], "What is a function?")
        self.assertEqual(gv["correctIndex"], 0)
        self.assertEqual(gv["source"]["page"], 12)

if __name__ == "__main__":
    unittest.main()

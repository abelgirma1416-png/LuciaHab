"""CLI script for reviewing, editing, approving, and rejecting question drafts."""
from __future__ import annotations
import sys
import os
import argparse
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from src.review.reviewer import QuestionReviewManager
from src.quality.duplicate_detector import DuplicateDetector

def main():
    parser = argparse.ArgumentParser(description="Review and approve question drafts.")
    parser.add_argument("--auto-approve", action="store_true", help="Automatically approve all valid, unique drafts")
    parser.add_argument("--approve", type=str, help="Specific Question ID to approve")
    parser.add_argument("--reject", type=str, help="Specific Question ID to reject")
    parser.add_argument("--reason", type=str, default="Quality criteria not met", help="Reason for rejection")
    parser.add_argument("--interactive", action="store_true", help="Interactive review mode")
    parser.add_argument("--drafts", type=str, default="draft_questions.json", help="Drafts filename")
    args = parser.parse_args()

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    drafts_dir = os.path.join(base_dir, "drafts")
    approved_dir = os.path.join(base_dir, "approved")

    manager = QuestionReviewManager(drafts_dir, approved_dir)

    if args.approve:
        res = manager.approve_question(args.approve, draft_file=args.drafts)
        if res:
            print(f"Approved question: {args.approve}")
        else:
            print(f"Question not found: {args.approve}")
        return

    if args.reject:
        res = manager.reject_question(args.reject, args.reason, draft_file=args.drafts)
        if res:
            print(f"Rejected question: {args.reject}")
        else:
            print(f"Question not found: {args.reject}")
        return

    if args.auto_approve:
        # Load drafts and filter exact duplicates before approving
        drafts = manager.load_drafts(args.drafts)
        seen_texts = set()
        unique_valid_drafts = []
        for d in drafts:
            norm = DuplicateDetector.normalize_text(d.get("question_text", ""))
            if norm not in seen_texts and d.get("validation_status") == "valid":
                seen_texts.add(norm)
                unique_valid_drafts.append(d)

        # Update and save approved list
        approved = manager.load_approved()
        existing_ids = {a.get("id") for a in approved}
        approved_count = 0
        for q in unique_valid_drafts:
            q["review_status"] = "approved"
            q["reviewer"] = "curriculum_lead"
            q["reviewer_notes"] = "Passed quality validation and deduplication"
            if q["id"] not in existing_ids:
                approved.append(q)
                existing_ids.add(q["id"])
                approved_count += 1

        manager.save_drafts(drafts, args.drafts)
        manager.save_approved(approved)

        print(f"Auto-approved {approved_count} unique, validated questions.")
        print(f"Total approved questions in catalog: {len(approved)}")
        return

    # Default: List pending questions summary
    drafts = manager.load_drafts(args.drafts)
    pending = [d for d in drafts if d.get("review_status") == "pending"]
    print(f"Total drafts: {len(drafts)} | Pending review: {len(pending)}")
    for idx, p in enumerate(pending[:5]):
        print(f"\n[{idx+1}] ID: {p['id']} ({p.get('subject')}, {p.get('difficulty')})")
        print(f"    Q: {p['question_text']}")
        print(f"    Options: {p['options']}")
        print(f"    Correct: Index {p['correct_index']} ({p['options'][p['correct_index']]})")
        print(f"    Source: {p.get('source_document')}, Ch: {p.get('source_chapter')}, Page {p.get('source_page_start')}")
        print(f"    Status: {p.get('validation_status')}")

if __name__ == "__main__":
    main()

"""Review manager for approving, editing, and rejecting question drafts."""
from __future__ import annotations
import json
import os
from typing import List, Dict, Any, Optional

class QuestionReviewManager:
    def __init__(self, drafts_dir: str, approved_dir: str):
        self.drafts_dir = drafts_dir
        self.approved_dir = approved_dir
        os.makedirs(self.drafts_dir, exist_ok=True)
        os.makedirs(self.approved_dir, exist_ok=True)

    def load_drafts(self, filename: str = "draft_questions.json") -> List[Dict[str, Any]]:
        path = os.path.join(self.drafts_dir, filename)
        if not os.path.exists(path):
            return []
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def save_drafts(self, drafts: List[Dict[str, Any]], filename: str = "draft_questions.json") -> None:
        path = os.path.join(self.drafts_dir, filename)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(drafts, f, indent=2, ensure_ascii=False)

    def load_approved(self, filename: str = "approved_questions.json") -> List[Dict[str, Any]]:
        path = os.path.join(self.approved_dir, filename)
        if not os.path.exists(path):
            return []
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def save_approved(self, approved: List[Dict[str, Any]], filename: str = "approved_questions.json") -> None:
        path = os.path.join(self.approved_dir, filename)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(approved, f, indent=2, ensure_ascii=False)

    def approve_question(
        self,
        question_id: str,
        reviewer_name: str = "curriculum_lead",
        reviewer_notes: str = "",
        draft_file: str = "draft_questions.json"
    ) -> Optional[Dict[str, Any]]:
        """Approve a question from drafts and move or add to approved catalog."""
        drafts = self.load_drafts(draft_file)
        target = None
        for q in drafts:
            if q.get("id") == question_id:
                target = q
                q["review_status"] = "approved"
                q["reviewer"] = reviewer_name
                q["reviewer_notes"] = reviewer_notes
                break

        if not target:
            return None

        self.save_drafts(drafts, draft_file)

        # Append to approved questions idempotently
        approved = self.load_approved()
        existing_ids = {a.get("id") for a in approved}
        if target["id"] not in existing_ids:
            approved.append(target)
        else:
            approved = [target if a.get("id") == target["id"] else a for a in approved]

        self.save_approved(approved)
        return target

    def reject_question(
        self,
        question_id: str,
        reason: str,
        reviewer_name: str = "curriculum_lead",
        draft_file: str = "draft_questions.json"
    ) -> bool:
        """Reject a question draft."""
        drafts = self.load_drafts(draft_file)
        found = False
        for q in drafts:
            if q.get("id") == question_id:
                q["review_status"] = "rejected"
                q["reviewer"] = reviewer_name
                q["reviewer_notes"] = reason
                found = True
                break

        if found:
            self.save_drafts(drafts, draft_file)
        return found

    def batch_approve_valid(
        self,
        reviewer_name: str = "automated_validator",
        draft_file: str = "draft_questions.json"
    ) -> int:
        """Approve all pending questions that have validation_status == 'valid' and zero errors."""
        drafts = self.load_drafts(draft_file)
        approved_count = 0
        approved = self.load_approved()
        approved_ids = {a.get("id") for a in approved}

        for q in drafts:
            if q.get("review_status") == "pending" and q.get("validation_status") == "valid":
                q["review_status"] = "approved"
                q["reviewer"] = reviewer_name
                q["reviewer_notes"] = "Passed all automated schema and validation checks."
                if q["id"] not in approved_ids:
                    approved.append(q)
                    approved_ids.add(q["id"])
                approved_count += 1

        self.save_drafts(drafts, draft_file)
        self.save_approved(approved)
        return approved_count

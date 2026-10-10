"""Supabase REST API client for secure server-side batch synchronization."""
from __future__ import annotations
import os
import json
from typing import List, Dict, Any, Optional
import requests
from .exporter import QuestionExporter

class SupabaseBatchImporter:
    def __init__(self, supabase_url: Optional[str] = None, service_role_key: Optional[str] = None):
        self.supabase_url = (supabase_url or os.getenv("SUPABASE_URL", "")).rstrip("/")
        self.service_role_key = service_role_key or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    def is_configured(self) -> bool:
        return bool(self.supabase_url and self.service_role_key)

    def batch_upsert_approved(self, approved_questions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Perform idempotent batch upsert into public.approved_questions table."""
        if not self.is_configured():
            return {
                "success": False,
                "message": "Supabase credentials not configured (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required)."
            }

        url = f"{self.supabase_url}/rest/v1/approved_questions"
        headers = {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }

        records = []
        for q in approved_questions:
            formatted = QuestionExporter.to_gameverse_format(q)
            records.append({
                "id": q["id"],
                "question_en": formatted["question"]["en"],
                "question_am": formatted["question"]["am"],
                "options_en": formatted["options"]["en"],
                "options_am": formatted["options"]["am"],
                "correct_index": formatted["correctIndex"],
                "explanation_en": formatted["explanation"]["en"],
                "explanation_am": formatted["explanation"]["am"],
                "category": formatted["category"],
                "subject": formatted["subject"],
                "difficulty": formatted["difficulty"],
                "source_document": formatted["source"]["document"],
                "source_chapter": formatted["source"]["chapter"],
                "source_page": formatted["source"]["page"]
            })

        try:
            res = requests.post(url, headers=headers, json=records, timeout=30)
            if res.status_code in [200, 201]:
                return {
                    "success": True,
                    "count": len(records),
                    "message": f"Successfully synced {len(records)} questions to Supabase."
                }
            return {
                "success": False,
                "status_code": res.status_code,
                "message": f"Supabase error: {res.text}"
            }
        except Exception as e:
            return {"success": False, "message": str(e)}

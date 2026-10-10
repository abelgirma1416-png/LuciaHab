"""Manifest state manager for resumable PDF ingestion and processing."""
from __future__ import annotations
import json
import os
import hashlib
from typing import Dict, Any, Optional

class ProcessingManifest:
    def __init__(self, manifest_path: str):
        self.manifest_path = manifest_path
        self.data: Dict[str, Any] = self._load()

    def _load(self) -> Dict[str, Any]:
        if os.path.exists(self.manifest_path):
            try:
                with open(self.manifest_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def save(self) -> None:
        os.makedirs(os.path.dirname(os.path.abspath(self.manifest_path)), exist_ok=True)
        with open(self.manifest_path, "w", encoding="utf-8") as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)

    @staticmethod
    def get_file_hash(filepath: str) -> str:
        hasher = hashlib.sha256()
        with open(filepath, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        return hasher.hexdigest()

    def get_document_state(self, doc_id: str) -> Dict[str, Any]:
        if doc_id not in self.data:
            self.data[doc_id] = {
                "file_path": "",
                "file_hash": "",
                "total_pages": 0,
                "processed_pages": [],
                "scanned_pages": [],
                "flagged_math_pages": [],
                "chunks_count": 0,
                "status": "pending",
                "last_page_processed": 0
            }
        return self.data[doc_id]

    def update_document_progress(
        self,
        doc_id: str,
        processed_page: int,
        is_scanned: bool = False,
        has_math_flag: bool = False
    ) -> None:
        doc = self.get_document_state(doc_id)
        if processed_page not in doc["processed_pages"]:
            doc["processed_pages"].append(processed_page)
        if is_scanned and processed_page not in doc["scanned_pages"]:
            doc["scanned_pages"].append(processed_page)
        if has_math_flag and processed_page not in doc["flagged_math_pages"]:
            doc["flagged_math_pages"].append(processed_page)
        doc["last_page_processed"] = max(doc.get("last_page_processed", 0), processed_page)
        self.save()

    def is_page_processed(self, doc_id: str, page_num: int) -> bool:
        doc = self.data.get(doc_id, {})
        return page_num in doc.get("processed_pages", [])

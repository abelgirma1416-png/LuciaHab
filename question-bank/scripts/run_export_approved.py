"""CLI script to export approved questions to Web Client data and Supabase SQL/REST."""
from __future__ import annotations
import sys
import os
import argparse
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from src.db.exporter import QuestionExporter
from src.db.supabase_client import SupabaseBatchImporter

def main():
    parser = argparse.ArgumentParser(description="Export approved questions to Web Client and Supabase.")
    parser.add_argument("--approved", type=str, default="approved/approved_questions.json", help="Path to approved questions")
    parser.add_argument("--web-dest", type=str, default="../apps/web/src/data/approvedQuestions.json", help="Relative path to web client data")
    parser.add_argument("--sql-output", type=str, default="approved/approved_upsert.sql", help="Path to output SQL file")
    parser.add_argument("--sync-supabase", action="store_true", help="Sync to Supabase database via REST API")
    args = parser.parse_args()

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    approved_path = os.path.join(base_dir, args.approved)

    if not os.path.exists(approved_path):
        print(f"Error: Approved file not found at {approved_path}. Run run_review.py first.")
        sys.exit(1)

    with open(approved_path, "r", encoding="utf-8") as f:
        approved_questions = json.load(f)

    print(f"Loaded {len(approved_questions)} approved questions.")

    # 1. Export to Web Client JSON
    web_dest_path = os.path.abspath(os.path.join(base_dir, args.web_dest))
    QuestionExporter.export_to_json(approved_questions, web_dest_path)
    print(f"Exported to Web Client JSON: {web_dest_path}")

    # 2. Export SQL Upsert
    sql_path = os.path.join(base_dir, args.sql_output)
    sql_content = QuestionExporter.generate_sql_upsert(approved_questions)
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write(sql_content)
    print(f"Exported Supabase SQL Upsert to: {sql_path}")

    # 3. Optional Supabase REST Sync
    if args.sync_supabase:
        print("\nAttempting Supabase REST API Sync...")
        importer = SupabaseBatchImporter()
        if not importer.is_configured():
            print("Note: Supabase credentials not found in environment. Skipping REST sync.")
        else:
            res = importer.batch_upsert_approved(approved_questions)
            print(f"Result: {res.get('message')}")

    print("\nExport Complete.")

if __name__ == "__main__":
    main()

"""CLI script to validate drafts, detect duplicates, and generate QA reports."""
from __future__ import annotations
import sys
import os
import argparse
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from src.quality.quality_reporter import QualityReporter

def main():
    parser = argparse.ArgumentParser(description="Run Quality Assurance checks on question drafts.")
    parser.add_argument("--drafts", type=str, default="drafts/draft_questions.json", help="Path to drafts JSON")
    parser.add_argument("--report-json", type=str, default="drafts/quality_report.json", help="Output JSON report path")
    parser.add_argument("--report-md", type=str, default="drafts/quality_report.md", help="Output Markdown report path")
    args = parser.parse_args()

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    drafts_path = os.path.join(base_dir, args.drafts)

    if not os.path.exists(drafts_path):
        print(f"Error: Drafts file not found at {drafts_path}.")
        sys.exit(1)

    with open(drafts_path, "r", encoding="utf-8") as f:
        drafts = json.load(f)

    print(f"Evaluating {len(drafts)} question drafts...")
    reporter = QualityReporter()
    report = reporter.generate_report(drafts)

    # Save updated drafts with validation status
    with open(drafts_path, "w", encoding="utf-8") as f:
        json.dump(drafts, f, indent=2, ensure_ascii=False)

    # Save JSON report
    report_json_path = os.path.join(base_dir, args.report_json)
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    # Save Markdown report
    md_content = reporter.format_markdown_report(report)
    report_md_path = os.path.join(base_dir, args.report_md)
    with open(report_md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    print("\n" + md_content)
    print(f"\nSaved reports to:\n- {report_json_path}\n- {report_md_path}")

if __name__ == "__main__":
    main()

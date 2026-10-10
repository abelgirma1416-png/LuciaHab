"""End-to-end Textbook-to-Quiz pipeline runner."""
from __future__ import annotations
import sys
import os
import argparse
import subprocess

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def run_step(step_name: str, cmd: list):
    print(f"\n=======================================================")
    print(f"STEP: {step_name}")
    print(f"Command: {' '.join(cmd)}")
    print(f"=======================================================")
    res = subprocess.run(cmd)
    if res.returncode != 0:
        print(f"Error in step '{step_name}' (exit code {res.returncode})")
        sys.exit(res.returncode)

def main():
    parser = argparse.ArgumentParser(description="Run complete Textbook-to-Quiz pipeline.")
    parser.add_argument("--pdf", type=str, default=None, help="Path to textbook PDF")
    parser.add_argument("--start-page", type=int, default=1, help="Start page")
    parser.add_argument("--end-page", type=int, default=25, help="End page")
    parser.add_argument("--provider", type=str, default="template", help="AI Provider: template, openai, gemini, ollama")
    parser.add_argument("--auto-approve", action="store_true", default=True, help="Automatically approve validated questions")
    parser.add_argument("--sync-supabase", action="store_true", default=False, help="Sync to Supabase if configured")
    args = parser.parse_args()

    python_exe = sys.executable
    scripts_dir = os.path.dirname(os.path.abspath(__file__))

    # 1. Ingestion
    ingest_cmd = [python_exe, os.path.join(scripts_dir, "run_ingest.py"), "--start-page", str(args.start_page), "--end-page", str(args.end_page)]
    if args.pdf:
        ingest_cmd.extend(["--pdf", args.pdf])
    run_step("1. PDF Ingestion & Semantic Chunking", ingest_cmd)

    # 2. Question Generation
    gen_cmd = [python_exe, os.path.join(scripts_dir, "run_generate.py"), "--provider", args.provider]
    run_step("2. Question Generation", gen_cmd)

    # 3. Quality Assurance & Validation
    qa_cmd = [python_exe, os.path.join(scripts_dir, "run_quality_check.py")]
    run_step("3. Quality Assurance & Duplicate Checks", qa_cmd)

    # 4. Review & Approval
    if args.auto_approve:
        rev_cmd = [python_exe, os.path.join(scripts_dir, "run_review.py"), "--auto-approve"]
        run_step("4. Review & Approval", rev_cmd)

    # 5. Export
    exp_cmd = [python_exe, os.path.join(scripts_dir, "run_export_approved.py")]
    if args.sync_supabase:
        exp_cmd.append("--sync-supabase")
    run_step("5. Export to Web Catalog & Supabase", exp_cmd)

    print(f"\n=======================================================")
    print("Pipeline Execution Succeeded!")
    print("Approved questions are ready in LuciaHab React application and Supabase SQL.")
    print("=======================================================\n")

if __name__ == "__main__":
    main()

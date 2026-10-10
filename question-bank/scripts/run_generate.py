"""CLI script to generate question drafts from extracted textbook chunks."""
from __future__ import annotations
import sys
import os
import argparse
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from src.generator.question_builder import QuestionGenerationPipeline

def main():
    parser = argparse.ArgumentParser(description="Generate quiz question drafts from textbook chunks.")
    parser.add_argument("--chunks", type=str, default="extracted/chunks.json", help="Path to chunks JSON")
    parser.add_argument("--provider", type=str, default=None, help="AI Provider: template (default/offline), openai, gemini, ollama")
    parser.add_argument("--output", type=str, default="drafts/draft_questions.json", help="Path to save draft questions JSON")
    args = parser.parse_args()

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    chunks_path = os.path.join(base_dir, args.chunks)
    output_path = os.path.join(base_dir, args.output)

    if not os.path.exists(chunks_path):
        print(f"Error: Chunks file not found at {chunks_path}. Run run_ingest.py first.")
        sys.exit(1)

    with open(chunks_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    print(f"Loaded {len(chunks)} chunks.")

    # Check for existing drafts for resumability
    existing_drafts = []
    existing_ids = set()
    if os.path.exists(output_path):
        try:
            with open(output_path, "r", encoding="utf-8") as f:
                existing_drafts = json.load(f)
                existing_ids = {d.get("id") for d in existing_drafts if d.get("id")}
                print(f"Found {len(existing_drafts)} existing drafts. Continuing resumably...")
        except Exception:
            pass

    pipeline = QuestionGenerationPipeline(provider_name=args.provider)
    print(f"Generating questions using provider: '{pipeline.provider_name}'...")

    def on_progress(curr, total):
        if curr % 5 == 0 or curr == total:
            print(f"Processing chunk {curr}/{total}...")

    new_drafts = pipeline.generate_from_chunks(chunks, existing_draft_ids=existing_ids, progress_callback=on_progress)

    all_drafts = existing_drafts + [d.to_dict() for d in new_drafts]

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_drafts, f, indent=2, ensure_ascii=False)

    print(f"\nGeneration Complete:")
    print(f"- New questions generated: {len(new_drafts)}")
    print(f"- Total questions in drafts: {len(all_drafts)}")
    print(f"- Saved to: {output_path}")

if __name__ == "__main__":
    main()

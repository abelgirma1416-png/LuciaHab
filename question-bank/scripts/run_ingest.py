"""CLI script to ingest textbook PDF, extract pages, detect scans, and chunk content."""
from __future__ import annotations
import sys
import os
import argparse
import json

# Ensure parent directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from src.ingestion.extractor import PDFExtractor
from src.ingestion.chunker import TextbookChunker
from src.ingestion.manifest import ProcessingManifest

def main():
    parser = argparse.ArgumentParser(description="Ingest textbook PDF into structured topic chunks.")
    parser.add_argument("--pdf", type=str, default=None, help="Path to PDF file (default: first PDF in pdfs/)")
    parser.add_argument("--start-page", type=int, default=1, help="Start page number (1-indexed)")
    parser.add_argument("--end-page", type=int, default=30, help="End page number (sample default: 30)")
    parser.add_argument("--output", type=str, default="extracted/chunks.json", help="Path to save output chunks JSON")
    args = parser.parse_args()

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    pdfs_dir = os.path.join(base_dir, "pdfs")

    pdf_path = args.pdf
    if not pdf_path:
        pdf_files = [os.path.join(pdfs_dir, f) for f in os.listdir(pdfs_dir) if f.lower().endswith(".pdf")]
        if not pdf_files:
            print("Error: No PDF files found in pdfs/ directory.")
            sys.exit(1)
        pdf_path = pdf_files[0]

    print(f"==================================================")
    print(f"Ingesting PDF: {os.path.basename(pdf_path)}")
    print(f"Page range: {args.start_page} to {args.end_page}")
    print(f"==================================================")

    manifest_path = os.path.join(base_dir, "extracted", "manifest.json")
    manifest = ProcessingManifest(manifest_path)
    doc_id = os.path.basename(pdf_path)

    extractor = PDFExtractor(min_char_threshold=50)
    
    def on_progress(current, total):
        if current % 10 == 0 or current == total:
            print(f"Extracting page {current}/{total}...")

    extraction_result = extractor.extract_document(
        pdf_path,
        start_page=args.start_page,
        end_page=args.end_page,
        progress_callback=on_progress
    )

    print(f"\nExtraction Complete:")
    print(f"- Total pages examined: {len(extraction_result['pages'])}")
    print(f"- Scanned/low-text pages: {extraction_result['scanned_pages_count']}")
    print(f"- Pages with math formulas: {extraction_result['math_pages_count']}")
    print(f"- Pages with diagrams: {extraction_result['diagram_pages_count']}")
    if extraction_result["errors"]:
        print(f"- Extraction errors: {len(extraction_result['errors'])}")
        for err in extraction_result["errors"]:
            print(f"  Page {err['page']}: {err['error']}")

    # Semantic chunking
    chunker = TextbookChunker()
    front_matter_sample = "\n".join(p["text"] for p in extraction_result["pages"][:5])
    doc_meta = chunker.extract_document_meta(os.path.basename(pdf_path), front_matter_sample)

    print(f"\nInferred Document Metadata:")
    print(f"- Title: {doc_meta['title']}")
    print(f"- Subject: {doc_meta['subject']}")
    print(f"- Grade: {doc_meta['grade']}")

    chunks = chunker.chunk_pages(extraction_result["pages"], doc_meta)
    print(f"- Generated {len(chunks)} semantic topic chunks.")

    # Save chunks
    output_path = os.path.join(base_dir, args.output)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(chunks, f, indent=2, ensure_ascii=False)

    # Update manifest
    manifest.get_document_state(doc_id)
    for p in extraction_result["pages"]:
        manifest.update_document_progress(
            doc_id,
            p["page_number"],
            is_scanned=p["is_scanned"],
            has_math_flag=p["has_math_formula"]
        )

    print(f"Saved chunks to: {output_path}")

if __name__ == "__main__":
    main()

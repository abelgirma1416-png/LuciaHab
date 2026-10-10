
from pathlib import Path
import pdfplumber

ROOT = Path(__file__).resolve().parent.parent
PDF_DIR = ROOT / "pdfs"
OUTPUT_DIR = ROOT / "extracted"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

pdf_files = list(PDF_DIR.glob("*.pdf"))

if not pdf_files:
    print("No PDF files found in the pdfs folder.")
    raise SystemExit(0)

for pdf_path in pdf_files:
    output_path = OUTPUT_DIR / f"{pdf_path.stem}.txt"
    page_count = 0
    extracted_pages = 0

    with pdfplumber.open(pdf_path) as pdf:
        with output_path.open("w", encoding="utf-8") as output:
            for page_number, page in enumerate(pdf.pages, start=1):
                page_count += 1
                text = page.extract_text() or ""

                output.write(
                    f"\n\n--- PAGE {page_number} ---\n"
                )
                output.write(text)

                if text.strip():
                    extracted_pages += 1

    print(f"PDF: {pdf_path.name}")
    print(f"Pages: {page_count}")
    print(f"Pages with extracted text: {extracted_pages}")
    print(f"Output: {output_path}")

    if extracted_pages == 0:
        print("WARNING: This PDF may require OCR.")
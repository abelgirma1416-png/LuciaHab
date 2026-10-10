# LuciaHab — Textbook-to-Quiz Generator for GameVerse

A robust, pedagogical textbook-to-question generation pipeline that transforms educational textbook PDFs (explanations, theories, formulas, worked examples, and chapter summaries) into original, high-quality, traceable quiz questions for the LuciaHab GameVerse trivia engine and Supabase PostgreSQL.

---

## Architecture Overview

```
LuciaHab/
├── question-bank/
│   ├── pdfs/                     # Raw textbook PDF files
│   ├── extracted/                # Page extractions, chunk metadata, and resumable manifest
│   │   ├── chunks.json
│   │   └── manifest.json
│   ├── drafts/                   # Generated question drafts & QA reports
│   │   ├── draft_questions.json
│   │   ├── quality_report.json
│   │   └── quality_report.md
│   ├── approved/                 # Approved question catalog & SQL upsert
│   │   ├── approved_questions.json
│   │   └── approved_upsert.sql
│   ├── src/
│   │   ├── ingestion/            # Phase 1: PDF extraction, scan detection & semantic chunking
│   │   │   ├── extractor.py
│   │   │   ├── chunker.py
│   │   │   └── manifest.py
│   │   ├── generator/            # Phase 2-4: AI & offline template question generation
│   │   │   ├── base_provider.py
│   │   │   ├── template_provider.py
│   │   │   ├── ai_provider.py
│   │   │   └── question_builder.py
│   │   ├── quality/              # Phase 6: Duplicate detection, validation & math verifier
│   │   │   ├── validator.py
│   │   │   ├── duplicate_detector.py
│   │   │   ├── math_verifier.py
│   │   │   └── quality_reporter.py
│   │   ├── review/               # Phase 5: Draft inspection and approval manager
│   │   │   └── reviewer.py
│   │   └── db/                   # Phase 7: Supabase batch synchronization & format exporter
│   │       ├── exporter.py
│   │       └── supabase_client.py
│   ├── scripts/                  # CLI toolchain
│   │   ├── run_ingest.py         # Step 1: Ingest and chunk PDF
│   │   ├── run_generate.py       # Step 2: Generate draft questions
│   │   ├── run_quality_check.py  # Step 3: Run validation & duplicate detection
│   │   ├── run_review.py         # Step 4: Review and approve questions
│   │   ├── run_export_approved.py# Step 5: Export to Web catalog & Supabase
│   │   └── run_pipeline.py       # All-in-one end-to-end runner
│   ├── supabase/
│   │   └── schema.sql            # PostgreSQL DDL with Row Level Security (RLS)
│   ├── tests/
│   │   └── test_pipeline.py      # Automated Python unit & integration test suite
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Environment variables template
└── apps/web/                     # React 19 / TypeScript 6 / Vite Web Game Application
    └── src/
        ├── data/
        │   └── approvedQuestions.json # Direct catalog export
        └── services/
            ├── supabaseClient.ts      # Public anon client with RLS protection
            └── triviaService.ts       # Unified trivia question loader with offline fallback
```

---

## Getting Started

### 1. Python Environment Setup

```bash
cd question-bank
python -m venv .venv
# On Windows Powershell:
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env`:
- `AI_PROVIDER`: `template` (default, works 100% offline without API keys), `openai`, `gemini`, `anthropic`, or `ollama`.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: Optional, for syncing to PostgreSQL.

---

## How to Process a Textbook

### Method A: One-Command Automated Pipeline

To run the entire pipeline on a sample range (e.g. pages 1–25) or full book:
```bash
python scripts/run_pipeline.py --start-page 1 --end-page 30 --provider template
```

### Method B: Step-by-Step Execution

#### Step 1: PDF Ingestion & Semantic Chunking
Extracts text, preserves 1-indexed page tracking, detects empty/scanned pages, flags math notation and diagrams, splits into chapter/section chunks:
```bash
python scripts/run_ingest.py --start-page 1 --end-page 25
```
*Output: `extracted/chunks.json` & `extracted/manifest.json`*

#### Step 2: Question Generation
Synthesizes questions strictly traceable to source content:
```bash
python scripts/run_generate.py --provider template
```
*Output: `drafts/draft_questions.json`*

#### Step 3: Quality Assurance & Validation
Validates fields (4 options, correct answer index, explanation), detects exact duplicates and similarity alerts, verifies math calculations programmatically:
```bash
python scripts/run_quality_check.py
```
*Output: `drafts/quality_report.json` & `drafts/quality_report.md`*

#### Step 4: Review and Approval
Inspect draft questions alongside source citations:
```bash
# View pending questions
python scripts/run_review.py

# Approve all valid, deduplicated questions:
python scripts/run_review.py --auto-approve

# Or approve/reject a specific question by ID:
python scripts/run_review.py --approve q-8a3b3fba0f28
python scripts/run_review.py --reject q-xxxx --reason "Ambiguous distractor"
```
*Output: `approved/approved_questions.json`*

#### Step 5: Export to Web Catalog & Supabase
Exports approved questions directly into the LuciaHab web application (`apps/web/src/data/approvedQuestions.json`) and generates idempotent SQL upsert script (`approved/approved_upsert.sql`):
```bash
python scripts/run_export_approved.py
```

---

## Supabase PostgreSQL & RLS Security

Run `supabase/schema.sql` in the Supabase SQL Editor:
- **`sources`**: Metadata on textbooks and documents.
- **`extracted_chunks`**: Section-level text chunks and page ranges.
- **`question_drafts`**: Internal questions undergoing review (`pending`, `approved`, `rejected`).
- **`approved_questions`**: Public game question bank.

### Security Guarantees:
- **Public / Anon Players**: Granted `SELECT` permission on `approved_questions` ONLY. Cannot insert, update, or delete.
- **Drafts & Ingestion Data**: Completely shielded from anonymous access (service role / admin only).
- **Frontend Safety**: Client code (`apps/web`) only uses public anon keys. Service-role keys never touch client code.

---

## GameVerse Trivia Integration

The React app (`apps/web/src/components/games/EthiopianMindSprintGame.tsx`) connects via `src/services/triviaService.ts`:
- Seamlessly queries Supabase `approved_questions` if credentials are set in `.env` (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).
- Automatically falls back to local approved questions and bundled questions if offline or unconfigured.
- Prevents question repetition within the session.
- Avoids recently answered questions using `sessionStorage` player history.

---

## Running Automated Tests

```bash
python -m unittest tests/test_pipeline.py
```

All 9 test cases covering extractor scan detection, math regex, chunking, draft generation, duplicate detection, math validation, and export formatting pass with 100% success.

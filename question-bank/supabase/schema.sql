-- LuciaHab GameVerse Question Bank Schema
-- PostgreSQL with Row Level Security (RLS) for Supabase

-- 1. Table: Sources (Textbook / Educational Material Documents)
CREATE TABLE IF NOT EXISTS public.sources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT DEFAULT 'Ministry of Education',
    grade TEXT,
    subject TEXT NOT NULL,
    edition TEXT,
    total_pages INTEGER DEFAULT 0,
    file_path TEXT,
    file_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: Extracted Chunks
CREATE TABLE IF NOT EXISTS public.extracted_chunks (
    id TEXT PRIMARY KEY,
    source_id TEXT REFERENCES public.sources(id) ON DELETE CASCADE,
    chapter_title TEXT,
    section_title TEXT,
    page_start INTEGER NOT NULL,
    page_end INTEGER NOT NULL,
    char_count INTEGER,
    has_formulas BOOLEAN DEFAULT FALSE,
    has_diagrams BOOLEAN DEFAULT FALSE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table: Question Drafts (Internal / Pending Review)
CREATE TABLE IF NOT EXISTS public.question_drafts (
    id TEXT PRIMARY KEY,
    source_id TEXT REFERENCES public.sources(id) ON DELETE SET NULL,
    chunk_id TEXT REFERENCES public.extracted_chunks(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of 4 strings
    correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
    explanation TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_type TEXT DEFAULT 'multiple_choice',
    review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
    validation_status TEXT DEFAULT 'valid' CHECK (validation_status IN ('valid', 'warning', 'error')),
    reviewer TEXT,
    reviewer_notes TEXT,
    source_document TEXT,
    source_chapter TEXT,
    source_page_start INTEGER,
    source_page_end INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table: Approved Questions (Public Game Question Bank)
CREATE TABLE IF NOT EXISTS public.approved_questions (
    id TEXT PRIMARY KEY,
    question_en TEXT NOT NULL,
    question_am TEXT,
    options_en JSONB NOT NULL, -- Array of 4 strings
    options_am JSONB,
    correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
    explanation_en TEXT NOT NULL,
    explanation_am TEXT,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    source_document TEXT NOT NULL,
    source_chapter TEXT,
    source_page INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for rapid querying and filtering
CREATE INDEX IF NOT EXISTS idx_approved_category ON public.approved_questions(category);
CREATE INDEX IF NOT EXISTS idx_approved_subject ON public.approved_questions(subject);
CREATE INDEX IF NOT EXISTS idx_approved_difficulty ON public.approved_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON public.question_drafts(review_status);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approved_questions ENABLE ROW LEVEL SECURITY;

-- Approved Questions:
-- 1. Public / Anon users can SELECT approved questions only
CREATE POLICY "Public players can read approved questions"
    ON public.approved_questions
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 2. Public / Anon users CANNOT insert, update, or delete approved questions
-- Only service_role or authenticated administrators can modify
CREATE POLICY "Only authorized users can insert approved questions"
    ON public.approved_questions
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Only authorized users can update approved questions"
    ON public.approved_questions
    FOR UPDATE
    TO service_role
    USING (true);

CREATE POLICY "Only authorized users can delete approved questions"
    ON public.approved_questions
    FOR DELETE
    TO service_role
    USING (true);

-- Question Drafts:
-- Restricted to service_role (Admin / Review Pipeline)
CREATE POLICY "Admin access to question drafts"
    ON public.question_drafts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Sources & Extracted Chunks:
-- Restricted to service_role
CREATE POLICY "Admin access to sources"
    ON public.sources
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin access to extracted chunks"
    ON public.extracted_chunks
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

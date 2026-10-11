-- ============================================================
-- SERMON FULL-TEXT SEARCH (PostgreSQL tsvector + GIN index)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add search vector column to sermons
ALTER TABLE public.sermons 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Create trigger function to auto-update search_vector
CREATE OR REPLACE FUNCTION public.update_sermon_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.preacher, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to auto-update on insert/update
DROP TRIGGER IF EXISTS trigger_update_sermon_search_vector ON public.sermons;
CREATE TRIGGER trigger_update_sermon_search_vector
  BEFORE INSERT OR UPDATE ON public.sermons
  FOR EACH ROW EXECUTE FUNCTION public.update_sermon_search_vector();

-- 4. Backfill existing rows
UPDATE public.sermons 
SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(preacher, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(notes, '')), 'C');

-- 5. Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_sermons_search_vector 
ON public.sermons USING GIN (search_vector);

-- 6. Create search function with ranking
CREATE OR REPLACE FUNCTION public.search_sermons(
  p_query TEXT,
  p_topic_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  preacher TEXT,
  date DATE,
  audio_url TEXT,
  video_link TEXT,
  notes TEXT,
  topic_id UUID,
  topics_name TEXT,
  topics_slug TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.preacher,
    s.date,
    s.audio_url,
    s.video_link,
    s.notes,
    s.topic_id,
    t.name AS topics_name,
    t.slug AS topics_slug,
    ts_rank_cd(s.search_vector, plainto_tsquery('english', p_query)) AS rank
  FROM public.sermons s
  LEFT JOIN public.topics t ON t.id = s.topic_id
  WHERE 
    s.search_vector @@ plainto_tsquery('english', p_query)
    AND (p_topic_id IS NULL OR s.topic_id = p_topic_id)
  ORDER BY rank DESC, s.date DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 7. Grant execute to anon/authenticated
GRANT EXECUTE ON FUNCTION public.search_sermons(TEXT, UUID, INT, INT) TO anon, authenticated;

-- 8. Also add fuzzy search for "sounds like" (optional)
CREATE OR REPLACE FUNCTION public.search_sermons_fuzzy(
  p_query TEXT,
  p_topic_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  preacher TEXT,
  date DATE,
  audio_url TEXT,
  video_link TEXT,
  notes TEXT,
  topic_id UUID,
  topics_name TEXT,
  topics_slug TEXT,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.preacher,
    s.date,
    s.audio_url,
    s.video_link,
    s.notes,
    s.topic_id,
    t.name AS topics_name,
    t.slug AS topics_slug,
    GREATEST(
      similarity(s.title, p_query),
      similarity(s.preacher, p_query)
    ) AS similarity
  FROM public.sermons s
  LEFT JOIN public.topics t ON t.id = s.topic_id
  WHERE 
    (similarity(s.title, p_query) > 0.3 OR similarity(s.preacher, p_query) > 0.3)
    AND (p_topic_id IS NULL OR s.topic_id = p_topic_id)
  ORDER BY similarity DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.search_sermons_fuzzy(TEXT, UUID, INT, INT) TO anon, authenticated;
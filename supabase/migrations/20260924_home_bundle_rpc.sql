-- ============================================================
-- HOME VAULT BUNDLE RPC — Single SQL roundtrip for PWA shell
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_home_vault_bundle()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'sermons', (
      SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json)
      FROM (
        SELECT s.id, s.title, s.preacher, s.date, s.audio_url, s.video_link, t.name as topic_name, t.slug as topic_slug
        FROM public.sermons s
        LEFT JOIN public.topics t ON t.id = s.topic_id
        ORDER BY s.date DESC
        LIMIT 3
      ) s
    ),
    'programs', (
      SELECT COALESCE(json_agg(row_to_json(p), true), '[]'::json)
      FROM (
        SELECT id, title, description, event_date, venue
        FROM public.programs
        WHERE event_date >= NOW()
        ORDER BY event_date ASC
        LIMIT 3
      ) p
    ),
    'music', (
      SELECT COALESCE(json_agg(row_to_json(m)), '[]'::json)
      FROM (
        SELECT id, title, artist_choir, audio_url, lyrics
        FROM public.church_music
        ORDER BY created_at DESC
        LIMIT 3
      ) m
    ),
    'stats', (
      SELECT json_build_object(
        'sermons_count', (SELECT COUNT(*) FROM public.sermons),
        'programs_count', (SELECT COUNT(*) FROM public.programs WHERE event_date >= NOW()),
        'alerts_count', (SELECT COUNT(*) FROM public.alerts WHERE expires_at > NOW()),
        'first_timers_count', (SELECT COUNT(*) FROM public.first_timers WHERE status = 'new')
      )
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant to authenticated users
GRANT EXECUTE ON FUNCTION public.get_home_vault_bundle() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_home_vault_bundle() TO anon;

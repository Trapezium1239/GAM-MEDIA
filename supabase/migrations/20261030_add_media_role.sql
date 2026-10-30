-- Add a 'media' role for content uploaders (limited access)
DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'media';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Helper: full admins only
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: admin, pastor, or media (can upload content)
CREATE OR REPLACE FUNCTION public.is_content_uploader()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'pastor', 'media')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Granular permissions: media can upload (insert/update) only a few content types;
-- delete/remove is restricted to full admins (admin/pastor).
DROP POLICY IF EXISTS "Admin write sermons" ON public.sermons;
DROP POLICY IF EXISTS "Admin write gallery" ON public.gallery_items;
DROP POLICY IF EXISTS "Admin write music" ON public.church_music;

CREATE POLICY "Uploaders write sermons" ON public.sermons
  FOR INSERT WITH CHECK (public.is_content_uploader());
CREATE POLICY "Uploaders update sermons" ON public.sermons
  FOR UPDATE USING (public.is_content_uploader()) WITH CHECK (public.is_content_uploader());

CREATE POLICY "Uploaders write gallery" ON public.gallery_items
  FOR INSERT WITH CHECK (public.is_content_uploader());
CREATE POLICY "Uploaders update gallery" ON public.gallery_items
  FOR UPDATE USING (public.is_content_uploader()) WITH CHECK (public.is_content_uploader());

CREATE POLICY "Uploaders write music" ON public.church_music
  FOR INSERT WITH CHECK (public.is_content_uploader());
CREATE POLICY "Uploaders update music" ON public.church_music
  FOR UPDATE USING (public.is_content_uploader()) WITH CHECK (public.is_content_uploader());

CREATE POLICY "Admins delete sermons" ON public.sermons
  FOR DELETE USING (public.is_admin_or_pastor());
CREATE POLICY "Admins delete gallery" ON public.gallery_items
  FOR DELETE USING (public.is_admin_or_pastor());
CREATE POLICY "Admins delete music" ON public.church_music
  FOR DELETE USING (public.is_admin_or_pastor());

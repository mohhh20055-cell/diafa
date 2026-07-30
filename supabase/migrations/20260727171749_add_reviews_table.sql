/*
# Add reviews & ratings system

## Overview
Creates a `reviews` table so clients can rate establishments with 1-5 stars
and leave a comment. The average rating and review count are surfaced on
listing cards and the establishment detail page.

## New Tables
1. `reviews`
   - `id` (uuid, PK)
   - `establishment_id` -> establishments.id (CASCADE)
   - `user_id` -> profiles.id (CASCADE) — the reviewer
   - `rating` (int 1-5, NOT NULL)
   - `comment` (text, optional)
   - `created_at` (timestamptz)
   - UNIQUE(user_id, establishment_id) — one review per user per establishment

2. `establishment_rating_summary` (view)
   - Per-establishment aggregate: avg_rating (numeric, 0 if no reviews),
     review_count (int). Used by the frontend to show stars without
     fetching every review row.

## Security (RLS)
- SELECT: public (anon + authenticated) — anyone can see ratings.
- INSERT: authenticated only, user_id must match auth.uid(), and the
  establishment must exist.
- UPDATE/DELETE: authenticated only, own row (user_id = auth.uid()).
  Admins can also delete any review.

## Important notes
1. The view bypasses RLS via SECURITY DEFINER so it returns ratings even
   for establishments the anon reader doesn't own.
2. No existing tables are modified or dropped — only a new table + view.
*/

-- ============================================================
-- REVIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, establishment_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_establishment ON reviews(establishment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can see reviews
DROP POLICY IF EXISTS "public_select_reviews" ON reviews;
CREATE POLICY "public_select_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

-- Authenticated users can insert their own review
DROP POLICY IF EXISTS "insert_own_review" ON reviews;
CREATE POLICY "insert_own_review" ON reviews FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- Users can update their own review
DROP POLICY IF EXISTS "update_own_review" ON reviews;
CREATE POLICY "update_own_review" ON reviews FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Users can delete their own review; admins can delete any
DROP POLICY IF EXISTS "delete_own_review" ON reviews;
CREATE POLICY "delete_own_review" ON reviews FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- AGGREGATE VIEW (bypasses RLS so anon can read averages)
-- ============================================================
CREATE OR REPLACE VIEW public.establishment_rating_summary AS
SELECT
  e.id AS establishment_id,
  COALESCE(AVG(r.rating), 0) AS avg_rating,
  COALESCE(COUNT(r.id), 0) AS review_count
FROM public.establishments e
LEFT JOIN public.reviews r ON r.establishment_id = e.id
GROUP BY e.id;

GRANT SELECT ON public.establishment_rating_summary TO anon, authenticated;

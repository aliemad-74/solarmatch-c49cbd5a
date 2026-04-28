
CREATE TABLE public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text CHECK (comment IS NULL OR length(comment) <= 2000),
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('general','accuracy','usability','bug','feature')),
  page_context text CHECK (page_context IS NULL OR length(page_context) <= 100),
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_hash text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','resolved','archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_feedback_created_at ON public.user_feedback (created_at DESC);
CREATE INDEX idx_user_feedback_user_id ON public.user_feedback (user_id);
CREATE INDEX idx_user_feedback_status ON public.user_feedback (status);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
ON public.user_feedback FOR INSERT
TO anon, authenticated
WITH CHECK (
  rating BETWEEN 1 AND 5
  AND (comment IS NULL OR length(comment) <= 2000)
  AND (user_id IS NULL OR user_id = auth.uid())
);

CREATE POLICY "Admins can view feedback"
ON public.user_feedback FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own feedback"
ON public.user_feedback FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update feedback"
ON public.user_feedback FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete feedback"
ON public.user_feedback FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));


-- Enum kategori program
CREATE TYPE public.program_category AS ENUM ('fully_funded', 'partial_funded', 'self_funded');
CREATE TYPE public.participant_status AS ENUM ('pending', 'reviewed', 'interview', 'accepted', 'rejected');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Tabel participants
CREATE TABLE public.participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date DATE NOT NULL,
  city TEXT NOT NULL,
  education TEXT NOT NULL,
  occupation TEXT NOT NULL,
  category public.program_category NOT NULL,
  reason TEXT NOT NULL,
  achievements TEXT NOT NULL,
  organization_experience TEXT,
  social_media TEXT,
  cv_url TEXT,
  photo_url TEXT,
  essay_worthy TEXT NOT NULL,
  essay_dream TEXT NOT NULL,
  essay_contribution TEXT NOT NULL,
  status public.participant_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel user_roles (untuk admin)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Enable RLS
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies participants
CREATE POLICY "Anyone can register" ON public.participants
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can view all participants" ON public.participants
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update participants" ON public.participants
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete participants" ON public.participants
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Policies user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_participants_updated_at
  BEFORE UPDATE ON public.participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('participant-cv', 'participant-cv', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('participant-photo', 'participant-photo', true);

-- Storage policies: anyone can upload
CREATE POLICY "Anyone can upload CV" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'participant-cv');

CREATE POLICY "Anyone can upload photo" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'participant-photo');

CREATE POLICY "Photos are publicly viewable" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'participant-photo');

CREATE POLICY "Admins can view CVs" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'participant-cv' AND public.has_role(auth.uid(), 'admin'));

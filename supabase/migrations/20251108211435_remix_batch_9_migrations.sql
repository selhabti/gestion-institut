
-- Migration: 20251104115203
-- Create enum for group types
CREATE TYPE public.group_type AS ENUM ('Samedi', 'Dimanche');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create user_roles policies (only admins can view/manage roles)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create members table
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  group_type group_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Members policies
CREATE POLICY "Everyone can view members"
  ON public.members FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add members"
  ON public.members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Prevent updates and deletes to make members immutable
CREATE POLICY "No one can update members"
  ON public.members FOR UPDATE
  USING (false);

CREATE POLICY "No one can delete members"
  ON public.members FOR DELETE
  USING (false);

-- Create attendances table (immutable)
CREATE TABLE public.attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  present BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE (member_id, date)
);

ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;

-- Attendances policies
CREATE POLICY "Everyone can view attendances"
  ON public.attendances FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can mark attendance"
  ON public.attendances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Prevent updates and deletes to make attendances immutable
CREATE POLICY "No one can update attendances"
  ON public.attendances FOR UPDATE
  USING (false);

CREATE POLICY "No one can delete attendances"
  ON public.attendances FOR DELETE
  USING (false);

-- Create payments table (immutable, admin validation only)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  validated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Everyone can view payments"
  ON public.payments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create payment records"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only admins can validate payments (update validated field)
CREATE POLICY "Only admins can validate payments"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') AND
    validated = true AND
    validated_by = auth.uid()
  );

-- Prevent deletes to make payments immutable
CREATE POLICY "No one can delete payments"
  ON public.payments FOR DELETE
  USING (false);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Migration: 20251104115414
-- Enable realtime for attendances table
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendances;

-- Enable realtime for members table
ALTER PUBLICATION supabase_realtime ADD TABLE public.members;

-- Migration: 20251104120613
-- Make the first registered user an admin automatically
-- Get the first user and make them admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'::app_role)
LIMIT 1;

-- Update RLS policies to allow self-registration for members
DROP POLICY IF EXISTS "Authenticated users can add members" ON public.members;
CREATE POLICY "Users can register themselves as members" 
ON public.members 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Allow admins to update members (for corrections)
DROP POLICY IF EXISTS "No one can update members" ON public.members;
CREATE POLICY "Admins can update members" 
ON public.members 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete members
DROP POLICY IF EXISTS "No one can delete members" ON public.members;
CREATE POLICY "Admins can delete members" 
ON public.members 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Hide payments from non-admins
DROP POLICY IF EXISTS "Everyone can view payments" ON public.payments;
CREATE POLICY "Only admins can view payments" 
ON public.payments 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can create payment records
DROP POLICY IF EXISTS "Authenticated users can create payment records" ON public.payments;
CREATE POLICY "Only admins can create payment records" 
ON public.payments 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = created_by);

-- Allow admins to delete payments (for corrections)
DROP POLICY IF EXISTS "No one can delete payments" ON public.payments;
CREATE POLICY "Admins can delete payments" 
ON public.payments 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete attendance records (for corrections)
DROP POLICY IF EXISTS "No one can delete attendances" ON public.attendances;
CREATE POLICY "Admins can delete attendances" 
ON public.attendances 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update attendance records (for corrections)
DROP POLICY IF EXISTS "No one can update attendances" ON public.attendances;
CREATE POLICY "Admins can update attendances" 
ON public.attendances 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Migration: 20251105112026
-- Fix public profile exposure by restricting to authenticated users
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Users can view their own profile, admins can view all profiles
CREATE POLICY "Users can view own profile or admin can view all" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role)
);

-- Migration: 20251105120137
-- Fix public member exposure by restricting to authenticated users
DROP POLICY IF EXISTS "Everyone can view members" ON public.members;

-- Authenticated users can view all members
CREATE POLICY "Authenticated users can view members" 
ON public.members 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Migration: 20251105120802
-- Fix public attendance exposure by restricting to authenticated users
DROP POLICY IF EXISTS "Everyone can view attendances" ON public.attendances;

-- Authenticated users can view all attendances
CREATE POLICY "Authenticated users can view attendances" 
ON public.attendances 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Migration: 20251107091837
-- Add city column to members table
ALTER TABLE public.members 
ADD COLUMN city TEXT;

-- Migration: 20251108055250
-- Add new group type for Monday and update attendance tracking

-- Step 1: Add new attendance status enum
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent_justified', 'absent_unjustified');

-- Step 2: Add new column with the enum type
ALTER TABLE public.attendances ADD COLUMN status attendance_status;

-- Step 3: Migrate existing data
UPDATE public.attendances 
SET status = CASE 
  WHEN present = true THEN 'present'::attendance_status
  WHEN present = false THEN 'absent_unjustified'::attendance_status
  ELSE 'absent_unjustified'::attendance_status
END;

-- Step 4: Make the new column NOT NULL
ALTER TABLE public.attendances ALTER COLUMN status SET NOT NULL;

-- Step 5: Drop the old boolean column
ALTER TABLE public.attendances DROP COLUMN present;

-- Step 6: Add new group type for Monday
ALTER TYPE public.group_type ADD VALUE 'Lundi' AFTER 'Dimanche';

-- Migration: 20251108092937
-- Create user_groups table to manage group-based access
CREATE TABLE public.user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_type group_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, group_type)
);

-- Enable RLS on user_groups
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;

-- Users can view their own group assignments
CREATE POLICY "Users can view own groups"
ON public.user_groups
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Only admins can manage group assignments
CREATE POLICY "Admins can insert groups"
ON public.user_groups
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update groups"
ON public.user_groups
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete groups"
ON public.user_groups
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update members table RLS policy for SELECT
DROP POLICY IF EXISTS "Authenticated users can view members" ON public.members;

CREATE POLICY "Users can view members in their groups"
ON public.members
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  group_type IN (SELECT group_type FROM public.user_groups WHERE user_id = auth.uid())
);

-- Update attendances table RLS policy for SELECT
DROP POLICY IF EXISTS "Authenticated users can view attendances" ON public.attendances;

CREATE POLICY "Users can view attendances in their groups"
ON public.attendances
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  member_id IN (
    SELECT id FROM public.members 
    WHERE group_type IN (SELECT group_type FROM public.user_groups WHERE user_id = auth.uid())
  )
);

-- Update payments table RLS policy for SELECT
DROP POLICY IF EXISTS "Only admins can view payments" ON public.payments;

CREATE POLICY "Admins and group members can view payments"
ON public.payments
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  member_id IN (
    SELECT id FROM public.members 
    WHERE group_type IN (SELECT group_type FROM public.user_groups WHERE user_id = auth.uid())
  )
);

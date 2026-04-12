-- ==========================================
-- MIGRACIÓN: Separar nombres y apellidos
-- ==========================================

-- Perfiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS second_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS second_last_name text;

-- Terceros
ALTER TABLE public.terceros
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS second_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS second_last_name text;

-- Backfill perfiles desde full_name
WITH parts AS (
  SELECT id, regexp_split_to_array(trim(full_name), '\s+') AS name_parts
  FROM public.profiles
  WHERE full_name IS NOT NULL
)
UPDATE public.profiles p
SET
  first_name = COALESCE(p.first_name, parts.name_parts[1]),
  second_name = COALESCE(p.second_name, CASE WHEN array_length(parts.name_parts, 1) >= 3 THEN parts.name_parts[2] END),
  last_name = COALESCE(
    p.last_name,
    CASE
      WHEN array_length(parts.name_parts, 1) = 2 THEN parts.name_parts[2]
      WHEN array_length(parts.name_parts, 1) >= 3 THEN parts.name_parts[3]
      ELSE NULL
    END
  ),
  second_last_name = COALESCE(
    p.second_last_name,
    CASE
      WHEN array_length(parts.name_parts, 1) >= 4
        THEN array_to_string(parts.name_parts[4:array_length(parts.name_parts, 1)], ' ')
      ELSE NULL
    END
  )
FROM parts
WHERE p.id = parts.id;

-- Backfill terceros desde nombre
WITH parts AS (
  SELECT id, regexp_split_to_array(trim(nombre), '\s+') AS name_parts
  FROM public.terceros
  WHERE nombre IS NOT NULL
)
UPDATE public.terceros t
SET
  first_name = COALESCE(t.first_name, parts.name_parts[1]),
  second_name = COALESCE(t.second_name, CASE WHEN array_length(parts.name_parts, 1) >= 3 THEN parts.name_parts[2] END),
  last_name = COALESCE(
    t.last_name,
    CASE
      WHEN array_length(parts.name_parts, 1) = 2 THEN parts.name_parts[2]
      WHEN array_length(parts.name_parts, 1) >= 3 THEN parts.name_parts[3]
      ELSE NULL
    END
  ),
  second_last_name = COALESCE(
    t.second_last_name,
    CASE
      WHEN array_length(parts.name_parts, 1) >= 4
        THEN array_to_string(parts.name_parts[4:array_length(parts.name_parts, 1)], ' ')
      ELSE NULL
    END
  )
FROM parts
WHERE t.id = parts.id;

-- Actualizar trigger de creación de perfiles para poblar nuevos campos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name text;
  v_parts text[];
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  v_parts := regexp_split_to_array(trim(v_full_name), '\s+');

  INSERT INTO public.profiles (id, full_name, first_name, second_name, last_name, second_last_name, avatar_url, role)
  VALUES (
    NEW.id,
    v_full_name,
    v_parts[1],
    CASE WHEN array_length(v_parts, 1) >= 3 THEN v_parts[2] END,
    CASE
      WHEN array_length(v_parts, 1) = 2 THEN v_parts[2]
      WHEN array_length(v_parts, 1) >= 3 THEN v_parts[3]
      ELSE NULL
    END,
    CASE
      WHEN array_length(v_parts, 1) >= 4
        THEN array_to_string(v_parts[4:array_length(v_parts, 1)], ' ')
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'avatar_url',
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

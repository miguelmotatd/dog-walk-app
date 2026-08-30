-- Helper / auxiliary work registry.
--
-- Lets staff define categories of help needed ("auxiliary works" — e.g.
-- event support, dog food logistics, social media) and lets anyone submit
-- their contact info and pick which categories they're willing to help
-- with. Staff can then look up, per category, who to contact.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."auxiliary_works" (
    "id" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."auxiliary_works" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."helpers" (
    "id" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "email" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "helpers_phone_key" UNIQUE ("phone")
);

ALTER TABLE "public"."helpers" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."helper_auxiliary_works" (
    "helper_id" bigint NOT NULL REFERENCES "public"."helpers"("id") ON DELETE CASCADE,
    "auxiliary_work_id" bigint NOT NULL REFERENCES "public"."auxiliary_works"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    PRIMARY KEY ("helper_id", "auxiliary_work_id")
);

ALTER TABLE "public"."helper_auxiliary_works" OWNER TO "postgres";

ALTER TABLE "public"."auxiliary_works" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."helpers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."helper_auxiliary_works" ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- RPC functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "public"."public_get_active_auxiliary_works"() RETURNS TABLE("id" bigint, "name" "text", "description" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  return query
  select
    w.id,
    w.name,
    w.description
  from public.auxiliary_works w
  where w.is_active = true
  order by w.name asc;
end;
$$;

ALTER FUNCTION "public"."public_get_active_auxiliary_works"() OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."public_get_active_auxiliary_works"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."public_get_active_auxiliary_works"() TO "service_role";
GRANT ALL ON FUNCTION "public"."public_get_active_auxiliary_works"() TO "anon";
GRANT ALL ON FUNCTION "public"."public_get_active_auxiliary_works"() TO "authenticated";


CREATE OR REPLACE FUNCTION "public"."public_register_helper"("p_name" "text", "p_phone" "text", "p_auxiliary_work_ids" bigint[], "p_email" "text" DEFAULT NULL::"text", "p_notes" "text" DEFAULT NULL::"text") RETURNS TABLE("helper_id" bigint, "name" "text", "phone" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_phone_normalized text;
  v_helper_id bigint;
  v_work_id bigint;
begin
  if p_name is null or btrim(p_name) = '' then
    raise exception 'name is required';
  end if;

  if p_phone is null or btrim(p_phone) = '' then
    raise exception 'phone is required';
  end if;

  if p_auxiliary_work_ids is null or array_length(p_auxiliary_work_ids, 1) is null then
    raise exception 'at least one auxiliary work must be selected';
  end if;

  v_phone_normalized := regexp_replace(btrim(p_phone), '[^0-9+]', '', 'g');

  if v_phone_normalized = '' then
    raise exception 'phone is invalid';
  end if;

  insert into public.helpers (name, phone, email, notes, created_at, updated_at)
  values (
    btrim(p_name),
    v_phone_normalized,
    nullif(btrim(p_email), ''),
    nullif(btrim(p_notes), ''),
    now(),
    now()
  )
  on conflict (phone) do update
  set
    name = excluded.name,
    email = coalesce(excluded.email, public.helpers.email),
    notes = coalesce(excluded.notes, public.helpers.notes),
    updated_at = now()
  returning public.helpers.id into v_helper_id;

  foreach v_work_id in array p_auxiliary_work_ids
  loop
    if exists (select 1 from public.auxiliary_works w where w.id = v_work_id and w.is_active = true) then
      insert into public.helper_auxiliary_works (helper_id, auxiliary_work_id, created_at)
      values (v_helper_id, v_work_id, now())
      on conflict do nothing;
    end if;
  end loop;

  return query
  select
    v_helper_id,
    btrim(p_name),
    v_phone_normalized;
end;
$$;

ALTER FUNCTION "public"."public_register_helper"("p_name" "text", "p_phone" "text", "p_auxiliary_work_ids" bigint[], "p_email" "text", "p_notes" "text") OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."public_register_helper"("p_name" "text", "p_phone" "text", "p_auxiliary_work_ids" bigint[], "p_email" "text", "p_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."public_register_helper"("p_name" "text", "p_phone" "text", "p_auxiliary_work_ids" bigint[], "p_email" "text", "p_notes" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."public_register_helper"("p_name" "text", "p_phone" "text", "p_auxiliary_work_ids" bigint[], "p_email" "text", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."public_register_helper"("p_name" "text", "p_phone" "text", "p_auxiliary_work_ids" bigint[], "p_email" "text", "p_notes" "text") TO "authenticated";


-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------

CREATE POLICY "volunteers can read auxiliary works" ON "public"."auxiliary_works" FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "volunteers can insert auxiliary works" ON "public"."auxiliary_works" FOR INSERT TO "authenticated" WITH CHECK (true);
CREATE POLICY "volunteers can update auxiliary works" ON "public"."auxiliary_works" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);
CREATE POLICY "volunteers can delete auxiliary works" ON "public"."auxiliary_works" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "volunteers can read helpers" ON "public"."helpers" FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "volunteers can update helpers" ON "public"."helpers" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);
CREATE POLICY "volunteers can delete helpers" ON "public"."helpers" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "volunteers can read helper auxiliary works" ON "public"."helper_auxiliary_works" FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "volunteers can delete helper auxiliary works" ON "public"."helper_auxiliary_works" FOR DELETE TO "authenticated" USING (true);

-- No anon policies on any of the three tables, and no insert policy on
-- helpers/helper_auxiliary_works either: anon reads active auxiliary works
-- and writes helpers/links only through the SECURITY DEFINER functions above.

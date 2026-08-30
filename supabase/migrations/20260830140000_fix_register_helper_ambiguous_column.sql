-- public_register_helper's RETURNS TABLE has "name" and "phone" output
-- columns, which PL/pgSQL treats as function-local variables. Since the
-- function body also references the bare (unqualified) "name"/"phone"
-- column names in the INSERT ... ON CONFLICT ... SET clause, PL/pgSQL's
-- default variable_conflict = error setting raises "column reference is
-- ambiguous" instead of picking one. Adding the #variable_conflict
-- use_column pragma makes real table columns win over same-named
-- OUT parameters throughout the function body.

CREATE OR REPLACE FUNCTION "public"."public_register_helper"("p_name" "text", "p_phone" "text", "p_auxiliary_work_ids" bigint[], "p_email" "text" DEFAULT NULL::"text", "p_notes" "text" DEFAULT NULL::"text") RETURNS TABLE("helper_id" bigint, "name" "text", "phone" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
#variable_conflict use_column
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

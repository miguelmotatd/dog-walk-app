-- Caminhada (group dog walk) registration, management and checklist support.
--
-- caominhadas / caominhada_dogs / caominhada_reservations already exist with
-- row level security enabled but no policies, so nothing can read or write
-- them yet. This migration adds the policies and the RPC functions the
-- frontend needs.

-- ---------------------------------------------------------------------------
-- RPC functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "public"."public_get_open_caominhada"() RETURNS TABLE("caominhada_id" bigint, "title" "text", "event_date" "date", "start_time" time without time zone, "location" "text", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  return query
  select
    c.id,
    c.title,
    c.event_date,
    c.start_time,
    c.location,
    c.status
  from public.caominhadas c
  where c.status = 'open'
  order by c.event_date asc
  limit 1;
end;
$$;

ALTER FUNCTION "public"."public_get_open_caominhada"() OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."public_get_open_caominhada"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."public_get_open_caominhada"() TO "service_role";
GRANT ALL ON FUNCTION "public"."public_get_open_caominhada"() TO "anon";
GRANT ALL ON FUNCTION "public"."public_get_open_caominhada"() TO "authenticated";


CREATE OR REPLACE FUNCTION "public"."public_get_caominhada_dogs"("p_caominhada_id" bigint) RETURNS TABLE("caominhada_dog_id" bigint, "dog_id" bigint, "dog_name" "text", "dog_size" "text", "dog_sex" "text", "dog_image_url" "text", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if p_caominhada_id is null then
    raise exception 'caominhada id is required';
  end if;

  if not exists (
    select 1
    from public.caominhadas c
    where c.id = p_caominhada_id
      and c.status = 'open'
  ) then
    raise exception 'caminhada not found or not open';
  end if;

  return query
  select
    cd.id,
    d.id,
    d.name,
    d.size,
    d.sex,
    d.image_url,
    cd.status
  from public.caominhada_dogs cd
  join public.dogs d on d.id = cd.dog_id
  where cd.caominhada_id = p_caominhada_id
  order by d.name asc;
end;
$$;

ALTER FUNCTION "public"."public_get_caominhada_dogs"("p_caominhada_id" bigint) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."public_get_caominhada_dogs"("p_caominhada_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."public_get_caominhada_dogs"("p_caominhada_id" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."public_get_caominhada_dogs"("p_caominhada_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."public_get_caominhada_dogs"("p_caominhada_id" bigint) TO "authenticated";


CREATE OR REPLACE FUNCTION "public"."public_register_caominhada"("p_caominhada_dog_id" bigint, "p_person_name" "text", "p_phone" "text", "p_participant_count" integer DEFAULT 1, "p_email" "text" DEFAULT NULL::"text", "p_notes" "text" DEFAULT NULL::"text") RETURNS TABLE("reservation_id" bigint, "caominhada_id" bigint, "dog_id" bigint, "dog_name" "text", "person_name" "text", "participant_count" integer, "reservation_status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_caominhada_id bigint;
  v_dog_id bigint;
  v_dog_name text;
  v_cd_status text;
  v_caominhada_status text;
  v_person_id bigint;
  v_person_public_token text;
  v_phone_normalized text;
  v_reservation_id bigint;
begin
  if p_caominhada_dog_id is null then
    raise exception 'caominhada dog id is required';
  end if;

  if p_person_name is null or btrim(p_person_name) = '' then
    raise exception 'person name is required';
  end if;

  if p_phone is null or btrim(p_phone) = '' then
    raise exception 'phone is required';
  end if;

  if coalesce(p_participant_count, 1) < 1 then
    raise exception 'participant count must be at least 1';
  end if;

  v_phone_normalized := regexp_replace(btrim(p_phone), '[^0-9+]', '', 'g');

  if v_phone_normalized = '' then
    raise exception 'phone is invalid';
  end if;

  /*
    Lock the caominhada_dogs row so two people cannot reserve the same dog
    for the same event at the same time.
  */
  select
    cd.caominhada_id,
    cd.dog_id,
    cd.status,
    d.name
  into
    v_caominhada_id,
    v_dog_id,
    v_cd_status,
    v_dog_name
  from public.caominhada_dogs cd
  join public.dogs d on d.id = cd.dog_id
  where cd.id = p_caominhada_dog_id
  for update;

  if not found then
    raise exception 'dog not found for this caminhada';
  end if;

  select c.status
    into v_caominhada_status
  from public.caominhadas c
  where c.id = v_caominhada_id;

  if v_caominhada_status is distinct from 'open' then
    raise exception 'caminhada is not open for registrations';
  end if;

  if v_cd_status <> 'available' then
    raise exception 'dog is already reserved for this caminhada';
  end if;

  select p.id, p.public_token
    into v_person_id, v_person_public_token
  from public.people p
  where p.phone = v_phone_normalized
  limit 1;

  if v_person_id is null then
    v_person_public_token := replace(gen_random_uuid()::text, '-', '');

    insert into public.people (
      name,
      phone,
      email,
      consent_contact,
      public_token,
      created_at,
      updated_at
    )
    values (
      btrim(p_person_name),
      v_phone_normalized,
      nullif(btrim(p_email), ''),
      true,
      v_person_public_token,
      now(),
      now()
    )
    returning id into v_person_id;
  else
    update public.people
    set
      name = btrim(p_person_name),
      email = coalesce(nullif(btrim(p_email), ''), email),
      updated_at = now()
    where id = v_person_id;
  end if;

  insert into public.caominhada_reservations (
    caominhada_id,
    caominhada_dog_id,
    person_id,
    participant_count,
    payment_status,
    reservation_status,
    notes,
    created_at,
    updated_at
  )
  values (
    v_caominhada_id,
    p_caominhada_dog_id,
    v_person_id,
    coalesce(p_participant_count, 1),
    'pending',
    'reserved',
    nullif(btrim(p_notes), ''),
    now(),
    now()
  )
  returning public.caominhada_reservations.id
  into v_reservation_id;

  update public.caominhada_dogs
  set
    status = 'reserved',
    updated_at = now()
  where id = p_caominhada_dog_id;

  return query
  select
    v_reservation_id,
    v_caominhada_id,
    v_dog_id,
    v_dog_name,
    btrim(p_person_name),
    coalesce(p_participant_count, 1),
    'reserved'::text;
end;
$$;

ALTER FUNCTION "public"."public_register_caominhada"("p_caominhada_dog_id" bigint, "p_person_name" "text", "p_phone" "text", "p_participant_count" integer, "p_email" "text", "p_notes" "text") OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."public_register_caominhada"("p_caominhada_dog_id" bigint, "p_person_name" "text", "p_phone" "text", "p_participant_count" integer, "p_email" "text", "p_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."public_register_caominhada"("p_caominhada_dog_id" bigint, "p_person_name" "text", "p_phone" "text", "p_participant_count" integer, "p_email" "text", "p_notes" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."public_register_caominhada"("p_caominhada_dog_id" bigint, "p_person_name" "text", "p_phone" "text", "p_participant_count" integer, "p_email" "text", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."public_register_caominhada"("p_caominhada_dog_id" bigint, "p_person_name" "text", "p_phone" "text", "p_participant_count" integer, "p_email" "text", "p_notes" "text") TO "authenticated";


CREATE OR REPLACE FUNCTION "public"."set_caominhada_reservation_status"("p_reservation_id" bigint, "p_new_status" "text") RETURNS TABLE("reservation_id" bigint, "caominhada_dog_id" bigint, "reservation_status" "text")
    LANGUAGE "plpgsql"
    AS $$
declare
  v_caominhada_dog_id bigint;
  v_current_dog_status text;
begin
  if p_new_status not in ('reserved', 'checked_in', 'cancelled', 'no_show') then
    raise exception 'invalid reservation status';
  end if;

  select r.caominhada_dog_id
    into v_caominhada_dog_id
  from caominhada_reservations r
  where r.id = p_reservation_id
  for update;

  if not found then
    raise exception 'reservation not found';
  end if;

  update caominhada_reservations
  set
    reservation_status = p_new_status,
    updated_at = now()
  where id = p_reservation_id;

  select cd.status
    into v_current_dog_status
  from caominhada_dogs cd
  where cd.id = v_caominhada_dog_id
  for update;

  -- Freeing/reserving the dog mirrors the dog/walk status coupling in edit_walk.
  if p_new_status in ('cancelled', 'no_show') and v_current_dog_status = 'reserved' then
    update caominhada_dogs
    set status = 'available', updated_at = now()
    where id = v_caominhada_dog_id;
  end if;

  if p_new_status in ('reserved', 'checked_in') and v_current_dog_status = 'available' then
    update caominhada_dogs
    set status = 'reserved', updated_at = now()
    where id = v_caominhada_dog_id;
  end if;

  return query
  select
    p_reservation_id,
    v_caominhada_dog_id,
    p_new_status;
end;
$$;

ALTER FUNCTION "public"."set_caominhada_reservation_status"("p_reservation_id" bigint, "p_new_status" "text") OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."set_caominhada_reservation_status"("p_reservation_id" bigint, "p_new_status" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_caominhada_reservation_status"("p_reservation_id" bigint, "p_new_status" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."set_caominhada_reservation_status"("p_reservation_id" bigint, "p_new_status" "text") TO "authenticated";


CREATE OR REPLACE FUNCTION "public"."delete_caominhada_reservation"("p_reservation_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_caominhada_dog_id bigint;
  v_current_dog_status text;
begin
  select r.caominhada_dog_id
    into v_caominhada_dog_id
  from caominhada_reservations r
  where r.id = p_reservation_id
  for update;

  if not found then
    raise exception 'reservation not found';
  end if;

  delete from caominhada_reservations
  where id = p_reservation_id;

  select cd.status
    into v_current_dog_status
  from caominhada_dogs cd
  where cd.id = v_caominhada_dog_id
  for update;

  if v_current_dog_status = 'reserved' then
    update caominhada_dogs
    set status = 'available', updated_at = now()
    where id = v_caominhada_dog_id;
  end if;
end;
$$;

ALTER FUNCTION "public"."delete_caominhada_reservation"("p_reservation_id" bigint) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."delete_caominhada_reservation"("p_reservation_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_caominhada_reservation"("p_reservation_id" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."delete_caominhada_reservation"("p_reservation_id" bigint) TO "authenticated";


-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------

CREATE POLICY "volunteers can read caominhadas" ON "public"."caominhadas" FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "volunteers can insert caominhadas" ON "public"."caominhadas" FOR INSERT TO "authenticated" WITH CHECK (true);
CREATE POLICY "volunteers can update caominhadas" ON "public"."caominhadas" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);

CREATE POLICY "volunteers can read caominhada dogs" ON "public"."caominhada_dogs" FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "volunteers can insert caominhada dogs" ON "public"."caominhada_dogs" FOR INSERT TO "authenticated" WITH CHECK (true);
CREATE POLICY "volunteers can update caominhada dogs" ON "public"."caominhada_dogs" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);
CREATE POLICY "volunteers can delete caominhada dogs" ON "public"."caominhada_dogs" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "volunteers can read caominhada reservations" ON "public"."caominhada_reservations" FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "volunteers can update caominhada reservations" ON "public"."caominhada_reservations" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);
CREATE POLICY "volunteers can delete caominhada reservations" ON "public"."caominhada_reservations" FOR DELETE TO "authenticated" USING (true);

-- No anon policies on any of the three tables: anon reads/writes only through
-- the SECURITY DEFINER functions above. No insert policy on
-- caominhada_reservations either: both the public form and the volunteer
-- "add manually" form insert through public_register_caominhada.

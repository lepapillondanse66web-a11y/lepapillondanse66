-- ============================================================================
-- Clases de danza en horario fijo (pedido de Zulgey, 18/11/2026)
-- Las clases de danza solo se pueden reservar en los horarios de las clases
-- (lunes 18:00–19:15 y miércoles 11:00–12:00 en la Salle Sweet Om), son
-- grupales (varias alumnas en la misma clase, hasta el cupo) y presenciales.
-- El resto de los servicios sigue usando el "Horario de atención".
-- Se corre una sola vez, después de 20261031000000_reglas_zulgey.sql
-- ============================================================================

create table public.class_slots (
  id         uuid primary key default gen_random_uuid(),
  weekday    smallint not null check (weekday between 1 and 7),
  start_time time not null,
  end_time   time not null check (end_time > start_time),
  capacity   int not null default 12 check (capacity between 1 and 200)
);

alter table public.class_slots enable row level security;
create policy "admin class_slots" on public.class_slots
  for all using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.class_slots to authenticated, service_role;

insert into public.class_slots (weekday, start_time, end_time) values
  (1, '18:00', '19:15'),
  (3, '11:00', '12:00');

-- Las clases son presenciales
update public.services set online = false where category = 'dance';

-- Una reserva de clase no "ocupa" la agenda como una sesión individual:
-- varias alumnas pueden reservar la misma clase
alter table public.bookings add column is_class boolean not null default false;
update public.bookings b set is_class = true
  from public.services s where s.id = b.service_id and s.category = 'dance';

alter table public.bookings drop constraint bookings_no_overlap;
alter table public.bookings add constraint bookings_no_overlap exclude using gist (
  tstzrange(starts_at, ends_at) with &&
) where (service_id is not null and status <> 'cancelled' and not is_class);

-- Lo ocupado para las sesiones individuales: igual que antes, más el horario
-- de las clases (Zulgey está dando clase) y sin contar las reservas de clase
create or replace function public.busy_ranges(p_from timestamptz, p_to timestamptz)
returns table (range tstzrange)
language sql stable security definer set search_path = public as $$
  with s as (select timezone as tz from settings where id = 1),
  days as (
    select d::date as day
      from s, generate_series((p_from at time zone s.tz)::date::timestamp,
                              (p_to   at time zone s.tz)::date::timestamp, interval '1 day') d
  )
  select tstzrange(b.starts_at, b.ends_at)
    from bookings b
   where b.service_id is not null and b.status <> 'cancelled' and not b.is_class
     and b.starts_at < p_to and b.ends_at > p_from
  union all
  select tstzrange(e.starts_at, e.ends_at)
    from events e
   where e.blocks_agenda and e.starts_at < p_to and e.ends_at > p_from
  union all
  select tstzrange(k.starts_at, k.ends_at)
    from blocks k
   where k.starts_at < p_to and k.ends_at > p_from
  union all
  select tstzrange((days.day + r.start_time) at time zone s.tz,
                   (days.day + r.end_time)   at time zone s.tz)
    from s, days join recurring_blocks r on r.weekday = extract(isodow from days.day)
  union all
  select tstzrange((days.day + c.start_time) at time zone s.tz,
                   (days.day + c.end_time)   at time zone s.tz)
    from s, days join class_slots c on c.weekday = extract(isodow from days.day)
$$;

-- Horarios libres. Para las clases de danza: los días y horas de las clases,
-- mientras quede cupo y no haya un bloqueo puntual (vacaciones, feriado…).
create or replace function public.available_slots(p_service_key text, p_from date, p_to date)
returns table (starts_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare
  st      settings;
  svc     services;
  v_today date;
  v_from  date;
  v_to    date;
begin
  select * into st from settings where id = 1;
  select * into svc from services where key = p_service_key and active;
  if not found then return; end if;

  v_today := (now() at time zone st.timezone)::date;
  v_from  := greatest(p_from, v_today);
  v_to    := least(p_to, v_today + st.max_days_ahead, v_from + 62);
  if v_to < v_from then return; end if;

  if svc.category = 'dance' then
    return query
    with classes as (
      select (d::date + c.start_time) at time zone st.timezone as c_start,
             (d::date + c.end_time)   at time zone st.timezone as c_end,
             c.capacity
        from generate_series(v_from::timestamp, v_to::timestamp, interval '1 day') d
        join class_slots c on c.weekday = extract(isodow from d)
    )
    select k.c_start
      from classes k
     where k.c_start >= now() + make_interval(hours => st.min_notice_hours)
       and not exists (
         select 1 from blocks b
          where tstzrange(b.starts_at, b.ends_at) && tstzrange(k.c_start, k.c_end))
       and (select count(*) from bookings x
             where x.is_class and x.status <> 'cancelled' and x.starts_at = k.c_start) < k.capacity
     order by k.c_start;
    return;
  end if;

  return query
  with windows as (
    select (d::date + a.start_time) at time zone st.timezone as w_start,
           (d::date + a.end_time)   at time zone st.timezone as w_end
      from generate_series(v_from::timestamp, v_to::timestamp, interval '1 day') d
      join availability a on a.weekday = extract(isodow from d)
  ),
  candidates as (
    select gs as slot
      from windows w,
           generate_series(w.w_start,
                           w.w_end - make_interval(mins => svc.minutes),
                           make_interval(mins => st.slot_step_minutes)) gs
  ),
  busy as (
    select range from busy_ranges(
      (v_from::timestamp at time zone st.timezone) - interval '1 day',
      (v_to::timestamp   at time zone st.timezone) + interval '2 day')
  )
  select distinct c.slot
    from candidates c
   where c.slot >= now() + make_interval(hours => st.min_notice_hours)
     and not exists (
       select 1 from busy b
        where b.range && tstzrange(
          c.slot - make_interval(mins => st.buffer_minutes),
          c.slot + make_interval(mins => svc.minutes + st.buffer_minutes))
     )
   order by c.slot;
end $$;

-- Reserva: una clase dura lo que dura la clase (no los minutos del servicio)
create or replace function public.create_booking(
  p_service_key text,
  p_starts_at   timestamptz,
  p_name        text,
  p_email       text,
  p_phone       text,
  p_lang        text,
  p_notes       text
) returns public.bookings
language plpgsql volatile security definer set search_path = public as $$
declare
  st    settings;
  svc   services;
  b     bookings;
  v_day date;
  v_end timestamptz;
begin
  perform pg_advisory_xact_lock(hashtext('papillon-bookings'));

  select * into st from settings where id = 1;
  select * into svc from services where key = p_service_key and active;
  if not found then raise exception 'service_not_found'; end if;

  v_day := (p_starts_at at time zone st.timezone)::date;
  if not exists (
    select 1 from available_slots(p_service_key, v_day, v_day) s
     where s.starts_at = p_starts_at
  ) then
    raise exception 'slot_unavailable';
  end if;

  v_end := p_starts_at + make_interval(mins => svc.minutes);
  if svc.category = 'dance' then
    select (v_day + c.end_time) at time zone st.timezone into v_end
      from class_slots c
     where c.weekday = extract(isodow from v_day)
       and (v_day + c.start_time) at time zone st.timezone = p_starts_at
     limit 1;
  end if;

  insert into bookings (service_id, starts_at, ends_at, status, price, is_class,
                        client_name, client_email, client_phone, lang, notes)
  values (svc.id, p_starts_at, v_end,
          case when svc.price > 0 then 'pending_payment' else 'confirmed' end::booking_status,
          svc.price, svc.category = 'dance',
          trim(p_name), lower(trim(p_email)), nullif(trim(p_phone), ''),
          coalesce(nullif(p_lang, ''), 'fr'), nullif(trim(p_notes), ''))
  returning * into b;
  return b;
end $$;

revoke execute on function public.create_booking(text, timestamptz, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_booking(text, timestamptz, text, text, text, text, text) to service_role;
grant execute on function public.available_slots(text, date, date) to anon, authenticated;

-- Si Zulgey carga una reserva a mano desde el panel, también se marca como clase
create function public.bookings_set_is_class() returns trigger
language plpgsql as $$
begin
  if new.service_id is not null then
    select s.category = 'dance' into new.is_class from services s where s.id = new.service_id;
  end if;
  return new;
end $$;

create trigger bookings_set_is_class before insert or update of service_id on public.bookings
  for each row execute function public.bookings_set_is_class();

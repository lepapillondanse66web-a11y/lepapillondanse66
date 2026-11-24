// Clases de danza en horario fijo: npm run test:clases
import { PGlite } from '@electric-sql/pglite'
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist'
import { readFileSync } from 'node:fs'

const db = new PGlite({ extensions: { btree_gist } })
await db.exec(`
  create role anon; create role authenticated; create role service_role;
  create schema auth; create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  set timezone = 'UTC';`)
for (const f of ['20261030000000_reservas', '20261031000000_reglas_zulgey', '20261118000000_clases_danza'])
  await db.exec(readFileSync(new URL(`../migrations/${f}.sql`, import.meta.url), 'utf8'))

const q = async (sql, p) => (await db.query(sql, p)).rows
let fails = 0
const ok = (c, m) => { console.log(c ? '✔' : '✘', m); if (!c) fails++ }
const err = async (sql, p, code, m) => { try { await db.query(sql, p); ok(false, m + ' (sin error)') } catch (e) { ok(e.message.includes(code), `${m} → ${e.message}`) } }
const hm = (r) => r.map((x) => new Date(x.starts_at).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit' }))

const [{ mon }] = await q(`select (date_trunc('week', (now() at time zone 'Europe/Paris')::date + 7))::date::text as mon`)
const day = async (n) => (await q(`select ($1::date + $2::int)::text d`, [mon, n]))[0].d
const wed = await day(2), sat = await day(5), sun = await day(6)

const week = hm(await q(`select starts_at from available_slots('orientalIntuitive', $1, $2)`, [mon, sun]))
ok(week.length === 2 && week[0].includes('18:00') && week[1].includes('11:00'), `danza: solo lunes 18:00 y miércoles 11:00 → ${week.join(' | ')}`)
ok((await q(`select * from available_slots('orientalIntuitive', $1, $1)`, [sat])).length === 0, 'danza: sábado sin turnos')
ok((await q(`select * from available_slots('tarot', $1, $1)`, [sat])).length > 0, 'tarot sigue con turnos el sábado')

const slot = `${mon} 18:00 Europe/Paris`
const [a] = await q(`select * from create_booking('orientalIntuitive', $1::timestamptz, 'Ana', 'a@m.com', '', 'es', '')`, [slot])
const [b] = await q(`select * from create_booking('intuitiveDance', $1::timestamptz, 'Bea', 'b@m.com', '', 'fr', '')`, [slot])
ok(a.is_class && b.is_class, 'dos alumnas reservan la misma clase')
ok(new Date(a.ends_at).toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris' }).startsWith('19:15'), 'la reserva termina a las 19:15')
await err(`select * from create_booking('orientalIntuitive', $1::timestamptz, 'X', 'x@m.com', '', 'fr', '')`, [`${sat} 18:00 Europe/Paris`], 'slot_unavailable', 'sábado 18:00 rechazado')

await q(`update class_slots set capacity = 2 where weekday = 1`)
ok(!(hm(await q(`select starts_at from available_slots('orientalIntuitive', $1, $1)`, [mon]))).length, 'clase llena (cupo 2) ya no se ofrece')
await err(`select * from create_booking('orientalIntuitive', $1::timestamptz, 'C', 'c@m.com', '', 'fr', '')`, [slot], 'slot_unavailable', 'tercera alumna rechazada')
await q(`update bookings set status='cancelled' where id=$1`, [a.id])
ok(hm(await q(`select starts_at from available_slots('orientalIntuitive', $1, $1)`, [mon])).length === 1, 'al cancelar se libera el lugar')

await q(`insert into blocks (starts_at, ends_at, label) values ($1::timestamptz, $1::timestamptz + interval '1 day', 'feriado')`, [`${wed} 00:00 Europe/Paris`])
ok((await q(`select * from available_slots('orientalIntuitive', $1, $1)`, [wed])).length === 0, 'bloqueo puntual saca la clase del miércoles')

const [man] = await q(`insert into bookings (service_id, starts_at, ends_at, status, client_name, client_email)
  select id, $1::timestamptz, $1::timestamptz + interval '75 min', 'paid', 'Panel', 'p@m.com' from services where key='pilatesOnline' returning is_class`, [slot])
ok(man.is_class, 'reserva cargada desde el panel queda como clase (no choca)')

console.log(fails ? `\n${fails} fallas` : '\nTodo bien')
process.exit(fails ? 1 : 0)

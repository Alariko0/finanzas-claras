-- FinanzasClaras - esquema inicial
-- Todas las tablas de usuario tienen RLS: cada usuario solo accede a sus filas.

-- ───────────── utilidades ─────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ───────────── profiles ─────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 2 and 50),
  preferencias jsonb not null default jsonb_build_object(
    'modulo_hipotecas', true,
    'modulo_inversion', true,
    'modulo_viajes', true,
    'modulo_jubilacion', true
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea el perfil al registrarse (el nombre llega en raw_user_meta_data.nombre)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nombre)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- Solo el trigger puede ejecutarla
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── calculos ─────────────
create table public.calculos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (tipo in (
    'irpf', 'nomina', 'hipoteca', 'prestamo', 'amortizacion',
    'inversion_inmobiliaria', 'inversion_mobiliaria', 'jubilacion', 'pensiones',
    'gastos', 'presupuesto', 'viaje'
  )),
  titulo text not null check (char_length(titulo) between 1 and 100),
  datos_entrada jsonb not null check (jsonb_typeof(datos_entrada) = 'object'),
  resultado jsonb not null check (jsonb_typeof(resultado) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index calculos_user_created_idx on public.calculos (user_id, created_at desc);
create trigger calculos_updated_at before update on public.calculos
  for each row execute function public.set_updated_at();

-- ───────────── prestamos ─────────────
create table public.prestamos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('hipoteca', 'personal', 'coche', 'consumo')),
  nombre text not null check (char_length(nombre) between 1 and 100),
  capital numeric(14, 2) not null check (capital > 0),
  tasa_anual numeric(7, 4) not null check (tasa_anual >= 0 and tasa_anual <= 100),
  plazo_meses integer not null check (plazo_meses between 1 and 1200),
  fecha_inicio date,
  comision_apertura numeric(14, 2) not null default 0 check (comision_apertura >= 0),
  amortizaciones jsonb not null default '[]'::jsonb check (jsonb_typeof(amortizaciones) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index prestamos_user_idx on public.prestamos (user_id, created_at desc);
create trigger prestamos_updated_at before update on public.prestamos
  for each row execute function public.set_updated_at();

-- ───────────── activos ─────────────
create table public.activos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('inmueble', 'accion', 'fondo', 'cripto', 'deposito', 'plan_pensiones', 'otro')),
  nombre text not null check (char_length(nombre) between 1 and 100),
  valor_actual numeric(16, 2) not null check (valor_actual >= 0),
  coste_adquisicion numeric(16, 2) check (coste_adquisicion >= 0),
  fecha_adquisicion date,
  datos jsonb not null default '{}'::jsonb check (jsonb_typeof(datos) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index activos_user_idx on public.activos (user_id, created_at desc);
create trigger activos_updated_at before update on public.activos
  for each row execute function public.set_updated_at();

-- ───────────── notificaciones ─────────────
create table public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('info', 'alerta', 'recordatorio')),
  titulo text not null check (char_length(titulo) between 1 and 150),
  mensaje text not null check (char_length(mensaje) <= 1000),
  leida boolean not null default false,
  created_at timestamptz not null default now()
);
create index notificaciones_user_idx on public.notificaciones (user_id, created_at desc);

-- ───────────── gastos_familiares ─────────────
create table public.gastos_familiares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  concepto text not null check (char_length(concepto) between 1 and 150),
  categoria text not null check (char_length(categoria) between 1 and 50),
  importe numeric(12, 2) not null check (importe >= 0),
  fecha date not null default current_date,
  recurrente boolean not null default false,
  created_at timestamptz not null default now()
);
create index gastos_user_fecha_idx on public.gastos_familiares (user_id, fecha desc);

-- ───────────── presupuestos ─────────────
create table public.presupuestos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 100),
  ingreso_mensual numeric(12, 2) not null check (ingreso_mensual >= 0),
  partidas jsonb not null default '[]'::jsonb check (jsonb_typeof(partidas) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index presupuestos_user_idx on public.presupuestos (user_id, created_at desc);
create trigger presupuestos_updated_at before update on public.presupuestos
  for each row execute function public.set_updated_at();

-- ───────────── viajes ─────────────
create table public.viajes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 100),
  participantes jsonb not null default '[]'::jsonb check (jsonb_typeof(participantes) = 'array'),
  gastos jsonb not null default '[]'::jsonb check (jsonb_typeof(gastos) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index viajes_user_idx on public.viajes (user_id, created_at desc);
create trigger viajes_updated_at before update on public.viajes
  for each row execute function public.set_updated_at();

-- ───────────── RLS ─────────────
alter table public.profiles enable row level security;
alter table public.calculos enable row level security;
alter table public.prestamos enable row level security;
alter table public.activos enable row level security;
alter table public.notificaciones enable row level security;
alter table public.gastos_familiares enable row level security;
alter table public.presupuestos enable row level security;
alter table public.viajes enable row level security;

-- profiles: solo ver y editar el propio (la fila la crea el trigger)
create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- resto de tablas: CRUD solo sobre filas propias
do $$
declare
  t text;
begin
  foreach t in array array['calculos', 'prestamos', 'activos', 'notificaciones',
                           'gastos_familiares', 'presupuestos', 'viajes']
  loop
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t || '_select_own', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t || '_insert_own', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t || '_update_own', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t || '_delete_own', t);
  end loop;
end $$;

-- el rol anónimo no toca nada
revoke all on all tables in schema public from anon;

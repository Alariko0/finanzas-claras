-- FinanzasClaras - nóminas mensuales (recibo de salarios concepto a concepto)
-- `datos` guarda el recibo normalizado (encabezado, devengos, deducciones y bases) y `totales`
-- lo que calcula el servidor a partir de él. Alimentan IRPF, Gastos y Plan de pensiones.
-- Un recibo ordinario y uno de paga extra por mes y usuario como máximo.

create table public.nominas_mensuales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  anio smallint not null check (anio between 2000 and 2100),
  mes smallint not null check (mes between 1 and 12),
  tipo text not null default 'ordinaria' check (tipo in ('ordinaria', 'extra')),
  fecha_cobro date,
  datos jsonb not null check (jsonb_typeof(datos) = 'object'),
  totales jsonb not null check (jsonb_typeof(totales) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, anio, mes, tipo)
);

-- La restricción unique (user_id, anio, mes, tipo) ya sirve de índice para listar por periodo.

create trigger nominas_mensuales_updated_at before update on public.nominas_mensuales
  for each row execute function public.set_updated_at();

alter table public.nominas_mensuales enable row level security;

create policy nominas_mensuales_select_own on public.nominas_mensuales
  for select to authenticated using ((select auth.uid()) = user_id);
create policy nominas_mensuales_insert_own on public.nominas_mensuales
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy nominas_mensuales_update_own on public.nominas_mensuales
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy nominas_mensuales_delete_own on public.nominas_mensuales
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.nominas_mensuales from anon;

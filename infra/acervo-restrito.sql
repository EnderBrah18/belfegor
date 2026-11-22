begin;
create schema if not exists belfegor_private;
revoke all on schema belfegor_private from public, anon, authenticated;

create table belfegor_private.funcionarios (
  usuario uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  identificador text unique not null,
  profissao text not null,
  departamento text not null,
  patente smallint not null check (patente between 0 and 6),
  na smallint not null check (na between 0 and 4),
  ativo boolean not null default false
);
create table belfegor_private.documentos (
  codigo text primary key,
  titulo text not null,
  revisao text not null,
  publicado boolean not null default false,
  listado boolean not null default false
);
create table belfegor_private.bloqueios (
  usuario uuid references belfegor_private.funcionarios(usuario) on delete cascade,
  codigo text references belfegor_private.documentos(codigo) on delete cascade,
  primary key (usuario, codigo)
);
create table belfegor_private.blocos (
  codigo text references belfegor_private.documentos(codigo) on delete cascade,
  ordem integer not null,
  na_minimo smallint not null check (na_minimo between 0 and 4),
  departamento text,
  texto text,
  imagem bytea,
  mime text,
  descricao text,
  primary key (codigo, ordem),
  check (
    (texto is not null and imagem is null and mime is null and descricao is null)
    or (texto is null and imagem is not null and mime is not null
        and mime in ('image/png', 'image/jpeg', 'image/webp')
        and octet_length(imagem) between 1 and 2097152
        and descricao is not null)
  )
);
revoke all on all tables in schema belfegor_private from public, anon, authenticated;
alter table belfegor_private.funcionarios enable row level security;
alter table belfegor_private.documentos enable row level security;
alter table belfegor_private.bloqueios enable row level security;
alter table belfegor_private.blocos enable row level security;

create function public.belfegor_catalogo()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select case when exists (
    select 1 from belfegor_private.funcionarios f where f.usuario = auth.uid() and f.ativo
  ) then coalesce((
    select jsonb_agg(jsonb_build_object('codigo', d.codigo, 'titulo', d.titulo) order by d.codigo)
    from belfegor_private.documentos d where d.publicado and d.listado
  ), '[]'::jsonb) end;
$$;

create function public.belfegor_documento(referencia text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select case when exists (
    select 1 from belfegor_private.bloqueios x where x.usuario = f.usuario and x.codigo = d.codigo
  ) then jsonb_build_object('bloqueado', true)
  else jsonb_build_object(
    'titulo', d.titulo, 'revisao', d.revisao, 'blocos', coalesce((
      select jsonb_agg(
        case when f.na >= b.na_minimo and (b.departamento is null or b.departamento = f.departamento)
          then case when b.imagem is null then jsonb_build_object('texto', b.texto)
            else jsonb_build_object('imagem', encode(b.imagem, 'base64'), 'mime', b.mime, 'descricao', b.descricao) end
          else jsonb_build_object('restrito', true, 'tipo', case when b.imagem is null then 'texto' else 'imagem' end)
        end order by b.ordem
      ) from belfegor_private.blocos b where b.codigo = d.codigo
    ), '[]'::jsonb)
  ) end
  from belfegor_private.funcionarios f
  cross join belfegor_private.documentos d
  where f.usuario = auth.uid() and f.ativo and d.publicado and d.codigo = upper(trim(referencia));
$$;

revoke all on function public.belfegor_catalogo(), public.belfegor_documento(text) from public, anon, authenticated;
grant execute on function public.belfegor_catalogo(), public.belfegor_documento(text) to authenticated;
commit;

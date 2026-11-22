import { contaEditorial, visivel } from './visibilidade.js?v=3';
import { chaveSessao } from './credenciais.js?v=3';

const $ = id => document.getElementById(id);
const filtros = $('filtros-comunicados');
const categorias = [...document.querySelectorAll('[data-categoria]')];
const tamanho = 10;
let catalogo = [];
let conta = null;
let lidos = new Set();
let categoria = '';
let pagina = 0;
let consulta = 0;
let criterios = new FormData(filtros);

function elemento(tag, conteudo, classe) {
  const el = document.createElement(tag);
  if (conteudo !== undefined) el.textContent = conteudo;
  if (classe) el.className = classe;
  return el;
}

const normalizar = texto => texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
const chaveLeitura = () => 'belfegor-comunicados-lidos:' + (conta?.usuario ?? 'visitante');

function marcaLeitura(codigo) {
  if (lidos.has(codigo)) return;
  lidos.add(codigo);
  try { localStorage.setItem(chaveLeitura(), JSON.stringify([...lidos])); } catch {}
  for (const linha of document.querySelectorAll('[data-comunicado]')) {
    if (linha.dataset.comunicado === codigo) linha.dataset.novo = 'false';
  }
  resumo();
}

function linha(aviso, fixado = false) {
  const el = elemento('details', undefined, 'intercom-row');
  el.dataset.comunicado = aviso.codigo;
  el.dataset.novo = String(!lidos.has(aviso.codigo));
  el.dataset.arquivado = String(Boolean(aviso.arquivado));
  const resumo = elemento('summary');
  const ponto = elemento('span', undefined, 'com-dot');
  ponto.setAttribute('aria-hidden', 'true');
  const texto = elemento('span', undefined, 'com-text');
  texto.append(elemento('strong', aviso.titulo), elemento('small', aviso.resumo ?? ''));
  const etiqueta = fixado ? 'Prioridade: ' + (aviso.prioridade ?? 'Rotina') : aviso.arquivado ? 'Arquivado' : aviso.categoria ?? 'Oficiais';
  resumo.append(ponto, elemento('code', aviso.codigo), texto, elemento('small', etiqueta, 'intercom-tag'));

  const corpo = elemento('div', undefined, 'intercom-row-body');
  corpo.append(elemento('p', [aviso.setor, aviso.referencia, aviso.situacao].filter(Boolean).join(' · ')));
  if (aviso.href) {
    const link = elemento('a', 'Consultar documento');
    link.href = aviso.href;
    corpo.append(link);
  }
  el.append(resumo, corpo);
  el.addEventListener('toggle', () => { if (el.open) marcaLeitura(aviso.codigo); });
  return el;
}

function resumo() {
  const valores = [
    ['Não lidos', catalogo.filter(r => !lidos.has(r.codigo)).length],
    ['Prioridade alta', catalogo.filter(r => r.prioridade === 'Alta').length],
    ['Prioridade média', catalogo.filter(r => r.prioridade === 'Média').length],
    ['Atualizações operacionais', catalogo.filter(r => r.categoria === 'Operacionais').length],
    ['Arquivados', catalogo.filter(r => r.arquivado).length]
  ];
  $('resumo-comunicados').replaceChildren(...valores.map(([nome, total]) => {
    const item = elemento('div');
    item.append(elemento('dt', nome), elemento('dd', String(total)));
    return item;
  }));
}

function corresponde(item) {
  const busca = normalizar(criterios.get('busca') ?? '');
  const grupos = [['periodo','edicao'],['prioridade','prioridade'],['setor','setor'],['status','situacao']];
  return (!categoria || (categoria === 'Arquivados' ? item.arquivado : item.categoria === categoria)) &&
    grupos.every(([campo, chave]) => !criterios.get(campo) || item[chave] === criterios.get(campo)) &&
    normalizar([item.codigo, item.titulo, item.resumo, item.setor].filter(Boolean).join(' ')).includes(busca);
}

function listar() {
  const itens = catalogo.filter(corresponde);
  const inicio = pagina * tamanho;
  const exibidos = itens.slice(inicio, inicio + tamanho);
  $('lista-comunicados').replaceChildren(...(exibidos.length ? exibidos.map(item => linha(item)) : [elemento('p', 'Nenhum comunicado corresponde à consulta.', 'intercom-empty')]));
  $('contagem').textContent = itens.length ? 'Exibindo ' + (inicio + 1) + '–' + (inicio + exibidos.length) + ' de ' + itens.length : '0 resultados';
  $('anterior').disabled = pagina === 0;
  $('proxima').disabled = inicio + tamanho >= itens.length;
}

async function carregar() {
  const atual = ++consulta;
  catalogo = [];
  pagina = 0;
  for (const id of ['fixados','lista-comunicados','resumo-comunicados','intercom-destaque']) $(id).replaceChildren();
  $('intercom-na').textContent = 'Consultando credencial…';
  try {
    const [resposta, perfil] = await Promise.all([fetch('dados/comunicados.json', {cache:'no-store'}), contaEditorial()]);
    if (!resposta.ok) throw new Error('Catálogo indisponível');
    const dados = await resposta.json();
    if (atual !== consulta) return;
    conta = perfil;
    catalogo = dados.filter(item => visivel(item, conta));
    try { lidos = new Set(JSON.parse(localStorage.getItem(chaveLeitura()) ?? '[]')); } catch { lidos = new Set(); }
    for (const [campo, chave] of [['setor','setor'],['status','situacao']]) {
      const select = filtros.elements[campo];
      const valores = [...new Set(catalogo.map(item => item[chave]).filter(Boolean))].sort();
      select.replaceChildren(select.options[0], ...valores.map(valor => new Option(valor, valor)));
    }
    filtros.reset();
    criterios = new FormData(filtros);
    pagina = 0;
    const fixados = catalogo.filter(item => item.fixado);
    $('fixados').replaceChildren(...(fixados.length ? fixados.map(item => linha(item, true)) : [elemento('p', 'Nenhum comunicado fixado.', 'intercom-empty')]));
    $('intercom-na').textContent = conta ? 'Seu NA atual: ' + conta.acesso : 'Acesso público · Visitante';

    const destaque = catalogo.find(item => item.destaque);
    if (destaque) $('intercom-destaque').append(linha(destaque));
    else $('intercom-destaque').append(elemento('p', 'Nenhum comunicado especial.'));
    resumo();
    listar();
  } catch {
    if (atual !== consulta) return;
    $('intercom-na').textContent = 'Credencial indisponível.';
    $('lista-comunicados').append(elemento('p', 'Não foi possível carregar os comunicados.', 'intercom-empty'));
  }
}

for (const botao of categorias) botao.addEventListener('click', () => {
  categoria = botao.dataset.categoria;
  categorias.forEach(item => item.setAttribute('aria-pressed', String(item === botao)));
  pagina = 0;
  listar();
});
filtros.addEventListener('submit', evento => {
  evento.preventDefault();
  criterios = new FormData(filtros);
  pagina = 0;
  listar();
});
filtros.addEventListener('reset', () => queueMicrotask(() => {
  criterios = new FormData(filtros);
  pagina = 0;
  listar();
}));
$('anterior').addEventListener('click', () => { if (pagina > 0) pagina--; listar(); });
$('proxima').addEventListener('click', () => { if ((pagina + 1) * tamanho < catalogo.filter(corresponde).length) pagina++; listar(); });
addEventListener('pageshow', evento => { if (evento.persisted) carregar(); });
addEventListener('storage', evento => { if (!evento.key || evento.key === chaveSessao) carregar(); });
document.querySelector('[data-bf-logout]').addEventListener('click', () => queueMicrotask(carregar));
carregar();

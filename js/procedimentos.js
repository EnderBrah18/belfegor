import { contaEditorial, visivel } from './visibilidade.js?v=3';
import { chaveSessao } from './credenciais.js?v=3';

const $ = id => document.getElementById(id);
const form = $('proc-filtros');
const busca = $('proc-busca');
const ordem = $('proc-ordem');
const secoes = ['Operação Geral','Pesquisa e Análise','Engenharia','Contenção','Segurança','Logística','Pessoal e Administração','Emergência','Anomalias (Especiais)'];
const normalizar = valor => valor.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
let documentos = [];
let selecionado = '';
let grupo = '';
let visao = 'manual';
let filtros = new FormData(form);
let geracao = 0;

function el(tag, texto, classe) {
  const node = document.createElement(tag);
  if (texto !== undefined) node.textContent = texto;
  if (classe) node.className = classe;
  return node;
}

function icone(id) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  const uso = document.createElementNS(ns, 'use');
  svg.setAttribute('class', 'proc-icon');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  uso.setAttribute('href', '#proc-i-' + id);
  svg.append(uso);
  return svg;
}

function link(dado, texto) {
  const node = el('a', texto);
  node.href = dado.href;
  return node;
}

function nivel(dado) {
  if (!dado.visibilidade) return 'publico';
  const na = dado.visibilidade.naExato ?? dado.visibilidade.naMinimo;
  return Number.isInteger(na) ? 'NA-' + na : 'restrito';
}

function rotuloNivel(dado) {
  const p = nivel(dado);
  return p === 'publico' ? 'Público' : p === 'restrito' ? 'Restrito' : p;
}

function bloco(titulo, conteudo, classe) {
  const bloco = el('section', undefined, classe);
  const cabecalho = el('h3', titulo);
  cabecalho.prepend(icone(classe === 'proc-atencao' ? 'alert' : 'file'));
  bloco.append(cabecalho, conteudo);
  return bloco;
}

function ficha(item) {
  const painel = $('proc-ficha');
  painel.replaceChildren();
  if (!item) {
    painel.append(el('p','Selecione um procedimento disponível.', 'intercom-empty'));
    return;
  }

  const cabecalho = el('header', undefined, 'proc-ficha-head');
  const identidade = el('div');
  identidade.append(el('h2', item.codigo), el('p', item.titulo));
  const na = el('span', rotuloNivel(item), 'proc-na');
  cabecalho.append(icone('file'), identidade, na);

  const meta = el('dl', undefined, 'proc-metadata');
  for (const [rotulo, valor] of [['Setor', item.setor], ['Versão', item.revisao ? 'v.' + item.revisao : '—'], ['Atualizado em', item.atualizadoEm], ['Status', item.situacao]]) {
    const campo = el('div');
    const valorEl = el('dd', valor ?? '—');
    if (rotulo === 'Setor') valorEl.prepend(icone('sector'));
    if (rotulo === 'Status' && valor === 'Em vigor') {
      valorEl.className = 'proc-em-vigor';
      const ponto = el('span', undefined, 'bar-dot');
      ponto.setAttribute('aria-hidden', 'true');
      valorEl.prepend(ponto);
    }
    campo.append(el('dt', rotulo), valorEl);
    meta.append(campo);
  }
  painel.append(cabecalho, meta, bloco('Resumo', el('p', item.resumo)));

  if (item.etapas?.length) {
    const lista = el('ol', undefined, 'proc-etapas');
    for (const [titulo, texto] of item.etapas) {
      const passo = el('li');
      const conteudo = el('div');
      conteudo.append(el('strong', titulo), el('p', texto));
      passo.append(conteudo);
      lista.append(passo);
    }
    painel.append(bloco('Procedimento operacional',lista));
  }
  if (item.atencao) painel.append(bloco('Atenção',el('p',item.atencao),'proc-atencao'));
  const relacionados = (item.relacionados ?? []).map(codigo => documentos.find(dado => dado.codigo === codigo)).filter(Boolean);
  if (relacionados.length) {
    const lista = el('ul', undefined, 'proc-relacionados');
    for (const dado of relacionados) {
      const linha = el('li');
      const consulta = link(dado, dado.codigo);
      const descricao = el('span');
      descricao.append(consulta, document.createTextNode(' · ' + dado.titulo));
      linha.append(icone('link'), descricao, el('small', rotuloNivel(dado), 'proc-na'), icone('arrow'));
      lista.append(linha);
    }
    painel.append(bloco('Documentos relacionados',lista));
  }
  if (item.href) painel.append(link({...item, href:item.href + '?origem=procedimentos'},'Abrir procedimento completo'));
}

function lista() {
  const termo = normalizar(busca.value.trim());
  const status = filtros.getAll('situacao');
  const setor = filtros.get('setor');
  const na = filtros.get('na');
  const procedimentos = documentos.filter(d => d.categoria === 'procedimento' &&
    (visao !== 'restritos' || d.visibilidade) && (visao !== 'revisoes' || d.revisao));
  const grupos = visao === 'setores' ? [...new Set(procedimentos.map(d => d.setor).filter(Boolean))] : secoes;
  const obterGrupo = item => visao === 'setores' ? item.setor : item.grupo;
  const menu = $('proc-categorias');
  menu.replaceChildren(...['',...grupos].map(nome => {
    const botao = el('button', nome || 'Todos os Procedimentos');
    botao.type = 'button';
    botao.setAttribute('aria-pressed', String(grupo === nome));
    const marca = {
      'Operação Geral':'sector','Pesquisa e Análise':'flask','Engenharia':'gear','Contenção':'shield',
      'Segurança':'lock','Logística':'box','Pessoal e Administração':'users','Emergência':'alert','Anomalias (Especiais)':'alert'
    };
    const rotulo = el('span', nome || 'Todos os Procedimentos');
    rotulo.prepend(icone(marca[nome] ?? 'folder'));
    botao.replaceChildren(rotulo, el('b',String(procedimentos.filter(d => !nome || obterGrupo(d) === nome).length)));
    botao.addEventListener('click', () => { grupo = nome; lista(); });
    return botao;
  }));
  const campo = ordem.value;
  const itens = procedimentos.filter(d => (!grupo || obterGrupo(d) === grupo) &&
    (!setor || d.setor === setor) && (!na || nivel(d) === na) &&
    (!status.length || status.includes(d.situacao)) &&
    normalizar([d.codigo,d.titulo,d.resumo].filter(Boolean).join(' ')).includes(termo))
    .sort((a,b) => campo === 'revisao' ? String(b.revisao ?? '').localeCompare(String(a.revisao ?? ''),'pt-BR',{numeric:true}) :
      String(a[campo] ?? '').localeCompare(String(b[campo] ?? ''),'pt-BR',{numeric:true}));
  const item = itens.find(d => d.codigo === selecionado) ?? itens[0];
  selecionado = item?.codigo ?? '';
  $('proc-lista').replaceChildren(...(itens.length ? itens.map(d => {
    const botao = el('button',undefined,'proc-item');
    botao.type = 'button';
    botao.setAttribute('aria-pressed', String(d.codigo === selecionado));
    const texto = el('span');
    texto.append(el('strong',d.codigo),el('small',d.titulo));
    botao.append(icone('file'), texto, el('span',rotuloNivel(d),'proc-na'));
    if (d.revisao) botao.append(el('small','v.' + d.revisao));
    botao.addEventListener('click', () => {
      selecionado = d.codigo;
      for (const outro of $('proc-lista').querySelectorAll('button')) outro.setAttribute('aria-pressed', String(outro === botao));
      ficha(d);
    });
    return botao;
  }) : [el('p','Nenhum procedimento encontrado.','intercom-empty')]));
  ficha(item);
}

async function carregar() {
  const atual = ++geracao;
  documentos = [];
  $('proc-destaque').replaceChildren();
  lista();
  try {
    const [r, perfil] = await Promise.all([fetch('dados/documentos.json',{cache:'no-store'}),contaEditorial()]);
    if (!r.ok) throw new Error('Manual indisponível');
    const dados = await r.json();
    if (atual !== geracao) return;
    documentos = dados.filter(item => visivel(item,perfil));
    const setor = form.elements.setor;
    const preferido = setor.value;
    const setores = [...new Set(documentos.filter(x => x.categoria === 'procedimento').map(x => x.setor).filter(Boolean))].sort();
    setor.replaceChildren(setor.options[0],...setores.map(x => new Option(x,x)));
    setor.value = setores.includes(preferido) ? preferido : '';
    filtros = new FormData(form);
    const destaque = documentos.find(d => d.destaqueManual);
    if (destaque) $('proc-destaque').append(el('strong',destaque.codigo + ' · ' + destaque.titulo),
      el('p',destaque.resumo),link(destaque,'Ver registro'));
    else $('proc-destaque').append(el('p','Nenhum registro em destaque.'));
    lista();
  } catch {
    if (atual === geracao) $('proc-ficha').replaceChildren(el('p','Não foi possível consultar o manual.'));
  }
}

const abas = [...document.querySelectorAll('[data-visao]')];
for (const botao of abas) botao.addEventListener('click', () => {
  visao = botao.dataset.visao;
  grupo = '';
  ordem.value = visao === 'revisoes' ? 'revisao' : 'codigo';
  abas.forEach(item => item.setAttribute('aria-pressed', String(item === botao)));
  lista();
});
busca.addEventListener('input',lista);
ordem.addEventListener('change',lista);
form.addEventListener('submit',evento => { evento.preventDefault(); filtros = new FormData(form); lista(); });
addEventListener('pageshow',evento => { if (evento.persisted) carregar(); });
addEventListener('storage',evento => { if (!evento.key || evento.key === chaveSessao) carregar(); });
document.querySelector('[data-bf-logout]').addEventListener('click', () => queueMicrotask(carregar));
carregar();

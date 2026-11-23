import { iconeArquivo } from './icones-arquivo.js';
import { contaEditorial, visivel } from './visibilidade.js?v=3';
import { chaveSessao } from './credenciais.js?v=3';

const $ = id => document.getElementById(id);
const form = $('registro-filtros');
const abas = [...document.querySelectorAll('[data-reg-visao]')];
const normalizar = texto => texto.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
const tamanho = 10;
let catalogo = [];
let criterios = new FormData(form);
let visao = 'registro';
let secao = 'auditoria';
let selecionado = '';
let pagina = 0;
let geracao = 0;

function el(tag, texto, classe) {
  const n = document.createElement(tag);
  if (texto !== undefined) n.textContent = texto;
  if (classe) n.className = classe;
  return n;
}
const nivel = item => {
  if (!item.visibilidade) return 'Público';
  const na = item.visibilidade.naExato ?? item.visibilidade.naMinimo;
  return Number.isInteger(na) ? 'NA-' + na : 'Restrito';
};
const tipo = item => item.tipo ?? ({procedimento:'Protocolo',relatorio:'Relatório'})[item.categoria] ?? 'Registro';
const periodo = item => item.referencia ?? item.atualizadoEm ?? '';
const status = item => {
  const n = el('span',item.situacao ?? '—','registro-status');
  n.dataset.status = item.situacao ?? '';
  return n;
};
function link(href, texto) {
  const a = el('a',texto);
  a.href = href;
  return a;
}

function detalhe(item) {
  const painel = $('registro-ficha');
  painel.replaceChildren();
  if (!item) {
    painel.append(el('h2','Ficha do registro'),el('p','Selecione um resultado para abrir sua ficha.','intercom-empty'));
    return;
  }
  const cab = el('h2');
  const titulo = el('span',item.codigo + ' — ' + item.titulo);
  titulo.prepend(iconeArquivo('folder'));
  cab.append(titulo,el('small',nivel(item)));
  const corpo = el('div',undefined,'registro-ficha-body');
  const dados = el('dl');
  for (const [rotulo,valor] of [['Tipo',tipo(item)],['Setor',item.setor],['Responsável',item.responsavel],['Data/Hora',periodo(item)],['Status',status(item)]]) {
    const campo = el('div');
    const dd = el('dd');
    dd.append(valor || '—');
    campo.append(el('dt',rotulo),dd);
    dados.append(campo);
  }
  const resumo = el('section',undefined,'registro-ficha-box');
  const resumoTitulo = el('h3','Resumo do Registro');
  resumoTitulo.prepend(iconeArquivo('file'));
  resumo.append(resumoTitulo,el('p',item.resumo ?? 'Resumo indisponível.'));
  if (item.href) resumo.append(link(item.href + (item.categoria === 'procedimento' ? '?origem=procedimentos' : '?origem=registros'),'Abrir registro completo'));
  const secoes = el('div',undefined,'intercom-tabs registro-ficha-tabs');
  const paineis = [['auditoria','Histórico de Auditoria'],['circulacao','Circulação'],['anexos','Anexos (' + (item.anexos?.length ?? 0) + ')']];
  for (const [id,titulo] of paineis) {
    const botao = el('button',titulo);
    botao.prepend(iconeArquivo({auditoria:'history',circulacao:'sector',anexos:'link'}[id]));
    botao.type = 'button';
    botao.setAttribute('aria-pressed',String(secao === id));
    botao.addEventListener('click',() => {
      secao = id;
      for (const outro of secoes.children) outro.setAttribute('aria-pressed',String(outro === botao));
      preencherDetalhes();
    });
    secoes.append(botao);
  }
  const detalheSecao = el('section',undefined,'registro-ficha-box');
  function preencherDetalhes() {
    const itens = Array.isArray(item[secao]) ? item[secao] : [];
    const titulo = paineis.find(p => p[0] === secao)[1];
    detalheSecao.replaceChildren(el('h3',titulo));
    if (!itens.length) detalheSecao.append(el('p','Nenhuma informação publicada nesta seção.'));
    else {
      const lista = el('ul');
      for (const valor of itens) {
        const li = el('li');
        if (secao === 'anexos' && valor?.href) li.append(link(valor.href,valor.titulo ?? 'Abrir anexo'));
        else li.textContent = typeof valor === 'string' ? valor : [valor?.quando,valor?.acao,valor?.responsavel].filter(Boolean).join(' · ');
        lista.append(li);
      }
      detalheSecao.append(lista);
    }
  }
  preencherDetalhes();
  corpo.append(dados,resumo,secoes,detalheSecao);
  painel.append(cab,corpo);
}

function naVisao(item) {
  if (visao === 'auditoria') return Boolean(item.auditoria?.length);
  if (visao === 'restrito') return Boolean(item.visibilidade);
  return item.categoria === visao;
}
function filtrados() {
  const termo = normalizar((criterios.get('termo') ?? '').trim());
  return catalogo.filter(item => naVisao(item) &&
    (!criterios.get('setor') || item.setor === criterios.get('setor')) &&
    (!criterios.get('tipo') || tipo(item) === criterios.get('tipo')) &&
    (!criterios.get('na') || nivel(item) === criterios.get('na')) &&
    (!criterios.get('periodo') || periodo(item) === criterios.get('periodo')) &&
    normalizar([item.codigo,item.titulo,item.resumo,item.setor].filter(Boolean).join(' ')).includes(termo));
}
function desenhar() {
  const itens = filtrados();
  const inicio = pagina * tamanho;
  const atuais = itens.slice(inicio,inicio + tamanho);
  const item = atuais.find(x => x.codigo === selecionado) ?? atuais[0];
  selecionado = item?.codigo ?? '';
  const lista = $('registro-lista');
  lista.replaceChildren();
  for (const r of atuais) {
    const tr = el('tr');
    tr.dataset.ativo = String(r.codigo === selecionado);
    tr.dataset.codigo = r.codigo;
    const id = el('td');
    const botao = el('button',r.codigo);
    botao.prepend(iconeArquivo('file'));
    botao.type = 'button';
    botao.setAttribute('aria-pressed',tr.dataset.ativo);
    botao.addEventListener('click',() => {
      selecionado = r.codigo;
      secao = 'auditoria';
      for (const linha of lista.rows) {
        linha.dataset.ativo = String(linha.dataset.codigo === selecionado);
        linha.querySelector('button').setAttribute('aria-pressed',linha.dataset.ativo);
      }
      detalhe(r);
    });
    id.append(botao);
    tr.append(id,el('td',tipo(r)),el('td',r.setor ?? '—'),el('td',r.responsavel ?? '—'),el('td',periodo(r) || '—'),el('td',nivel(r)));
    const situacao = el('td');
    situacao.append(status(r));
    tr.append(situacao);
    lista.append(tr);
  }
  if (!atuais.length) {
    const tr = el('tr');
    const td = el('td','Nenhum registro corresponde à consulta.');
    td.colSpan = 7;
    tr.append(td);
    lista.append(tr);
  }
  $('registro-contagem').textContent = itens.length + (itens.length === 1 ? ' registro' : ' registros');
  $('registro-pagina').textContent = (pagina + 1) + ' / ' + Math.max(1,Math.ceil(itens.length / tamanho));
  $('registro-anterior').disabled = pagina === 0;
  $('registro-proximo').disabled = inicio + tamanho >= itens.length;
  detalhe(item);
}

function preencherPaineis() {
  const registros = catalogo.filter(d => d.categoria === 'registro');
  const valores = [
    ['Total de registros',registros.length],
    ['Incidentes',registros.filter(r => tipo(r) === 'Incidente').length],
    ['Anomalias',registros.filter(r => tipo(r) === 'Anomalia').length],
    ['Operacionais',registros.filter(r => tipo(r) === 'Operacional').length],
    ['Restritos',registros.filter(r => r.visibilidade).length]
  ];
  $('registro-resumo').replaceChildren(...valores.map(([rotulo,total]) => {
    const item = el('div');
    const dt = el('dt',rotulo);
    dt.prepend(iconeArquivo({'Total de registros':'list','Incidentes':'alert','Anomalias':'flask','Operacionais':'check','Restritos':'lock'}[rotulo]));
    item.append(dt,el('dd',String(total)));
    return item;
  }));
  const destaque = registros.filter(r => r.destaqueArquivo);
  $('registro-destaques').replaceChildren(...destaque.map(r => {
    const item = el('div');
    const botao = el('button',r.codigo + ' · ' + r.titulo);
    botao.prepend(iconeArquivo('file'));
    botao.type = 'button';
    botao.addEventListener('click',() => {
      form.reset();
      criterios = new FormData(form);
      escolherVisao('registro');
      selecionado = r.codigo;
      pagina = Math.floor(filtrados().findIndex(item => item.codigo === selecionado) / tamanho);
      secao = 'auditoria';
      desenhar();
    });
    item.append(botao,el('p',r.resumo));
    return item;
  }));
  if (!destaque.length) $('registro-destaques').append(el('p','Nenhum registro em destaque.'));
  const codigos = registros.map(r => r.codigo);
  const falhas = registros.filter(r => !r.codigo || !r.titulo || !r.href).length + codigos.length - new Set(codigos).size;
  $('registro-integridade').textContent = falhas
    ? 'Foram encontradas ' + falhas + ' pendências nos dados de catálogo exibidos.'
    : 'Nenhuma inconsistência de identificação foi encontrada nos registros exibidos.';
}

async function carregar() {
  const atual = ++geracao;
  catalogo = [];
  pagina = 0;
  preencherPaineis();
  desenhar();
  $('registro-integridade').textContent = 'Consultando catálogo…';
  try {
    const [r,conta] = await Promise.all([fetch('dados/documentos.json',{cache:'no-store'}),contaEditorial()]);
    if (!r.ok) throw Error('Catálogo indisponível');
    const dados = await r.json();
    if (atual !== geracao) return;
    catalogo = dados.filter(item => visivel(item,conta));
    for (const [nome,extrair] of [['setor',d => d.setor],['tipo',tipo],['periodo',periodo]]) {
      const select = form.elements[nome];
      const anterior = select.value;
      const valores = [...new Set(catalogo.map(extrair).filter(Boolean))].sort();
      select.replaceChildren(select.options[0],...valores.map(x => new Option(x,x)));
      select.value = valores.includes(anterior) ? anterior : '';
    }
    criterios = new FormData(form);
    preencherPaineis();
    desenhar();
  } catch {
    if (atual !== geracao) return;
    $('registro-integridade').textContent = 'Não foi possível consultar o catálogo.';
  }
}
function escolherVisao(id) {
  visao = id;
  pagina = 0;
  selecionado = '';
  secao = 'auditoria';
  abas.forEach(aba => aba.setAttribute('aria-pressed',String(aba.dataset.regVisao === id)));
}
for (const aba of abas) aba.addEventListener('click',() => { escolherVisao(aba.dataset.regVisao); desenhar(); });
form.addEventListener('submit',evento => { evento.preventDefault(); criterios = new FormData(form); pagina = 0; desenhar(); });
form.addEventListener('reset',() => queueMicrotask(() => { criterios = new FormData(form); pagina = 0; desenhar(); }));
$('registro-anterior').addEventListener('click',() => { if (pagina > 0) pagina--; desenhar(); });
$('registro-proximo').addEventListener('click',() => { if ((pagina + 1) * tamanho < filtrados().length) pagina++; desenhar(); });
addEventListener('pageshow',evento => { if (evento.persisted) carregar(); });
addEventListener('storage',evento => { if (!evento.key || evento.key === chaveSessao) carregar(); });
document.querySelector('[data-bf-logout]').addEventListener('click',() => queueMicrotask(carregar));
carregar();

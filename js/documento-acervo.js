import { contaEditorial, visivel } from './visibilidade.js?v=3';
import { chaveSessao } from './credenciais.js?v=3';

const $ = id => document.getElementById(id);
const leitor = $('doc-leitor');
const estado = $('doc-estado');
const codigo = leitor.dataset.codigo;
let itemAtual = null;
let escopo = '';
let geracao = 0;

function el(tag,texto) {
  const n = document.createElement(tag);
  if (texto !== undefined) n.textContent = texto;
  return n;
}
function itemLink(item) {
  const a = el('a',item.codigo + ' — ' + item.titulo);
  a.href = new URL('../' + item.href,import.meta.url);
  return a;
}
function preencherLista(id,itens,montar) {
  const destino = $(id);
  destino.replaceChildren();
  if (!itens.length) destino.append(el('li','Nenhum item registrado.'));
  for (const item of itens) {
    const li = el('li');
    li.append(montar(item));
    destino.append(li);
  }
}
function classificacao(item) {
  return ({procedimento:'Procedimento',registro:'Registro operacional',relatorio:'Relatório'})[item.categoria] ?? 'Documento de referência';
}
function nivel(item) {
  if (!item.visibilidade) return 'Público';
  const na = item.visibilidade.naExato ?? item.visibilidade.naMinimo;
  return Number.isInteger(na) ? 'NA-' + na : 'Restrito';
}
function metadados(item, catalogo) {
  $('doc-classe').textContent = classificacao(item);
  $('doc-titulo').textContent = item.titulo;
  $('doc-resumo').textContent = item.resumo ?? '';
  const linhas = [
    ['Código',item.codigo],['Autor / Setor',item.autor ?? item.setor],['Data de publicação',item.publicadoEm],
    ['Última revisão',[item.atualizadoEm,item.revisao && 'v.' + item.revisao].filter(Boolean).join(' · ')],
    ['Nível de acesso',nivel(item)],['Classificação',classificacao(item)],['Páginas',item.paginas],['Formato',item.pdf ? 'Digital (PDF)' : 'Digital (HTML)']
  ];
  $('doc-meta').replaceChildren(...linhas.map(([nome,valor]) => {
    const linha = el('div');
    const dd = el('dd',valor || '—');
    if (nome === 'Nível de acesso') dd.className = 'doc-na';
    linha.append(el('dt',nome),dd);
    return linha;
  }));
  const areas = [...new Set([item.acervo,item.grupo,item.setor].filter(Boolean))];
  preencherLista('doc-areas',areas,x => el('span',x));
  preencherLista('doc-tags',Array.isArray(item.palavrasChave) ? item.palavrasChave : [],x => el('span',x));
  const codigos = new Set(item.relacionados ?? []);
  const relacionados = catalogo.filter(d => d.href && d.codigo !== item.codigo &&
    (codigos.has(d.codigo) || d.relacionados?.includes(item.codigo)));
  preencherLista('doc-relacionados',relacionados,itemLink);
  $('doc-pdf').lastChild.textContent = item.pdf ? 'Baixar (PDF)' : 'Salvar como PDF';
}
function indice() {
  const destino = $('doc-capitulos');
  let secao = 0;
  let subseq = 0;
  let subsecoes;
  for (const heading of $('doc-texto').querySelectorAll('h2,h3')) {
    const principal = heading.tagName === 'H2' || !secao;
    if (principal) { secao++; subseq = 0; }
    else subseq++;
    const numero = principal ? secao + '.' : secao + '.' + subseq;
    heading.id ||= 'secao-' + secao + (principal ? '' : '-' + subseq);
    heading.dataset.numero = numero;
    const item = el('li');
    const link = el('a',numero + ' ' + heading.textContent);
    link.href = '#' + heading.id;
    item.append(link);
    if (principal) {
      destino.append(item);
      subsecoes = null;
    } else {
      if (!subsecoes) {
        subsecoes = el('ul');
        destino.lastElementChild.append(subsecoes);
      }
      subsecoes.append(item);
    }
  }
}
function preferencias() {
  try {
    const d = JSON.parse(localStorage.getItem(escopo));
    return { marcados:Array.isArray(d?.marcados) ? d.marcados : [],
      historico:Array.isArray(d?.historico) ? d.historico : [],
      progresso:d?.progresso && typeof d.progresso === 'object' ? d.progresso : {} };
  } catch {
    return { marcados:[],historico:[],progresso:{} };
  }
}
function botaoFavorito(dados) {
  const ativo = dados.marcados.includes(codigo);
  $('doc-favoritar').setAttribute('aria-pressed',String(ativo));
  $('doc-favoritar').querySelector('span').textContent = ativo ? 'Favoritado' : 'Favoritar';
}

async function carregar() {
  const atual = ++geracao;
  itemAtual = null;
  escopo = '';
  leitor.hidden = true;
  estado.hidden = false;
  estado.textContent = 'Consultando documento…';
  $('doc-acao-estado').textContent = '';
  try {
    const url = new URL('../dados/documentos.json',import.meta.url);
    const [r,conta] = await Promise.all([fetch(url,{cache:'no-store'}),contaEditorial()]);
    if (!r.ok) throw Error('Catálogo indisponível');
    const dados = await r.json();
    if (atual !== geracao) return;
    const catalogo = dados.filter(d => visivel(d,conta));
    const item = catalogo.find(d => d.codigo === codigo);
    if (!item) { estado.textContent = 'Documento indisponível para sua credencial.'; return; }
    itemAtual = item;
    escopo = 'belfegor-biblioteca:' + (conta?.usuario ?? 'visitante');
    metadados(item,catalogo);
    const registro = preferencias();
    registro.historico = [codigo,...registro.historico.filter(x => x !== codigo)].slice(0,50);
    try { localStorage.setItem(escopo,JSON.stringify(registro)); } catch {}
    botaoFavorito(registro);
    estado.hidden = true;
    leitor.hidden = false;
    if (location.hash.startsWith('#secao-')) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  } catch {
    if (atual === geracao) estado.textContent = 'Não foi possível consultar o documento.';
  }
}
$('doc-favoritar').addEventListener('click',() => {
  if (!itemAtual) return;
  const registro = preferencias();
  registro.marcados = registro.marcados.includes(codigo)
    ? registro.marcados.filter(x => x !== codigo) : [...registro.marcados,codigo];
  try { localStorage.setItem(escopo,JSON.stringify(registro)); botaoFavorito(registro); }
  catch { $('doc-acao-estado').textContent = 'Não foi possível atualizar as marcações.'; $('doc-copiar').closest('details').open = true; }
});
$('doc-pdf').addEventListener('click',() => {
  if (!itemAtual) return;
  if (itemAtual.pdf) {
    const a = el('a');
    a.href = new URL('../' + itemAtual.pdf,import.meta.url);
    a.download = '';
    a.click();
  } else window.print();
});
$('doc-copiar').addEventListener('click',async () => {
  const status = $('doc-acao-estado');
  try { await navigator.clipboard.writeText(location.href); status.textContent = 'Link copiado.'; }
  catch { status.textContent = 'Copie o endereço pela barra do navegador.'; }
});
addEventListener('pageshow',evento => { if (evento.persisted) carregar(); });
addEventListener('storage',evento => {
  if (!evento.key || evento.key === chaveSessao) carregar();
  else if (evento.key === escopo && itemAtual) botaoFavorito(preferencias());
});
document.querySelector('[data-bf-logout]').addEventListener('click',() => queueMicrotask(carregar));
indice();
carregar();

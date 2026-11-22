import { contaEditorial, visivel } from './visibilidade.js?v=3';
import { chaveSessao } from './credenciais.js?v=3';
import { iconeArquivo } from './icones-arquivo.js';

const $ = id => document.getElementById(id);
const categorias = [...document.querySelectorAll('[data-bib-categoria]')];
const modos = [...document.querySelectorAll('[data-bib-modo]')];
const form = $('bib-filtros');
const busca = $('bib-buscar');
const tamanho = 10;
const inicial = { marcados:[], historico:[], progresso:{} };
let local = inicial;
let escopo = '';
let documentos = [];
let categoria = '';
let modo = 'catalogo';
let termo = '';
let filtros = new FormData(form);
let pagina = 0;
let consulta = 0;

const normalizar = valor => valor.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().trim();
const tipo = item => item.acervo ?? ({procedimento:'Procedimento',registro:'Registro',relatorio:'Relatório'})[item.categoria] ?? 'Guia';

function el(tag,texto,classe) {
  const node = document.createElement(tag);
  if (texto !== undefined) node.textContent = texto;
  if (classe) node.className = classe;
  return node;
}
function salvar() {
  if (!escopo) return;
  try { localStorage.setItem(escopo,JSON.stringify(local)); } catch {}
}
function ler() {
  local = { marcados:[], historico:[], progresso:{} };
  try {
    const dados = JSON.parse(localStorage.getItem(escopo));
    if (Array.isArray(dados?.marcados)) local.marcados = dados.marcados;
    if (Array.isArray(dados?.historico)) local.historico = dados.historico;
    if (dados?.progresso && typeof dados.progresso === 'object') local.progresso = dados.progresso;
  } catch {}
}
function abrir(item,texto,classe) {
  const a = el('a',texto,classe);
  a.href = item.href;
  a.addEventListener('click',() => {
    local.historico = [item.codigo,...local.historico.filter(x => x !== item.codigo)].slice(0,50);
    salvar();
    leitura();
  });
  return a;
}
function leitura() {
  const itens = local.historico.map(codigo => documentos.find(item => item.codigo === codigo))
    .filter(item => item && (local.progresso[item.codigo] ?? 0) < 100).slice(0,3);
  $('bib-leitura').replaceChildren(...(itens.length ? itens.map(item => {
    const rotulo = el('label');
    const nome = el('span',item.titulo);
    const progresso = el('input');
    progresso.type = 'range';
    progresso.min = '0';
    progresso.max = '100';
    progresso.step = '5';
    progresso.value = String(local.progresso[item.codigo] ?? 0);
    progresso.setAttribute('aria-label','Progresso de leitura: ' + item.titulo);
    const total = el('span',progresso.value + '%');
    progresso.addEventListener('input',() => { total.textContent = progresso.value + '%'; });
    progresso.addEventListener('change',() => {
      local.progresso[item.codigo] = Number(progresso.value);
      salvar();
    });
    rotulo.append(nome,total);
    const bloco = el('div',undefined,'bib-leitura-item');
    bloco.append(rotulo,progresso);
    return bloco;
  }) : [el('p','Nenhum documento em leitura.')]));
}
function destaque() {
  const item = documentos.find(d => d.destaqueBiblioteca);
  const painel = $('bib-destaque');
  painel.replaceChildren();
  if (!item) { painel.append(el('p','Nenhum documento em destaque.')); return; }
  const card = el('div',undefined,'bib-feature');
  const capa = el('div',undefined,'bib-capa');
  capa.setAttribute('aria-hidden','true');
  capa.append(iconeArquivo('book'));
  const texto = el('div');
  texto.append(el('strong',item.titulo),el('p',item.codigo),el('p',item.resumo),abrir(item,'Acessar documento','action'));
  card.append(capa,texto);
  painel.append(card);
}
function resultados() {
  const fonte = modo === 'historico' ? local.historico.map(codigo => documentos.find(d => d.codigo === codigo)).filter(Boolean) : documentos;
  const chave = normalizar(termo);
  return fonte.filter(d =>
    (modo !== 'marcados' || local.marcados.includes(d.codigo)) &&
    (!categoria || d.acervo === categoria) &&
    (!filtros.get('setor') || d.setor === filtros.get('setor')) &&
    (!filtros.get('tipo') || tipo(d) === filtros.get('tipo')) &&
    (!filtros.get('acesso') || (d.visibilidade ? 'restrito' : 'publico') === filtros.get('acesso')) &&
    normalizar([d.codigo,d.titulo,d.resumo,d.setor,tipo(d)].filter(Boolean).join(' ')).includes(chave)
  );
}
function lista() {
  const itens = resultados();
  const inicio = pagina * tamanho;
  const visiveis = itens.slice(inicio,inicio + tamanho);
  $('bib-contagem').textContent = visiveis.length ? 'Exibindo ' + (inicio + 1) + '–' + (inicio + visiveis.length) + ' de ' + itens.length : '0 itens';
  $('bib-anterior').disabled = pagina === 0;
  $('bib-proxima').disabled = inicio + tamanho >= itens.length;
  document.querySelector('[data-bib-titulo]').textContent = ({catalogo:'Adições Recentes ao Acervo',marcados:'Minhas marcações',historico:'Histórico de consulta'})[modo];
  $('bib-lista').replaceChildren(...(visiveis.length ? visiveis.map(item => {
    const linha = el('article',undefined,'bib-linha');
    linha.dataset.restrito = String(Boolean(item.visibilidade));
    const texto = el('div',undefined,'bib-texto');
    texto.append(abrir(item,item.titulo),el('p',item.resumo));
    const marcar = el('button',undefined,'bib-marca');
    marcar.type = 'button';
    marcar.setAttribute('aria-label','Marcar ' + item.titulo);
    marcar.setAttribute('aria-pressed',String(local.marcados.includes(item.codigo)));
    marcar.append(iconeArquivo('pin'));
    marcar.addEventListener('click',() => {
      local.marcados = local.marcados.includes(item.codigo) ? local.marcados.filter(x => x !== item.codigo) : [...local.marcados,item.codigo];
      salvar();
      if (modo === 'marcados') {
        pagina = Math.min(pagina,Math.max(0,Math.ceil(resultados().length / tamanho) - 1));
        lista();
      } else marcar.setAttribute('aria-pressed',String(local.marcados.includes(item.codigo)));
    });
    linha.append(iconeArquivo(item.visibilidade ? 'lock' : 'file'),el('code',item.codigo),texto,el('small',tipo(item),'intercom-tag'),marcar);
    return linha;
  }) : [el('p','Nenhum documento encontrado.','intercom-empty')]));
}
function selecionarModo(valor) {
  modo = valor;
  modos.forEach(b => b.setAttribute('aria-pressed',String(b.dataset.bibModo === modo)));
}
async function carregar() {
  const atual = ++consulta;
  documentos = [];
  escopo = '';
  local = inicial;
  pagina = 0;
  for (const id of ['bib-destaque','bib-leitura']) $(id).replaceChildren();
  $('bib-lista').replaceChildren(el('p','Consultando acervo…','intercom-empty'));
  try {
    const [r,perfil] = await Promise.all([fetch('dados/documentos.json',{cache:'no-store'}),contaEditorial()]);
    if (!r.ok) throw Error('Catálogo');
    const dados = await r.json();
    if (atual !== consulta) return;
    documentos = dados.filter(d => d.href && visivel(d,perfil));
    escopo = 'belfegor-biblioteca:' + (perfil?.usuario ?? 'visitante');
    ler();
    for (const botao of categorias) {
      const c = botao.dataset.bibCategoria;
      const qtd = documentos.filter(d => !c || d.acervo === c).length;
      botao.querySelector('[data-bib-total]').textContent = qtd + (qtd === 1 ? ' item' : ' itens');
    }
    for (const [campo,obter] of [['setor',d => d.setor],['tipo',tipo]]) {
      const select = form.elements[campo];
      const anterior = select.value;
      const valores = [...new Set(documentos.map(obter).filter(Boolean))].sort();
      select.replaceChildren(select.options[0],...valores.map(v => new Option(v,v)));
      select.value = valores.includes(anterior) ? anterior : '';
    }
    filtros = new FormData(form);
    destaque(); leitura(); lista();
  } catch {
    if (atual === consulta) $('bib-lista').replaceChildren(el('p','Não foi possível consultar o acervo.','intercom-empty'));
  }
}
function selecionarCategoria(valor) {
  categoria = valor;
  categorias.forEach(b => b.setAttribute('aria-pressed',String(b.dataset.bibCategoria === categoria)));
}
for (const b of categorias) b.addEventListener('click',() => {
  selecionarCategoria(b.dataset.bibCategoria); selecionarModo('catalogo'); pagina = 0; lista();
});
for (const b of modos) b.addEventListener('click',() => {
  selecionarModo(b.dataset.bibModo); selecionarCategoria(''); termo = ''; busca.reset(); form.reset();
  filtros = new FormData(form); pagina = 0; lista();
});
busca.addEventListener('submit',evento => { evento.preventDefault(); termo = $('bib-termo').value; pagina = 0; lista(); });
form.addEventListener('submit',evento => { evento.preventDefault(); filtros = new FormData(form); pagina = 0; lista(); });
form.addEventListener('reset',() => queueMicrotask(() => { filtros = new FormData(form); pagina = 0; lista(); }));
$('bib-anterior').addEventListener('click',() => { if (pagina > 0) pagina--; lista(); });
$('bib-proxima').addEventListener('click',() => { if ((pagina + 1) * tamanho < resultados().length) pagina++; lista(); });
addEventListener('pageshow',evento => { if (evento.persisted) carregar(); });
addEventListener('storage',evento => {
  if (!evento.key || evento.key === chaveSessao) carregar();
  else if (evento.key === escopo) { ler(); leitura(); lista(); }
});
document.querySelector('[data-bf-logout]').addEventListener('click',() => queueMicrotask(carregar));
selecionarModo('catalogo');
carregar();

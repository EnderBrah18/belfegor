import { lerCatalogo } from './governanca.js';
import { abrirComunicado, chaveComunicado, obterConjunto } from './comunicado-estado.js';
import { contaEditorial, visivel } from './visibilidade.js?v=3';
import { chaveSessao } from './credenciais.js?v=3';
import { iconeArquivo } from './icones-arquivo.js';

const lista = document.getElementById('echo-lista');
const contagem = document.getElementById('echo-contagem');
const botoes = [...document.querySelectorAll('[data-echo-filtro]')];
let avisos = [];
let lidos = new Set();
let chave = '';
let filtro = 'recentes';
let geracao = 0;

function elemento(tag, texto, classe) {
  const n = document.createElement(tag);
  if (texto !== undefined) n.textContent = texto;
  if (classe) n.className = classe;
  return n;
}

function atualizarLidos() {
  try { lidos = new Set(JSON.parse(localStorage.getItem(chave) ?? '[]')); }
  catch { lidos = new Set(); }
}

function desenhar() {
  const novas = avisos.filter(a => !a.arquivado && !lidos.has(a.codigo));
  contagem.textContent = novas.length ? '(' + novas.length + ')' : '';
  const itens = filtro === 'arquivo' ? avisos.filter(a => a.arquivado)
    : filtro === 'novas' ? novas : avisos.filter(a => !a.arquivado);
  lista.replaceChildren();

  for (const aviso of itens.slice(0,4)) {
    const item = elemento('a',undefined,'echo-aviso');
    const novo = !lidos.has(aviso.codigo);
    item.href = abrirComunicado(aviso.codigo);
    item.dataset.novo = String(novo);
    item.dataset.arquivado = String(Boolean(aviso.arquivado));
    item.dataset.prioridade = aviso.prioridade ?? '';
    const marca = iconeArquivo(aviso.prioridade === 'Alta' ? 'alert' :
      (({Pesquisa:'flask', Operacionais:'gear', Pessoal:'users', Contenção:'shield'})[aviso.categoria] ?? 'file'));
    const texto = elemento('span',undefined,'echo-aviso-texto');
    texto.append(elemento('strong',aviso.titulo),elemento('small',[aviso.codigo,aviso.categoria].filter(Boolean).join(' · ')));
    const meta = elemento('span',undefined,'echo-aviso-meta');
    if (novo) meta.append(elemento('span',undefined,'echo-ponto'));
    if (aviso.referencia) meta.append(elemento('small',aviso.referencia));
    item.append(marca,texto,meta);
    item.addEventListener('click', () => {
      if (!chave) return;
      atualizarLidos();
      lidos.add(aviso.codigo);
      try { localStorage.setItem(chave,JSON.stringify([...lidos])); } catch {}
    });
    lista.append(item);
  }

  if (!itens.length) lista.append(elemento('p',filtro === 'novas' ? 'Nenhum comunicado não lido.' :
    filtro === 'arquivo' ? 'Nenhum comunicado arquivado.' : 'Nenhum comunicado recente.'));
}

async function carregar() {
  const atual = ++geracao;
  avisos = [];
  chave = '';
  contagem.textContent = '';
  lista.replaceChildren(elemento('p','Consultando comunicados…'));
  try {
    const conta = await contaEditorial();
    const dados = await lerCatalogo('comunicados',conta);
    if (atual !== geracao) return;
    const arquivos = obterConjunto(chaveComunicado('arquivados',conta));
    avisos = dados.filter(item => visivel(item,conta)).map(item => ({...item, arquivado:item.arquivado || arquivos.has(item.codigo)}));
    chave = 'belfegor-comunicados-lidos:' + (conta?.usuario ?? 'visitante');
    atualizarLidos();
    desenhar();
  } catch {
    if (atual === geracao) lista.replaceChildren(elemento('p','Não foi possível consultar os comunicados.'));
  }
}

for (const botao of botoes) botao.addEventListener('click', () => {
  filtro = botao.dataset.echoFiltro;
  botoes.forEach(item => item.setAttribute('aria-pressed',String(item === botao)));
  desenhar();
});
addEventListener('pageshow', evento => { if (evento.persisted) carregar(); });
addEventListener('storage', evento => {
  if (!evento.key || evento.key === chaveSessao) carregar();
  else if (evento.key === chave) { atualizarLidos(); desenhar(); }
});
document.querySelector('[data-bf-logout]').addEventListener('click', () => queueMicrotask(carregar));
carregar();

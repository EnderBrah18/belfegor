import { contaEditorial, visivel } from './visibilidade.js?v=3';
import { chaveSessao } from './credenciais.js?v=3';
import { iconeArquivo } from './icones-arquivo.js?v=3';
import { chaveComunicado, obterConjunto, alterarConjunto } from './comunicado-estado.js';

const $ = id => document.getElementById(id);
const codigo = new URLSearchParams(location.search).get('codigo')?.trim().toUpperCase() ?? '';
const leitor = $('com-leitor');
const estado = $('com-estado');
let atual = null;
let geracao = 0;

function el(tag, texto, classe) {
  const n = document.createElement(tag);
  if (texto !== undefined) n.textContent = texto;
  if (classe) n.className = classe;
  return n;
}
async function dados(nome) {
  const resposta = await fetch('dados/' + nome + '.json',{cache:'no-store'});
  if (!resposta.ok) throw Error('Catálogo indisponível');
  return resposta.json();
}
function metadados(aviso) {
  const p = el('div',undefined,'com-prioridade');
  const selo = el('dd','Prioridade: ' + (aviso.prioridade ?? 'Rotina'));
  selo.dataset.prioridade = aviso.prioridade ?? 'Rotina';
  selo.prepend(iconeArquivo('alert'));
  const titulo = el('dt','Prioridade','bf-visually-hidden');
  p.append(titulo,selo);
  const campos = [
    ['users','Setor emissor',aviso.emissor ?? aviso.setor], ['users','Destinatários',aviso.destinatarios],
    ['history','Data e hora',aviso.dataHora ?? aviso.referencia], ['check','Status','Lido']
  ];
  $('com-metadados').replaceChildren(p,...campos.map(([icon,rotulo,valor]) => {
    const item = el('div');
    const coluna = el('div');
    const dd = el('dd',valor ?? '—');
    if (rotulo === 'Status') dd.className = 'com-lido';
    coluna.append(el('dt',rotulo),dd);
    item.append(iconeArquivo(icon),coluna);
    return item;
  }));
}
function corpo(aviso) {
  const p = $('com-corpo');
  const paragrafos = Array.isArray(aviso.corpo) && aviso.corpo.length ? aviso.corpo : [aviso.resumo];
  p.replaceChildren(...paragrafos.filter(Boolean).map((texto,i) => {
    const node = el('p',texto);
    if (i === 0 && paragrafos.length > 1) node.className = 'com-saudacao';
    return node;
  }));
  if (aviso.quadro?.itens?.length) {
    const quadro = el('section',undefined,'com-quadro');
    const titulo = el('h3',aviso.quadro.titulo ?? 'Atenção');
    titulo.prepend(iconeArquivo('info'));
    const lista = el('ul');
    for (const texto of aviso.quadro.itens) lista.append(el('li',texto));
    quadro.append(titulo,lista);
    p.append(quadro);
  }
  for (const texto of aviso.encerramento ?? []) p.append(el('p',texto));
}
function relacionados(aviso, documentos, conta) {
  const painel = $('com-relacionados');
  const codigos = new Set(aviso.relacionados ?? []);
  const itens = documentos.filter(d => d.href && visivel(d,conta) && (codigos.has(d.codigo) || d.href === aviso.href));
  painel.replaceChildren(...itens.map(item => {
    const a = el('a',undefined,'com-doc-link');
    a.href = item.href;
    const texto = el('div');
    texto.append(el('strong',item.codigo + ' — ' + item.titulo));
    if (item.revisao) texto.append(el('small','Revisão ' + item.revisao));
    a.append(iconeArquivo('file'),texto,iconeArquivo('arrow'));
    return a;
  }));
  if (!itens.length && aviso.href && !documentos.some(d => d.href === aviso.href)) {
    const a = el('a','Acessar recurso vinculado','com-doc-link');
    a.href = aviso.href;
    a.prepend(iconeArquivo('file'));
    painel.append(a);
  }
  if (!painel.children.length) painel.append(el('p','Nenhum documento relacionado disponível.','intercom-empty'));
}
function historico(aviso) {
  const itens = aviso.historico ?? [];
  const painel = $('com-historico');
  painel.replaceChildren();
  if (!itens.length) { painel.append(el('p','Nenhuma atualização registrada.','intercom-empty')); return; }
  const lista = el('ol',undefined,'com-linha-tempo');
  for (const item of itens) {
    const no = el('li');
    no.append(el('strong',item.quando ?? item.tipo ?? 'Atualização'),el('p',item.texto));
    if (item.quando && item.tipo) no.append(el('small',item.tipo));
    lista.append(no);
  }
  painel.append(lista);
}
function estadoArquivo() {
  const arquivado = obterConjunto(chaveComunicado('arquivados',atual.conta)).has(codigo);
  $('com-arquivar').textContent = arquivado ? 'Desarquivar' : 'Arquivar';
  $('com-arquivar').setAttribute('aria-pressed',String(arquivado));
}

async function carregar() {
  const versao = ++geracao;
  atual = null;
  leitor.hidden = true;
  estado.hidden = false;
  estado.textContent = 'Consultando comunicado…';
  $('com-resposta').hidden = true;
  $('com-acao-estado').textContent = '';
  try {
    const [comunicados,documentos,conta] = await Promise.all([dados('comunicados'),dados('documentos'),contaEditorial()]);
    if (versao !== geracao) return;
    const aviso = comunicados.find(a => a.codigo === codigo && visivel(a,conta));
    if (!aviso) { estado.textContent = 'Comunicado indisponível para sua credencial.'; return; }
    atual = { conta };
    try { alterarConjunto(chaveComunicado('lidos',conta),codigo); } catch {}
    document.title = codigo + ' | Fundação Belfegor';
    $('com-local').textContent = codigo;
    $('com-codigo').textContent = codigo;
    $('com-titulo').textContent = aviso.titulo;
    $('com-assinante').textContent = aviso.emissor ?? aviso.setor ?? 'Fundação Belfegor';
    $('com-matricula').textContent = codigo;
    metadados(aviso); corpo(aviso); relacionados(aviso,documentos,conta); historico(aviso); estadoArquivo();
    estado.hidden = true;
    leitor.hidden = false;
  } catch {
    if (versao === geracao) estado.textContent = 'Não foi possível consultar o comunicado.';
  }
}
$('com-responder').addEventListener('click',() => {
  if (!atual) return;
  const resposta = $('com-resposta');
  resposta.hidden = !resposta.hidden;
  if (!resposta.hidden) {
    try { $('com-rascunho').value = localStorage.getItem(chaveComunicado('rascunho:' + codigo,atual.conta)) ?? ''; } catch {}
    $('com-rascunho').focus();
  }
});
$('com-resposta').addEventListener('submit', evento => {
  evento.preventDefault();
  if (!atual) return;
  try {
    localStorage.setItem(chaveComunicado('rascunho:' + codigo,atual.conta),$('com-rascunho').value);
    $('com-acao-estado').textContent = 'Rascunho salvo neste navegador. Nenhuma resposta foi enviada.';
  } catch { $('com-acao-estado').textContent = 'Não foi possível salvar o rascunho.'; }
});
$('com-arquivar').addEventListener('click', () => {
  if (!atual) return;
  const chave = chaveComunicado('arquivados',atual.conta);
  const adicionar = !obterConjunto(chave).has(codigo);
  try {
    alterarConjunto(chave,codigo,adicionar);
    estadoArquivo();
    $('com-acao-estado').textContent = adicionar ? 'Comunicado arquivado neste navegador.' : 'Comunicado removido do arquivo pessoal.';
  } catch { $('com-acao-estado').textContent = 'Não foi possível atualizar seu arquivo.'; }
});
addEventListener('pageshow',evento => { if (evento.persisted) carregar(); });
addEventListener('storage',evento => { if (!evento.key || evento.key === chaveSessao) carregar(); });
document.querySelector('[data-bf-logout]').addEventListener('click',() => queueMicrotask(carregar));
carregar();

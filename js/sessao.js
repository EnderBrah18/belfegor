import { descobrir } from './descoberta-documental.js';
import { aplicarVisibilidadeSuperior } from './visibilidade.js?v=4';
import { contaDaSessao, chaveSessao } from './credenciais.js?v=3';

const painel = document.querySelector('[data-bf-account]');
const menu = painel.querySelector('.bf-account-menu');
const resumo = menu.querySelector('summary');
const central = document.querySelector('.bf-message-menu');
const sino = central.querySelector('summary');
const indicador = central.querySelector('[data-bf-message-dot]');
const caixa = central.querySelector('[data-bf-message-list]');
const identificacao = menu.querySelector('[data-bf-account-id]');
const funcao = menu.querySelector('[data-bf-account-role]');
const cadastro = painel.querySelector('[data-bf-register]');
const entrar = painel.querySelector('[data-bf-login]');
const perfil = painel.querySelector('[data-bf-profile]');
const sair = painel.querySelector('[data-bf-logout]');
const aviso = painel.querySelector('[data-bf-status]');
const diretorio = document.querySelector('[data-bf-diretorio]');
const avisos = document.querySelector('[data-bf-avisos]');
const paginaPerfil = document.querySelector('[data-bf-profile-page]');
const acessoPerfil = document.querySelector('[data-bf-profile-guest]');
let geracao = 0;

function texto(tag, valor) {
  const elemento = document.createElement(tag);
  elemento.textContent = valor;
  return elemento;
}

function mensagensDoPerfil(conta, catalogo) {
  if (!Array.isArray(conta?.avisos)) return [];
  return conta.avisos
    .map(aviso => typeof aviso === 'string' ? { texto: aviso } : aviso)
    .flatMap(aviso => {
      if (typeof aviso?.texto !== 'string' || !aviso.texto.trim()) return [];
      if (!aviso.documento) return [aviso];
      const alvo = catalogo.find(item => item.codigo === aviso.documento);
      return descobrir(alvo,conta,'mensagem') && alvo.href ? [{...aviso,destino:alvo.href}] : [];
    });
}

function preencherMensagens(destino, mensagens) {
  const lista = document.createElement('ul');
  for (const mensagem of mensagens) {
    const item = document.createElement('li');
    if (mensagem.titulo) item.append(texto('strong', mensagem.titulo));
    if (mensagem.quando) item.append(texto('p', mensagem.quando));
    item.append(texto('p', mensagem.texto));
    if (mensagem.destino) {
      const link = texto('a','Consultar documento');
      link.href = new URL('../' + mensagem.destino,import.meta.url);
      item.append(link);
    }
    lista.append(item);
  }
  destino.append(lista);
}

function mostrarCentral(conta, mensagens) {
  const recentes = mensagens.slice(0, 5);
  indicador.hidden = !recentes.length;
  sino.setAttribute('aria-label', recentes.length
    ? 'Central de Mensagens · ' + recentes.length + (recentes.length === 1 ? ' mensagem recente' : ' mensagens recentes')
    : 'Central de Mensagens');
  caixa.replaceChildren();
  if (recentes.length) preencherMensagens(caixa, recentes);
  else caixa.append(texto('p', conta ? 'Você não tem mensagens recentes.' : 'Entre no portal para consultar suas mensagens.'));
}

function mostrar(conta, catalogo = []) {
  aplicarVisibilidadeSuperior(conta);
  window.dispatchEvent(new Event('bf-credencial-atualizada'));
  const mensagens = mensagensDoPerfil(conta,catalogo);
  mostrarCentral(conta, mensagens);
  cadastro.hidden = Boolean(conta);
  entrar.hidden = Boolean(conta);
  perfil.hidden = !conta;
  sair.hidden = !conta;
  identificacao.textContent = conta?.identificador ?? 'Visitante';
  funcao.textContent = conta ? [conta.profissao, conta.patente, conta.acesso].filter(Boolean).join(' · ') : 'Acesso público';
  perfil.textContent = conta ? 'Ver perfil · ' + conta.nome : '';
  if (conta) perfil.title = conta.profissao;
  else perfil.removeAttribute('title');

  if (paginaPerfil) {
    paginaPerfil.hidden = !conta;
    acessoPerfil.hidden = Boolean(conta);
    paginaPerfil.querySelector('[data-bf-profile-name]').textContent = conta?.nome ?? '';
    for (const campo of paginaPerfil.querySelectorAll('[data-bf-field]')) {
      campo.textContent = conta?.[campo.dataset.bfField] ?? '';
    }
  }

  if (diretorio) {
    diretorio.hidden = !conta;
    diretorio.replaceChildren();
    if (conta) {
      const torre = Number(conta.patente.slice(2)) >= 4
        ? 'Sua patente atende ao requisito de entrada regular na Torre Central.'
        : 'A entrada na Torre Central exige convocação, missão ou escolta para sua patente.';
      diretorio.append(texto('h2', 'Circulação funcional'), texto('p', conta.profissao + ' · ' + conta.acesso), texto('p', torre));
    }
  }
  if (avisos) {
    avisos.hidden = !mensagens.length;
    avisos.replaceChildren();
    if (mensagens.length) {
      avisos.append(texto('h2', 'Avisos da credencial'));
      preencherMensagens(avisos, mensagens);
    }
  }
}

async function consultar() {
  const atual = ++geracao;
  aviso.hidden = true;
  try {
    const sessao = localStorage.getItem(chaveSessao);
    if (!sessao) {
      mostrar(null);
      return;
    }
    const conta = await contaDaSessao();
    if (atual !== geracao) return;
    if (!conta) {
      localStorage.removeItem(chaveSessao);
      mostrar(null);
      aviso.textContent = 'Credencial desativada ou atualizada. Consulte o GM.';
      aviso.hidden = false;
      return;
    }
    const catalogo = conta.avisos?.some?.(item => item?.documento)
      ? await fetch(new URL('../dados/documentos.json',import.meta.url),{cache:'no-store'}).then(r => r.ok ? r.json() : []).catch(() => []) : [];
    if (atual === geracao) mostrar(conta,catalogo);
  } catch {
    if (atual !== geracao) return;
    mostrar(null);
    aviso.textContent = 'Não foi possível consultar a credencial agora.';
    aviso.hidden = false;
  }
}

sair.addEventListener('click', () => {
  ++geracao;
  localStorage.removeItem(chaveSessao);
  aviso.hidden = true;
  mostrar(null);
  menu.open = false;
  resumo.focus();
});
document.addEventListener('click', evento => {
  if (menu.open && !menu.contains(evento.target)) menu.open = false;
  if (central.open && !central.contains(evento.target)) central.open = false;
});
menu.addEventListener('keydown', evento => {
  if (evento.key === 'Escape' && menu.open) {
    menu.open = false;
    resumo.focus();
  }
});
central.addEventListener('keydown', evento => {
  if (evento.key === 'Escape' && central.open) {
    central.open = false;
    sino.focus();
  }
});
addEventListener('pageshow', consultar);
addEventListener('storage', evento => {
  if (!evento.key || evento.key === chaveSessao) consultar();
});
consultar();

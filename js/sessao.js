import { buscarConta, chaveSessao } from './credenciais.js';

const painel = document.querySelector('[data-bf-account]');
const menu = painel.querySelector('.bf-account-menu');
const resumo = menu.querySelector('summary');
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

function mostrar(conta) {
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
    const mensagens = Array.isArray(conta?.avisos) ? conta.avisos : [];
    avisos.hidden = !mensagens.length;
    avisos.replaceChildren();
    if (mensagens.length) avisos.append(texto('h2', 'Avisos da credencial'), ...mensagens.map(m => texto('p', m)));
  }
}

async function consultar() {
  const atual = ++geracao;
  aviso.hidden = true;
  try {
    const sessao = JSON.parse(localStorage.getItem(chaveSessao));
    if (!sessao) {
      mostrar(null);
      return;
    }
    const conta = await buscarConta(sessao.usuario);
    if (atual !== geracao) return;
    if (!conta?.ativo || conta.verificador !== sessao.verificador) {
      localStorage.removeItem(chaveSessao);
      mostrar(null);
      aviso.textContent = 'Credencial desativada ou atualizada. Consulte o GM.';
      aviso.hidden = false;
      return;
    }
    mostrar(conta);
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
});
menu.addEventListener('keydown', evento => {
  if (evento.key === 'Escape' && menu.open) {
    menu.open = false;
    resumo.focus();
  }
});
addEventListener('pageshow', consultar);
addEventListener('storage', evento => {
  if (!evento.key || evento.key === chaveSessao) consultar();
});
consultar();

import { acervo } from './acervo-config.js';

const $ = (id) => document.getElementById(id);
const chave = 'belfegor-acervo-oficial-v1';
const estado = $('estado');
const documento = $('documento');
const consulta = $('consulta');
const credencial = $('credencial');
const codigoInicial = new URLSearchParams(location.search).get('codigo');
let sessao = null;
let operacao = 0;
let renovacao = null;

async function requisicao(caminho, dados, token) {
  const resposta = await fetch(acervo.url.replace(/\/$/, '') + caminho, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      apikey: acervo.chave,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    body: JSON.stringify(dados)
  });
  if (!resposta.ok) throw new Error('Requisição indisponível');
  return resposta.status === 204 ? null : resposta.json();
}

function guardar(dados) {
  sessao = dados;
  if (dados) localStorage.setItem(chave, JSON.stringify(dados));
  else localStorage.removeItem(chave);
}

async function tokenAtual() {
  if (!sessao) throw new Error('Sessão ausente');
  if (sessao.expires_at * 1000 > Date.now() + 30000) return sessao.access_token;
  if (!renovacao) {
    const anterior = sessao;
    renovacao = requisicao('/auth/v1/token?grant_type=refresh_token', { refresh_token: sessao.refresh_token })
      .then((dados) => {
        if (sessao !== anterior) throw new Error('Sessão substituída');
        guardar(dados);
        return dados.access_token;
      })
      .finally(() => { renovacao = null; });
  }
  return renovacao;
}

function texto(tag, conteudo) {
  const elemento = document.createElement(tag);
  elemento.textContent = conteudo;
  return elemento;
}

function mostrar(dados) {
  documento.replaceChildren();
  documento.hidden = false;
  if (!dados || dados.bloqueado) {
    documento.append(texto('p', dados?.bloqueado ? 'Consulta suspensa para esta credencial.' : 'Documento indisponível para consulta.'));
    return;
  }
  documento.append(texto('h2', dados.titulo), texto('p', 'Revisão ' + dados.revisao));
  for (const bloco of dados.blocos) {
    if (bloco.restrito) {
      documento.append(texto('p', bloco.tipo === 'imagem' ? '▧ Imagem restrita' : '████ Trecho restrito'));
    } else if (bloco.imagem && ['image/png', 'image/jpeg', 'image/webp'].includes(bloco.mime)) {
      const imagem = document.createElement('img');
      imagem.alt = bloco.descricao;
      imagem.style.maxWidth = '100%';
      imagem.src = 'data:' + bloco.mime + ';base64,' + bloco.imagem;
      documento.append(imagem);
    } else if (bloco.texto) {
      documento.append(texto('p', bloco.texto));
    }
  }
}

async function abrir(codigo) {
  const atual = ++operacao;
  documento.replaceChildren();
  documento.hidden = true;
  estado.textContent = 'Consultando registro…';
  try {
    const dados = await requisicao('/rest/v1/rpc/belfegor_documento', { referencia: codigo }, await tokenAtual());
    if (atual !== operacao) return;
    mostrar(dados);
    estado.textContent = '';
  } catch {
    if (atual === operacao) estado.textContent = 'Falha na consulta. Tente novamente ou entre de novo.';
  }
}

async function carregar() {
  const atual = ++operacao;
  const lista = await requisicao('/rest/v1/rpc/belfegor_catalogo', {}, await tokenAtual());
  if (atual !== operacao) return;
  if (!lista) throw new Error('Credencial sem aprovação');
  credencial.hidden = true;
  consulta.hidden = false;
  estado.textContent = '';
  $('lista').replaceChildren(...lista.map((registro) => {
    const item = document.createElement('li');
    const link = texto('a', registro.codigo + ' · ' + registro.titulo);
    link.href = '?codigo=' + encodeURIComponent(registro.codigo);
    item.append(link);
    return item;
  }));
  if (codigoInicial) {
    $('codigo').value = codigoInicial;
    await abrir(codigoInicial);
  }
}

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(acervo.url) || !acervo.chave.startsWith('sb_publishable_')) {
  estado.textContent = 'O acesso por credencial institucional ainda não foi habilitado.';
} else {
  estado.textContent = '';
  credencial.hidden = false;

  credencial.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const botao = credencial.querySelector('button');
    botao.disabled = true;
    try {
      guardar(await requisicao('/auth/v1/token?grant_type=password', { email: $('email').value.trim(), password: $('senha').value }));
      await carregar();
    } catch {
      estado.textContent = 'Não foi possível entrar. Confira a senha e a aprovação da conta.';
    } finally {
      $('senha').value = '';
      botao.disabled = false;
    }
  });

  $('busca').addEventListener('submit', (evento) => {
    evento.preventDefault();
    const codigo = $('codigo').value.trim().toUpperCase();
    if (!codigo) return;
    history.replaceState(null, '', '?codigo=' + encodeURIComponent(codigo));
    abrir(codigo);
  });

  $('sair').addEventListener('click', async () => {
    ++operacao;
    const token = sessao?.access_token;
    guardar(null);
    documento.replaceChildren();
    documento.hidden = true;
    consulta.hidden = true;
    credencial.hidden = false;
    estado.textContent = '';
    if (token) {
      try { await requisicao('/auth/v1/logout?scope=local', {}, token); } catch { /* A sessão local já foi encerrada. */ }
    }
  });

  try {
    sessao = JSON.parse(localStorage.getItem(chave));
    if (sessao) await carregar();
  } catch {
    guardar(null);
    estado.textContent = 'Entre com uma conta aprovada para consultar o acervo.';
  }
}

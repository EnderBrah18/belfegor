const obter = id => document.getElementById(id);
const formulario = obter('estacao-entrada');
const usuario = obter('estacao-usuario');
const senha = obter('estacao-senha');
const estado = obter('estacao-estado');
const conteudo = obter('estacao-conteudo');
const registros = obter('estacao-registros');
const raiz = new URL('../', import.meta.url);

function criar(tag, texto) {
  const elemento = document.createElement(tag);
  elemento.textContent = texto;
  return elemento;
}

function mostrar(estacao) {
  obter('estacao-nome').textContent = estacao.titulo;
  obter('estacao-descricao').textContent = estacao.descricao ?? '';
  registros.replaceChildren(...(estacao.registros ?? []).map(registro => {
    const item = document.createElement('li');
    item.append(criar('h4', registro.titulo), criar('p', registro.texto ?? ''));
    if (registro.href) {
      const url = new URL(registro.href, raiz);
      if (url.origin === raiz.origin && url.pathname.startsWith(raiz.pathname)) {
        const link = criar('a', 'Abrir registro');
        link.href = url;
        item.append(link);
      }
    }
    return item;
  }));
  formulario.hidden = true;
  conteudo.hidden = false;
  estado.textContent = '';
  obter('estacao-sair').focus();
}

formulario.addEventListener('submit', async evento => {
  evento.preventDefault();
  const botao = formulario.querySelector('button');
  if (botao.disabled) return;
  botao.disabled = true;
  estado.textContent = 'Consultando estação…';
  const nome = usuario.value.trim().toLowerCase();
  const respostaDigitada = senha.value;
  try {
    const resposta = await fetch(new URL('dados/estacoes.json', raiz), { cache:'no-store' });
    if (!resposta.ok) throw new Error('Estações indisponíveis');
    const estacoes = await resposta.json();
    const estacao = estacoes.find(item => item.usuario === nome && item.senha === respostaDigitada);
    if (!estacao) {
      estado.textContent = 'Usuário ou senha da estação não reconhecidos.';
      return;
    }
    mostrar(estacao);
  } catch {
    estado.textContent = 'Não foi possível consultar as estações.';
  } finally {
    senha.value = '';
    botao.disabled = false;
  }
});

obter('estacao-sair').addEventListener('click', () => {
  conteudo.hidden = true;
  obter('estacao-nome').textContent = '';
  obter('estacao-descricao').textContent = '';
  registros.replaceChildren();
  formulario.hidden = false;
  formulario.reset();
  usuario.focus();
});

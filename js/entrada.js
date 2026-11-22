const chaveFicha = 'belfegor-ficha-v1';
const chaveSessao = 'belfegor-sessao-v1';
const formulario = document.getElementById('entrada');
const arquivos = document.getElementById('documentos');
const identificacao = document.getElementById('identificacao');
const estado = document.getElementById('estado-arquivos');
const resultado = document.getElementById('resultado');
const previews = document.getElementById('previews');
let selecao = 0;
let pronto = false;
let urls = [];

function identidade(dados) {
  const nome = typeof dados?.nome === 'string' ? dados.nome.trim() : '';
  const ident = typeof dados?.ident === 'string' ? dados.ident.trim().toUpperCase() : '';
  const { patente, acesso } = dados ?? {};
  if (!nome || nome.length > 100 || !/^BF-\d{5}$/.test(ident) ||
      !/^G-[0-6]$/.test(patente) || !/^NA-[0-4]$/.test(acesso)) return null;
  return { nome, ident, patente, acesso };
}

function entrar(sessao) {
  try {
    localStorage.setItem(chaveSessao, sessao);
    sessionStorage.removeItem(chaveSessao);
    window.location.assign('index.html');
  } catch {
    resultado.textContent = 'Não foi possível iniciar a sessão neste navegador.';
  }
}

try {
  const ficha = JSON.parse(localStorage.getItem(chaveFicha));
  const perfil = identidade(ficha);
  if (perfil) {
    document.getElementById('registro-local').hidden = false;
    document.getElementById('nome-local').textContent = perfil.nome + ' · ' + perfil.ident;
    document.getElementById('entrar-local').addEventListener('click', () => entrar(ficha.ident));
  }
} catch {
  // A entrada por documento segue disponível.
}

function limparPreviews() {
  previews.replaceChildren();
  for (const url of urls) URL.revokeObjectURL(url);
  urls = [];
}

arquivos.addEventListener('change', async () => {
  const atual = ++selecao;
  pronto = false;
  identificacao.hidden = true;
  identificacao.disabled = true;
  estado.textContent = '';
  resultado.textContent = '';
  limparPreviews();
  for (const campo of ['nome', 'ident', 'patente', 'acesso']) formulario.elements[campo].value = '';
  const selecionados = [...arquivos.files];
  if (!selecionados.length) return;
  if (selecionados.length > 3 || selecionados.some(arquivo => arquivo.size > 25 * 1024 * 1024)) {
    estado.textContent = 'Selecione até três arquivos, com até 25 MB por arquivo.';
    return;
  }

  estado.textContent = 'Lendo documentos…';
  let perfil;
  try {
    for (const arquivo of selecionados) {
      if (/\.json$/i.test(arquivo.name)) {
        if (perfil) throw new Error('Selecione apenas um backup JSON.');
        perfil = identidade(JSON.parse(await arquivo.text()));
        if (!perfil) throw new Error('O JSON não contém um registro funcional com identificação completa.');
      } else if (/\.(png|jpe?g)$/i.test(arquivo.name)) {
        const imagem = new Image();
        const url = URL.createObjectURL(arquivo);
        urls.push(url);
        imagem.src = url;
        imagem.alt = arquivo.name;
        await imagem.decode();
        if (atual !== selecao) return;
        const figura = document.createElement('figure');
        const legenda = document.createElement('figcaption');
        legenda.textContent = arquivo.name;
        figura.append(imagem, legenda);
        previews.append(figura);
      } else {
        throw new Error('Use um documento em PNG, JPG ou JSON.');
      }
      if (atual !== selecao) return;
    }
    if (perfil) {
      for (const [campo, valor] of Object.entries(perfil)) formulario.elements[campo].value = valor;
    }
    pronto = true;
    identificacao.hidden = false;
    identificacao.disabled = false;
    estado.textContent = perfil ? 'Identificação preenchida a partir do backup.' : 'Os documentos estão abertos. Copie os dados impressos para entrar.';
  } catch (erro) {
    if (atual !== selecao) return;
    limparPreviews();
    estado.textContent = erro instanceof SyntaxError ? 'O arquivo JSON não pôde ser lido.' : erro.message;
  }
});

formulario.addEventListener('submit', evento => {
  evento.preventDefault();
  if (!pronto) return;
  const perfil = identidade(Object.fromEntries(new FormData(formulario)));
  if (!perfil) {
    resultado.textContent = 'Confira o nome, o identificador, a patente e o nível de acesso.';
    return;
  }
  entrar(JSON.stringify(perfil));
});

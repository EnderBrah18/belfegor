import { contaEditorial, visivel } from './visibilidade.js?v=2';
import { chaveSessao } from './credenciais.js?v=2';

const resultado = document.getElementById('resultado');
const entrada = document.getElementById('busca-global');
const termo = new URLSearchParams(location.search).get('codigo')?.trim().slice(0, 64) ?? '';
const normalizar = valor => valor.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

let geracao = 0;

async function buscar() {
  const atual = ++geracao;
  if (!termo) {
    resultado.textContent = 'Use a busca no topo para consultar o acervo.';
    return;
  }

  entrada.value = termo;
  resultado.textContent = 'Consultando registros…';
  try {
    const conta = contaEditorial();
    const fontes = await Promise.all(['documentos', 'comunicados'].map(async nome => {
      const resposta = await fetch('dados/' + nome + '.json');
      if (!resposta.ok) throw new Error('Catálogo indisponível');
      return resposta.json();
    }));
    const perfil = await conta;
    if (atual !== geracao) return;
    const chave = normalizar(termo);
    const registros = fontes.flat().filter(item => visivel(item, perfil) && normalizar(item.codigo + ' ' + item.titulo).includes(chave));
    if (!registros.length) {
      resultado.textContent = 'Nenhum resultado para “' + termo + '”.';
      return;
    }

    const lista = document.createElement('ul');
    lista.className = 'records';
    for (const registro of registros) {
      const item = document.createElement('li');
      const titulo = document.createElement('a');
      titulo.href = registro.href || 'intercom.html?v=mural';
      titulo.textContent = registro.codigo + ' · ' + registro.titulo;
      const resumo = document.createElement('p');
      resumo.textContent = registro.resumo;
      item.append(titulo, resumo);
      lista.append(item);
    }
    resultado.replaceChildren(lista);
  } catch {
    if (atual === geracao) resultado.textContent = 'Consulta indisponível. Tente novamente.';
  }
}

addEventListener('pageshow', evento => { if (evento.persisted) buscar(); });
addEventListener('storage', evento => { if (!evento.key || evento.key === chaveSessao) buscar(); });
document.querySelector('[data-bf-logout]')?.addEventListener('click', () => queueMicrotask(buscar));
buscar();

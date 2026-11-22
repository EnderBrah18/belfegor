import { contaEditorial, visivel } from './visibilidade.js?v=3';
import { chaveSessao } from './credenciais.js?v=3';

const raizPortal = new URL('../', import.meta.url);
const fontes = new Map();

function consultar(arquivo) {
  if (!fontes.has(arquivo)) {
    fontes.set(arquivo, fetch(new URL('dados/' + arquivo + '.json', raizPortal)).then(resposta => {
      if (!resposta.ok) throw new Error('Consulta indisponível');
      return resposta.json();
    }));
  }
  return fontes.get(arquivo);
}

let geracao = 0;

async function mostrarLista(destino, conta, atual) {
  try {
    const { registros, limite, edicao } = destino.dataset;
    const dados = await consultar(registros);
    if (atual !== geracao) return;
    const itens = dados.filter(registro => visivel(registro, conta) && (!edicao || registro.edicao === edicao));
    if (!itens.length) {
      destino.textContent = 'Nenhum registro disponível.';
      return;
    }

    const lista = document.createElement('ul');
    lista.className = 'records';
    for (const registro of itens.slice(0, limite ? Number(limite) : itens.length)) {
      const item = document.createElement('li');
      const titulo = document.createElement('h3');
      if (registro.href) {
        const link = document.createElement('a');
        link.href = new URL(registro.href, raizPortal);
        link.textContent = registro.titulo;
        titulo.append(link);
      } else {
        titulo.textContent = registro.titulo;
      }
      const resumo = document.createElement('p');
      resumo.textContent = registro.resumo;
      const meta = document.createElement('p');
      meta.className = 'meta';
      meta.textContent = [registro.codigo, registro.setor, registro.referencia, registro.situacao, registro.revisao && 'Revisão ' + registro.revisao].filter(Boolean).join(' · ');
      item.append(titulo, meta, resumo);
      lista.append(item);
    }
    destino.replaceChildren(lista);
  } catch {
    if (atual === geracao) destino.textContent = 'Não foi possível consultar os registros.';
  }
}

const listas = [...document.querySelectorAll('[data-registros]')];
const documento = document.querySelector('[data-documento]');
const estado = document.querySelector('[data-documento-estado]');

async function atualizar() {
  const atual = ++geracao;
  listas.forEach(lista => lista.replaceChildren());
  if (documento) documento.hidden = true;
  const conta = await contaEditorial();
  if (atual !== geracao) return;
  listas.forEach(lista => mostrarLista(lista, conta, atual));
  if (!documento) return;
  try {
    const catalogo = await consultar('documentos');
    if (atual !== geracao) return;
    const item = catalogo.find(registro => registro.codigo === documento.dataset.documento);
    const permitido = Boolean(item && visivel(item, conta));
    documento.hidden = !permitido;
    estado.hidden = permitido;
    estado.textContent = permitido ? '' : 'Documento indisponível para sua credencial.';
  } catch {
    if (atual === geracao) {
      estado.hidden = false;
      estado.textContent = 'Não foi possível consultar o documento.';
    }
  }
}

addEventListener('pageshow', evento => { if (evento.persisted) atualizar(); });
addEventListener('storage', evento => { if (!evento.key || evento.key === chaveSessao) atualizar(); });
document.querySelector('[data-bf-logout]')?.addEventListener('click', () => queueMicrotask(atualizar));
atualizar();

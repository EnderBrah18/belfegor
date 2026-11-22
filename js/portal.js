const raizPortal = new URL('../', document.currentScript.src);
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

async function mostrarLista(destino) {
  try {
    const { registros, limite, edicao } = destino.dataset;
    const dados = await consultar(registros);
    const itens = edicao ? dados.filter(registro => registro.edicao === edicao) : dados;
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
    destino.textContent = 'Não foi possível consultar os registros.';
  }
}

document.querySelectorAll('[data-registros]').forEach(mostrarLista);

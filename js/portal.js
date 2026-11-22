async function mostrarLista(id, arquivo, limite) {
  const destino = document.getElementById(id);
  if (!destino) return;

  try {
    const resposta = await fetch('dados/' + arquivo + '.json');
    if (!resposta.ok) throw new Error('Consulta indisponível');
    const registros = await resposta.json();
    if (!registros.length) {
      destino.textContent = 'Nenhum registro disponível.';
      return;
    }

    const lista = document.createElement('ul');
    lista.className = 'records';
    for (const registro of registros.slice(0, limite ?? registros.length)) {
      const item = document.createElement('li');
      const titulo = document.createElement('h3');
      const resumo = document.createElement('p');

      if (registro.href) {
        const link = document.createElement('a');
        link.href = registro.href;
        link.textContent = registro.titulo;
        titulo.append(link);
      } else {
        titulo.textContent = registro.titulo;
      }
      item.append(titulo);

      if (registro.codigo) {
        const metadados = document.createElement('p');
        metadados.className = 'meta';
        metadados.textContent = [registro.codigo, registro.setor, registro.revisao && 'Revisão ' + registro.revisao].filter(Boolean).join(' · ');
        item.append(metadados);
      }

      resumo.textContent = registro.resumo;
      item.append(resumo);
      lista.append(item);
    }
    destino.replaceChildren(lista);
  } catch {
    destino.textContent = 'Não foi possível consultar os registros. Atualize a página para tentar novamente.';
  }
}

const inicio = Boolean(document.querySelector('.hero'));
mostrarLista('comunicados', 'comunicados', inicio ? 3 : undefined);
mostrarLista('arquivo', 'documentos');
mostrarLista('diretorio', 'departamentos');

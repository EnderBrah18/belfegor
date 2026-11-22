const formulario = document.getElementById('consulta');
const codigo = document.getElementById('codigo');
const resultado = document.getElementById('resultado');
let consultaAtual = 0;

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const consulta = ++consultaAtual;
  const identificador = codigo.value.trim().toUpperCase();
  if (!identificador) {
    resultado.textContent = 'Digite um identificador para consultar.';
    return;
  }
  resultado.textContent = 'Consultando registros…';

  try {
    const resposta = await fetch('dados/documentos.json');
    if (!resposta.ok) throw new Error('Catálogo indisponível');
    const documentos = await resposta.json();
    if (consulta !== consultaAtual) return;

    const documento = documentos.find((item) => item.codigo.toUpperCase() === identificador);
    if (!documento) {
      resultado.textContent = 'Nenhum documento encontrado para ' + identificador + '.';
      return;
    }

    const link = document.createElement('a');
    link.href = documento.href;
    link.textContent = documento.titulo;
    resultado.replaceChildren(documento.codigo + ' · ', link);
  } catch {
    if (consulta === consultaAtual) resultado.textContent = 'Catálogo indisponível. Tente novamente.';
  }
});

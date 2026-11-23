export const chaveComunicado = (tipo, conta) => 'belfegor-comunicados-' + tipo + ':' + (conta?.usuario ?? 'visitante');

export function abrirComunicado(codigo) {
  return 'comunicado.html?codigo=' + encodeURIComponent(codigo);
}

export function obterConjunto(chave) {
  try { return new Set(JSON.parse(localStorage.getItem(chave) ?? '[]')); }
  catch { return new Set(); }
}

export function alterarConjunto(chave, codigo, adicionar = true) {
  const conjunto = obterConjunto(chave);
  if (adicionar) conjunto.add(codigo);
  else conjunto.delete(codigo);
  localStorage.setItem(chave, JSON.stringify([...conjunto]));
}

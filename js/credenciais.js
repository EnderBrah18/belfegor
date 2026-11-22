export const chaveSessao = 'belfegor-conta-gm-v1';

export async function buscarConta(usuario) {
  const url = new URL('../dados/funcionarios.json', import.meta.url);
  const resposta = await fetch(url, { cache: 'no-store' });
  if (!resposta.ok) throw new Error('Cadastro indisponível');
  const contas = await resposta.json();
  return contas.find(conta => conta.usuario === usuario) ?? null;
}

export async function assinatura(senha) {
  const bytes = new TextEncoder().encode(senha);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export const chaveSessao = 'belfegor-conta-assinada-v1';

const chavePublica = {"kty":"EC","x":"rC7tLLn1u3ZBUKXavEaWBfNjoXxNSZCAS7T8zNckK5U","y":"F36RSfDpMswpt906ea5O0nPXeiWuQI5gdPDUbvCK4Vg","crv":"P-256"};
const formatoCodigo = /^[A-Za-z0-9_-]{1,300}\.[A-Za-z0-9_-]{86}$/;
const decodificar = valor => Uint8Array.from(atob(valor.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
let chaveImportada;

export async function buscarConta(usuario) {
  const url = new URL('../dados/funcionarios.json', import.meta.url);
  const resposta = await fetch(url, { cache: 'no-store' });
  if (!resposta.ok) throw new Error('Cadastro indisponível');
  const contas = await resposta.json();
  return contas.find(conta => conta.usuario === usuario) ?? null;
}

export async function validarCodigo(codigo, usuario) {
  if (typeof codigo !== 'string' || !formatoCodigo.test(codigo)) return null;
  const [conteudo, assinatura] = codigo.split('.');
  chaveImportada ??= crypto.subtle.importKey('jwk', chavePublica, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  const valido = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    await chaveImportada,
    decodificar(assinatura),
    new TextEncoder().encode(conteudo)
  );
  if (!valido) return null;

  const dados = JSON.parse(new TextDecoder().decode(decodificar(conteudo)));
  if (dados.versao !== 1 || typeof dados.usuario !== 'string' ||
      !Number.isSafeInteger(dados.emissao) || dados.emissao < 1 ||
      (usuario !== undefined && dados.usuario !== usuario)) return null;

  const conta = await buscarConta(dados.usuario);
  return conta?.ativo && conta.emissao === dados.emissao ? conta : null;
}

export async function contaDaSessao() {
  const codigo = localStorage.getItem(chaveSessao);
  return codigo ? validarCodigo(codigo) : null;
}

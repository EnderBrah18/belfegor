export const chaveSessao = 'belfegor-perfil-ficcional-v1';

async function buscarConta(usuario) {
  const url = new URL('../dados/funcionarios.json', import.meta.url);
  const resposta = await fetch(url, { cache: 'no-store' });
  if (!resposta.ok) throw new Error('Cadastro indisponível');
  const contas = await resposta.json();
  return contas.find(conta => conta.usuario === usuario && conta.ativo) ?? null;
}

function perfil(conta) {
  const { senha, ...dados } = conta;
  return dados;
}

export async function entrarComSenha(usuario, senha) {
  const conta = await buscarConta(usuario);
  if (!conta || !senha || conta.senha !== senha) return null;
  return perfil(conta);
}

export async function contaDaSessao() {
  const sessao = JSON.parse(localStorage.getItem(chaveSessao));
  if (!sessao || typeof sessao.usuario !== 'string') return null;
  const conta = await buscarConta(sessao.usuario);
  return conta && (conta.revisao ?? 1) === sessao.revisao ? perfil(conta) : null;
}

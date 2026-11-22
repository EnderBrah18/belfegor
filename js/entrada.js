import { assinatura, buscarConta, chaveSessao } from './credenciais.js';

const form = document.getElementById('entrada');
const usuario = document.getElementById('usuario');
const senha = document.getElementById('senha');
const resultado = document.getElementById('resultado');
const botao = form.querySelector('button');

form.addEventListener('submit', async evento => {
  evento.preventDefault();
  botao.disabled = true;
  resultado.textContent = 'Consultando credencial…';
  try {
    const conta = await buscarConta(usuario.value.trim().toLowerCase());
    if (!conta?.ativo || conta.verificador !== await assinatura(senha.value)) {
      resultado.textContent = 'Credencial inválida ou desativada. Confira os dados com o GM.';
      return;
    }
    localStorage.setItem(chaveSessao, JSON.stringify({ usuario: conta.usuario, verificador: conta.verificador }));
    location.assign('index.html');
  } catch {
    resultado.textContent = 'Não foi possível consultar o cadastro. Tente novamente.';
  } finally {
    senha.value = '';
    botao.disabled = false;
  }
});

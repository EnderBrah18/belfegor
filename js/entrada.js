import { validarCodigo, chaveSessao } from './credenciais.js?v=2';

const form = document.getElementById('entrada');
const usuario = document.getElementById('usuario');
const codigo = document.getElementById('codigo');
const resultado = document.getElementById('resultado');
const botao = form.querySelector('button');

form.addEventListener('submit', async evento => {
  evento.preventDefault();
  botao.disabled = true;
  resultado.textContent = 'Consultando credencial…';
  try {
    const credencial = codigo.value.trim();
    const conta = await validarCodigo(credencial, usuario.value.trim().toLowerCase());
    if (!conta) {
      resultado.textContent = 'Credencial inválida ou desativada. Confira os dados com o GM.';
      return;
    }
    localStorage.setItem(chaveSessao, credencial);
    location.assign('index.html');
  } catch {
    resultado.textContent = 'Não foi possível consultar o cadastro. Tente novamente.';
  } finally {
    codigo.value = '';
    botao.disabled = false;
  }
});

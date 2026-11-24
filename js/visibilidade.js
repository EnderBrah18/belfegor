import { contaDaSessao } from './credenciais.js?v=3';

export async function contaEditorial() {
  try {
    return await contaDaSessao();
  } catch {
    return null;
  }
}

const nivel = (valor, formato) => typeof valor === 'string' && formato.test(valor) ? Number(valor.split('-')[1]) : -1;
const nivelValido = valor => Number.isInteger(valor) && valor >= 0 && valor <= 6;

export function visivel(registro, conta) {
  if (!Object.hasOwn(registro, 'visibilidade')) return true;
  if (!conta?.ativo || !registro.visibilidade || typeof registro.visibilidade !== 'object') return false;

  if (conta.patente === 'G-7' && conta.acesso === 'NA-7') return true;

  const { naExato, naMinimo, patenteExata, patenteMinima, departamentos } = registro.visibilidade;
  if (naExato !== undefined &&
      (!nivelValido(naExato) || nivel(conta.acesso, /^NA-[0-6]$/) !== naExato)) return false;
  if (naMinimo !== undefined &&
      (!nivelValido(naMinimo) || nivel(conta.acesso, /^NA-[0-6]$/) < naMinimo)) return false;
  if (patenteExata !== undefined &&
      (!nivelValido(patenteExata) || nivel(conta.patente, /^G-[0-6]$/) !== patenteExata)) return false;
  if (patenteMinima !== undefined &&
      (!nivelValido(patenteMinima) || nivel(conta.patente, /^G-[0-6]$/) < patenteMinima)) return false;
  if (departamentos !== undefined &&
      (!Array.isArray(departamentos) || !departamentos.includes(conta.departamento))) return false;
  return true;
}

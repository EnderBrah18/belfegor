// Relógio editorial do expediente. Avança quando a cronologia publicada muda.
const minuto = 60_000;
const dia = 24 * 60 * minuto;
const agora = Date.UTC(1900,5,12,14,35);

export function lerData(valor) {
  if (typeof valor !== 'string') return null;
  const curta = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/.exec(valor);
  if (curta) return Date.UTC(+curta[3],+curta[2]-1,+curta[1],+(curta[4] ?? 0),+(curta[5] ?? 0));
  if (/^\d{4}-\d{2}-\d{2}/.test(valor)) {
    const data = Date.parse(valor);
    return Number.isFinite(data) ? data : null;
  }
  if (/^\d{4}$/.test(valor)) return Date.UTC(+valor,0,1);
  return null;
}

function dataDoItem(item) {
  const datas = [item.atualizadoEm,item.publicadoEm,item.referencia].map(lerData).filter(d => d !== null && d <= agora);
  return datas.length ? Math.max(...datas) : null;
}

export const compararRecentes = (a,b) => (dataDoItem(b) ?? -Infinity) - (dataDoItem(a) ?? -Infinity) || 0;

export function avisoRecente(item) {
  const data = dataDoItem(item);
  return !item.arquivado && item.edicao === 'recente' && data !== null && Math.floor(agora/dia)-Math.floor(data/dia) <= 1;
}

export function documentoRecente(item) {
  const data = dataDoItem(item);
  return !item.arquivado && data !== null && agora - data <= 90 * dia;
}

export function quandoExpediente(item) {
  const data = dataDoItem(item);
  if (data === null) return item.referencia;
  const dias = Math.floor(agora/dia) - Math.floor(data/dia);
  const minutos = Math.floor((agora-data)/minuto);
  if (dias === 0 && minutos < 60) return minutos <= 0 ? 'Agora' : 'Há ' + minutos + ' min';
  const hora = new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'}).format(data);
  if (dias === 0) return 'Hoje, ' + hora;
  if (dias === 1) return 'Ontem, ' + hora;
  return item.referencia;
}

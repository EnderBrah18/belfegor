import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const [arquivoChave, usuario, numero] = process.argv.slice(2);
const emissao = Number(numero);
if (!arquivoChave || !/^[a-z0-9._-]{1,48}$/.test(usuario ?? '') || !Number.isSafeInteger(emissao) || emissao < 1) {
  console.error('Uso: node scripts/emitir-credencial.mjs <chave-privada.pem> <usuario> <emissao>');
  process.exit(1);
}
const key = createPrivateKey(readFileSync(arquivoChave));
const conteudo = Buffer.from(JSON.stringify({ usuario, versao: 1, emissao })).toString('base64url');
const assinatura = sign('sha256', Buffer.from(conteudo), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
console.log(conteudo + '.' + assinatura);

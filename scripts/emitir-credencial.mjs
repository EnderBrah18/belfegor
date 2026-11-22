import { createHash, randomBytes } from 'node:crypto';

const senha = randomBytes(18).toString('base64url');
const verificador = createHash('sha256').update(senha, 'utf8').digest('hex');

console.log('Senha de jogo para entregar ao jogador em privado: ' + senha);
console.log('Verificador para o cadastro: ' + verificador);

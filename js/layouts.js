// Layouts de teclado.
// Cada layout é uma lista de fileiras (de cima para baixo). Cada fileira tem
// o deslocamento horizontal da primeira tecla (em larguras de tecla) e as
// teclas da esquerda para a direita.
// Um espaço marca uma tecla morta (acento): ela ocupa lugar, mas não vira ponto.
const LAYOUTS = {
  abnt2: {
    nome: 'ABNT2 (Brasil)',
    fileiras: [
      { desloc: 0, teclas: "'1234567890-=" },
      { desloc: 1.5, teclas: 'qwertyuiop [' },
      { desloc: 1.75, teclas: 'asdfghjklç ]' },
      { desloc: 1.25, teclas: '\\zxcvbnm,.;/' },
    ],
  },
  us: {
    nome: 'QWERTY (EUA)',
    fileiras: [
      { desloc: 0, teclas: '`1234567890-=' },
      { desloc: 1.5, teclas: 'qwertyuiop[]\\' },
      { desloc: 1.75, teclas: "asdfghjkl;'" },
      { desloc: 2.25, teclas: 'zxcvbnm,./' },
    ],
  },
  azerty: {
    nome: 'AZERTY (França)',
    fileiras: [
      { desloc: 0, teclas: '²&é"\'(-è_çà)=' },
      { desloc: 1.5, teclas: 'azertyuiop $' },
      { desloc: 1.75, teclas: 'qsdfghjklmù*' },
      { desloc: 1.25, teclas: '<wxcvbn,;:!' },
    ],
  },
  qwertz: {
    nome: 'QWERTZ (Alemanha)',
    fileiras: [
      { desloc: 0, teclas: ' 1234567890ß ' },
      { desloc: 1.5, teclas: 'qwertzuiopü+' },
      { desloc: 1.75, teclas: 'asdfghjklöä#' },
      { desloc: 1.25, teclas: '<yxcvbnm,.-' },
    ],
  },
  dvorak: {
    nome: 'Dvorak',
    fileiras: [
      { desloc: 0, teclas: '`1234567890[]' },
      { desloc: 1.5, teclas: "',.pyfgcrl/=\\" },
      { desloc: 1.75, teclas: 'aoeuidhtns-' },
      { desloc: 2.25, teclas: ';qjkxbmwvz' },
    ],
  },
  colemak: {
    nome: 'Colemak',
    fileiras: [
      { desloc: 0, teclas: '`1234567890-=' },
      { desloc: 1.5, teclas: 'qwfpgjluy;[]\\' },
      { desloc: 1.75, teclas: "arstdhneio'" },
      { desloc: 2.25, teclas: 'zxcvbkm,./' },
    ],
  },
};

// Calcula a posição (centro) de cada tecla do layout.
// Retorna um mapa caractere -> {x, y} e a lista de todas as teclas
// (inclusive as mortas), usada para desenhar o contorno do teclado.
function montarLayout(id) {
  const mapa = new Map();
  const teclas = [];
  LAYOUTS[id].fileiras.forEach((fileira, linha) => {
    [...fileira.teclas].forEach((ch, i) => {
      const pos = { x: fileira.desloc + i + 0.5, y: linha + 0.5 };
      teclas.push({ ch, ...pos });
      if (ch !== ' ') mapa.set(ch, pos);
    });
  });
  return { mapa, teclas };
}

// Par de pontos mais próximo — Dividir e Conquistar, O(n log n).
//
// Além do resultado, o algoritmo registra uma lista de "passos" que a
// visualização reproduz depois, um por um.

export type Ponto = { ch: string; x: number; y: number };
export type Par = { a: Ponto; b: Ponto; d: number };

export type Passo =
  | { tipo: 'base'; ini: number; fim: number }
  | { tipo: 'dividir'; ini: number; fim: number; meio: number; xCorte: number }
  | { tipo: 'comparar'; a: Ponto; b: Ponto; d: number; fase: 'base' | 'faixa' }
  | { tipo: 'novoMelhor'; melhor: Par }
  | { tipo: 'combinar'; ini: number; fim: number; xCorte: number; melhor: Par }
  | { tipo: 'faixa'; ini: number; fim: number; xCorte: number; d: number; faixa: Ponto[] }
  | { tipo: 'resolvido'; ini: number; fim: number; melhor: Par }
  | { tipo: 'fim'; melhor: Par };

export type Resultado = {
  melhor: Par | null;
  passos: Passo[];
  comparacoes: number;
  px: Ponto[];
};

export function distancia(a: Ponto, b: Ponto): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Versão ingênua O(n²): compara todos os pares. Serve para conferir o
// resultado e para comparar a quantidade de comparações.
export function forcaBruta(pontos: Ponto[]): { melhor: Par | null; comparacoes: number } {
  let melhor: Par | null = null;
  let comparacoes = 0;
  for (let i = 0; i < pontos.length; i++) {
    for (let j = i + 1; j < pontos.length; j++) {
      comparacoes++;
      const d = distancia(pontos[i], pontos[j]);
      if (!melhor || d < melhor.d) melhor = { a: pontos[i], b: pontos[j], d };
    }
  }
  return { melhor, comparacoes };
}

export function parMaisProximo(pontos: Ponto[]): Resultado {
  const passos: Passo[] = [];
  let comparacoes = 0;

  // Ordena uma vez por x e uma vez por y: O(n log n).
  const px = [...pontos].sort((a, b) => a.x - b.x || a.y - b.y);
  const py = [...pontos].sort((a, b) => a.y - b.y || a.x - b.x);

  // Posição de cada ponto em px, para saber de que lado do corte ele está.
  const indice = new Map(px.map((p, i) => [p, i]));

  function comparar(a: Ponto, b: Ponto, melhor: Par | null, fase: 'base' | 'faixa'): Par {
    comparacoes++;
    const d = distancia(a, b);
    passos.push({ tipo: 'comparar', a, b, d, fase });
    if (!melhor || d < melhor.d) {
      melhor = { a, b, d };
      passos.push({ tipo: 'novoMelhor', melhor });
    }
    return melhor;
  }

  // Resolve o subproblema px[ini..fim). porY são os mesmos pontos ordenados por y.
  function resolver(ini: number, fim: number, porY: Ponto[]): Par {
    const n = fim - ini;

    // Caso base: com até 3 pontos, a força bruta é mais barata.
    if (n <= 3) {
      passos.push({ tipo: 'base', ini, fim });
      let melhor: Par | null = null;
      for (let i = ini; i < fim; i++) {
        for (let j = i + 1; j < fim; j++) {
          melhor = comparar(px[i], px[j], melhor, 'base');
        }
      }
      // n >= 2 sempre: com n >= 4 a divisão deixa pelo menos 2 de cada lado.
      passos.push({ tipo: 'resolvido', ini, fim, melhor: melhor! });
      return melhor!;
    }

    // Dividir: uma reta vertical separa a metade esquerda da direita.
    const meio = ini + Math.floor(n / 2);
    const xCorte = (px[meio - 1].x + px[meio].x) / 2;
    passos.push({ tipo: 'dividir', ini, fim, meio, xCorte });

    // Separa porY em dois lados sem reordenar: O(n).
    const esqY = porY.filter((p) => indice.get(p)! < meio);
    const dirY = porY.filter((p) => indice.get(p)! >= meio);

    // Conquistar: resolve cada metade recursivamente.
    const esq = resolver(ini, meio, esqY);
    const dir = resolver(meio, fim, dirY);
    let melhor = esq.d <= dir.d ? esq : dir;
    passos.push({ tipo: 'combinar', ini, fim, xCorte, melhor });

    // Combinar: o par mais próximo pode ter um ponto de cada lado.
    // Só interessam pontos a menos de d da reta (a "faixa").
    const faixa = porY.filter((p) => Math.abs(p.x - xCorte) < melhor.d);
    passos.push({ tipo: 'faixa', ini, fim, xCorte, d: melhor.d, faixa });

    // Na faixa ordenada por y, cada ponto só precisa ser comparado com os
    // vizinhos a menos de d acima dele — no máximo 7, então a faixa é O(n).
    for (let i = 0; i < faixa.length; i++) {
      for (let j = i + 1; j < faixa.length && faixa[j].y - faixa[i].y < melhor.d; j++) {
        melhor = comparar(faixa[i], faixa[j], melhor, 'faixa');
      }
    }

    passos.push({ tipo: 'resolvido', ini, fim, melhor });
    return melhor;
  }

  if (pontos.length < 2) return { melhor: null, passos, comparacoes, px };

  const melhor = resolver(0, px.length, py);
  passos.push({ tipo: 'fim', melhor });
  return { melhor, passos, comparacoes, px };
}

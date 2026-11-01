// Estado da animação e desenho no canvas.

import type { Tecla } from './layouts';
import type { Par, Passo, Ponto } from './parMaisProximo';

type Intervalo = { ini: number; fim: number };

export type Estado = {
  ativo: Intervalo | null; // subproblema atual
  cortes: (Intervalo & { x: number })[]; // retas de divisão visíveis
  faixa: { xCorte: number; d: number; faixa: Ponto[] } | null;
  comparando: { a: Ponto; b: Ponto } | null; // par sendo comparado agora
  melhorAtual: Par | null; // melhor par do subproblema atual
  resolvidos: (Intervalo & { melhor: Par })[]; // melhor par de cada subproblema já resolvido
  fim: Par | null; // resposta final
};

export function estadoInicial(): Estado {
  return {
    ativo: null,
    cortes: [],
    faixa: null,
    comparando: null,
    melhorAtual: null,
    resolvidos: [],
    fim: null,
  };
}

const dentro = (r: Intervalo, ini: number, fim: number) => r.ini >= ini && r.fim <= fim;

// Aplica um passo do algoritmo ao estado e devolve a descrição do passo.
export function aplicarPasso(estado: Estado, passo: Passo): string {
  const nome = (p: Ponto) => `'${p.ch}'`;
  switch (passo.tipo) {
    case 'base':
      estado.ativo = { ini: passo.ini, fim: passo.fim };
      estado.melhorAtual = null;
      estado.faixa = null;
      return `Caso base: ${passo.fim - passo.ini} pontos, força bruta`;

    case 'dividir':
      estado.ativo = { ini: passo.ini, fim: passo.fim };
      estado.cortes.push({ ini: passo.ini, fim: passo.fim, x: passo.xCorte });
      estado.melhorAtual = null;
      estado.faixa = null;
      return `Dividir: ${passo.fim - passo.ini} pontos → ${passo.meio - passo.ini} à esquerda e ${passo.fim - passo.meio} à direita`;

    case 'comparar':
      estado.comparando = passo;
      return `Comparando ${nome(passo.a)} e ${nome(passo.b)}: ${passo.d.toFixed(2)}`;

    case 'novoMelhor':
      estado.melhorAtual = passo.melhor;
      return `Novo melhor: ${nome(passo.melhor.a)}–${nome(passo.melhor.b)} = ${passo.melhor.d.toFixed(2)}`;

    case 'combinar':
      estado.ativo = { ini: passo.ini, fim: passo.fim };
      estado.comparando = null;
      estado.melhorAtual = passo.melhor;
      estado.resolvidos = estado.resolvidos.filter((r) => !dentro(r, passo.ini, passo.fim));
      return `Combinar: menor distância entre as metades d = ${passo.melhor.d.toFixed(2)}`;

    case 'faixa':
      estado.faixa = passo;
      return `Faixa: ${passo.faixa.length} pontos a menos de d = ${passo.d.toFixed(2)} da reta`;

    case 'resolvido':
      estado.comparando = null;
      estado.faixa = null;
      estado.cortes = estado.cortes.filter((c) => !dentro(c, passo.ini, passo.fim));
      estado.resolvidos = estado.resolvidos.filter((r) => !dentro(r, passo.ini, passo.fim));
      estado.resolvidos.push({ ini: passo.ini, fim: passo.fim, melhor: passo.melhor });
      return `Resolvido: ${nome(passo.melhor.a)}–${nome(passo.melhor.b)} = ${passo.melhor.d.toFixed(2)}`;

    case 'fim':
      estado.ativo = null;
      estado.resolvidos = [];
      estado.melhorAtual = null;
      estado.fim = passo.melhor;
      return `Par mais próximo: ${nome(passo.melhor.a)} e ${nome(passo.melhor.b)} — distância ${passo.melhor.d.toFixed(2)} tecla(s)`;
  }
}

export class Visualizador {
  private ctx: CanvasRenderingContext2D;
  private teclas: Tecla[] = [];
  private u = 1;
  private ox = 0;
  private oy = 0;
  private w = 0;
  private h = 0;
  mostrarTeclado = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.redimensionar();
  }

  definirTeclas(teclas: Tecla[]) {
    this.teclas = teclas;
    this.redimensionar();
  }

  redimensionar() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Tamanho de uma tecla em pixels, para o teclado caber na tela.
    const largura = Math.max(1, ...this.teclas.map((t) => t.x + 0.5));
    const altura = 4;
    this.u = Math.min((w * 0.9) / largura, (h * 0.6) / altura);
    this.ox = (w - largura * this.u) / 2;
    this.oy = (h - altura * this.u) / 2;
    this.w = w;
    this.h = h;
  }

  private tx(x: number) { return this.ox + x * this.u; }
  private ty(y: number) { return this.oy + y * this.u; }

  private linha(a: Ponto, b: Ponto, cor: string, espessura: number) {
    const ctx = this.ctx;
    ctx.strokeStyle = cor;
    ctx.lineWidth = espessura;
    ctx.beginPath();
    ctx.moveTo(this.tx(a.x), this.ty(a.y));
    ctx.lineTo(this.tx(b.x), this.ty(b.y));
    ctx.stroke();
  }

  desenhar(pontos: Ponto[], estado?: Estado, px?: Ponto[]) {
    const { ctx, u } = this;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.w, this.h);

    if (this.mostrarTeclado) {
      ctx.strokeStyle = '#1c1c1c';
      ctx.lineWidth = 1;
      for (const t of this.teclas) {
        ctx.strokeRect(this.tx(t.x - 0.45), this.ty(t.y - 0.45), u * 0.9, u * 0.9);
      }
    }

    const topo = this.ty(-0.5);
    const base = this.ty(4.5);
    const indice = new Map((px ?? []).map((p, i) => [p, i]));
    const naFaixa = new Set(estado?.faixa?.faixa ?? []);
    const ativo = estado?.ativo;
    const noAtivo = (p: Ponto) => {
      if (!ativo) return true;
      const i = indice.get(p)!;
      return i >= ativo.ini && i < ativo.fim;
    };

    if (estado && px) {
      // Região do subproblema atual.
      if (ativo) {
        const x0 = this.tx(px[ativo.ini].x - 0.5);
        const x1 = this.tx(px[ativo.fim - 1].x + 0.5);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.fillRect(x0, topo, x1 - x0, base - topo);
      }

      // Faixa de largura 2d em volta da reta de corte.
      if (estado.faixa) {
        const { xCorte, d } = estado.faixa;
        ctx.fillStyle = 'rgba(70, 150, 255, 0.18)';
        ctx.fillRect(this.tx(xCorte - d), topo, 2 * d * u, base - topo);
      }

      // Retas de divisão.
      ctx.setLineDash([6, 6]);
      for (const c of estado.cortes) {
        ctx.strokeStyle = 'rgba(255, 90, 90, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.tx(c.x), topo);
        ctx.lineTo(this.tx(c.x), base);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      for (const r of estado.resolvidos) {
        this.linha(r.melhor.a, r.melhor.b, 'rgba(0, 200, 120, 0.45)', 2);
      }
      if (estado.melhorAtual) {
        this.linha(estado.melhorAtual.a, estado.melhorAtual.b, '#00d27a', 3);
      }
      if (estado.comparando) {
        this.linha(estado.comparando.a, estado.comparando.b, '#ffd23f', 2);
      }
      if (estado.fim) {
        const { a, b } = estado.fim;
        ctx.shadowColor = '#00ff99';
        ctx.shadowBlur = 20;
        this.linha(a, b, '#00ff99', 4);
        ctx.strokeStyle = '#00ff99';
        ctx.lineWidth = 2;
        for (const p of [a, b]) {
          ctx.beginPath();
          ctx.arc(this.tx(p.x), this.ty(p.y), u * 0.42, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
    }

    // Os pontos: as próprias letras, na posição da tecla.
    ctx.font = `bold ${Math.round(u * 0.55)}px Consolas, "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of pontos) {
      let cor = '#fff';
      if (estado) {
        if (estado.fim) cor = p === estado.fim.a || p === estado.fim.b ? '#00ff99' : '#666';
        else if (naFaixa.has(p)) cor = '#8fc4ff';
        else if (!noAtivo(p)) cor = '#3a3a3a';
      }
      ctx.fillStyle = cor;
      const maiuscula = p.ch.toUpperCase(); // 'ß' vira "SS", então mantém a original
      ctx.fillText(maiuscula.length === 1 ? maiuscula : p.ch, this.tx(p.x), this.ty(p.y));
    }
  }
}

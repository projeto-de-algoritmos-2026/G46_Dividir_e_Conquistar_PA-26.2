'use client';

// Liga o teclado, o algoritmo e a visualização.

import { useEffect, useRef, useState } from 'react';
import { LAYOUTS, montarLayout, type IdLayout, type LayoutMontado } from '@/lib/layouts';
import { forcaBruta, parMaisProximo, type Ponto, type Resultado } from '@/lib/parMaisProximo';
import { aplicarPasso, estadoInicial, Visualizador, type Estado } from '@/lib/visualizador';

type Execucao = {
  resultado: Resultado;
  estado: Estado;
  passo: number;
  pausado: boolean;
  comparacoesBruta: number;
  timer?: ReturnType<typeof setTimeout>;
};

type Info = {
  n: number;
  passo?: number;
  total?: number;
  comparacoes?: number;
  comparacoesBruta?: number;
  pausado?: boolean;
};

const MSG_INICIAL = 'Digite algumas letras para criar pontos';

// 0 → 1200 ms por passo, 100 → 30 ms por passo
function atraso(velocidade: number) {
  return 1200 * Math.pow(30 / 1200, velocidade / 100);
}

export default function VisualizadorTeclado() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // A animação roda fora do ciclo do React: guardamos tudo em refs e só
  // usamos estado do React para o que aparece no painel.
  const tela = useRef<Visualizador | null>(null);
  const layout = useRef<LayoutMontado | null>(null);
  const pontos = useRef<Ponto[]>([]); // em ordem de digitação
  const execucao = useRef<Execucao | null>(null);
  const velocidadeRef = useRef(50);

  const [idLayout, setIdLayout] = useState<IdLayout>('abnt2');
  const [velocidade, setVelocidade] = useState(50);
  const [mostrarTeclado, setMostrarTeclado] = useState(false);
  const [status, setStatus] = useState(MSG_INICIAL);
  const [info, setInfo] = useState<Info>({ n: 0 });

  // ---------- Desenho ----------

  function desenhar() {
    const ex = execucao.current;
    tela.current?.desenhar(pontos.current, ex?.estado, ex?.resultado.px);
    setInfo({
      n: pontos.current.length,
      passo: ex?.passo,
      total: ex?.resultado.passos.length,
      comparacoes: ex?.resultado.comparacoes,
      comparacoesBruta: ex?.comparacoesBruta,
      pausado: ex?.pausado,
    });
  }

  // ---------- Execução passo a passo ----------

  function parar() {
    if (execucao.current) clearTimeout(execucao.current.timer);
    execucao.current = null;
    setStatus(pontos.current.length < 2 ? MSG_INICIAL : 'Pressione Enter para encontrar o par mais próximo');
    desenhar();
  }

  function rodar() {
    parar();
    const lista = pontos.current;
    if (lista.length < 2) {
      setStatus('Digite pelo menos 2 letras');
      return;
    }
    const resultado = parMaisProximo(lista);
    const bruta = forcaBruta(lista);
    if (Math.abs(bruta.melhor!.d - resultado.melhor!.d) > 1e-9) {
      console.error('Resultado diferente da força bruta!', bruta, resultado);
    }
    execucao.current = {
      resultado,
      estado: estadoInicial(),
      passo: 0,
      pausado: false,
      comparacoesBruta: bruta.comparacoes,
    };
    agendar();
  }

  function avancar() {
    const ex = execucao.current!;
    if (ex.passo >= ex.resultado.passos.length) return false;
    setStatus(aplicarPasso(ex.estado, ex.resultado.passos[ex.passo]));
    ex.passo++;
    desenhar();
    return true;
  }

  function agendar() {
    const ex = execucao.current;
    if (!ex) return;
    clearTimeout(ex.timer);
    if (!ex.pausado && avancar()) {
      ex.timer = setTimeout(agendar, atraso(velocidadeRef.current));
    }
  }

  // ---------- Pontos ----------

  function alternarPonto(ch: string) {
    const lista = pontos.current;
    const i = lista.findIndex((p) => p.ch === ch);
    if (i >= 0) lista.splice(i, 1);
    else lista.push({ ch, ...layout.current!.mapa.get(ch)! });
    parar();
  }

  // ---------- Efeitos ----------

  // Cria o canvas e recupera o layout salvo.
  useEffect(() => {
    tela.current = new Visualizador(canvasRef.current!);
    const salvo = localStorage.getItem('layout');
    if (salvo && salvo in LAYOUTS) setIdLayout(salvo as IdLayout);

    const aoRedimensionar = () => {
      tela.current?.redimensionar();
      desenhar();
    };
    window.addEventListener('resize', aoRedimensionar);
    return () => {
      window.removeEventListener('resize', aoRedimensionar);
      if (execucao.current) clearTimeout(execucao.current.timer);
    };
  }, []);

  // Troca de layout: os pontos já digitados vão para a posição da mesma
  // tecla no novo layout.
  useEffect(() => {
    const novo = montarLayout(idLayout);
    layout.current = novo;
    localStorage.setItem('layout', idLayout);
    tela.current?.definirTeclas(novo.teclas);
    pontos.current = pontos.current
      .filter((p) => novo.mapa.has(p.ch))
      .map((p) => ({ ch: p.ch, ...novo.mapa.get(p.ch)! }));
    parar();
  }, [idLayout]);

  useEffect(() => {
    if (tela.current) tela.current.mostrarTeclado = mostrarTeclado;
    desenhar();
  }, [mostrarTeclado]);

  useEffect(() => {
    velocidadeRef.current = velocidade;
  }, [velocidade]);

  // Teclado. As funções acima só usam refs, então registrar uma vez basta.
  useEffect(() => {
    function aoPressionar(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const ex = execucao.current;

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          rodar();
          return;
        case ' ':
          e.preventDefault();
          if (ex) {
            ex.pausado = !ex.pausado;
            agendar();
            desenhar();
          }
          return;
        case 'ArrowRight':
          if (ex) {
            ex.pausado = true;
            clearTimeout(ex.timer);
            avancar();
            desenhar();
          }
          return;
        case 'Backspace':
          e.preventDefault();
          pontos.current.pop();
          parar();
          return;
        case 'Escape':
          pontos.current = [];
          parar();
          return;
      }

      const ch = e.key.toLowerCase();
      if (ch.length === 1 && layout.current?.mapa.has(ch)) {
        e.preventDefault();
        alternarPonto(ch);
      }
    }
    window.addEventListener('keydown', aoPressionar);
    return () => window.removeEventListener('keydown', aoPressionar);
  }, []);

  // Tira o foco dos controles, senão as letras digitadas mexem neles.
  const soltarFoco = (e: React.SyntheticEvent<HTMLElement>) => e.currentTarget.blur();

  return (
    <>
      <canvas ref={canvasRef} />

      <div id="painel">
        <label>
          Teclado
          <select
            value={idLayout}
            onChange={(e) => {
              setIdLayout(e.target.value as IdLayout);
              soltarFoco(e);
            }}
          >
            {Object.entries(LAYOUTS).map(([id, { nome }]) => (
              <option key={id} value={id}>{nome}</option>
            ))}
          </select>
        </label>
        <label>
          Velocidade
          <input
            type="range"
            min={0}
            max={100}
            value={velocidade}
            onChange={(e) => setVelocidade(Number(e.target.value))}
            onPointerUp={soltarFoco}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={mostrarTeclado}
            onChange={(e) => {
              setMostrarTeclado(e.target.checked);
              soltarFoco(e);
            }}
          />{' '}
          mostrar teclas
        </label>
      </div>

      <div id="estatisticas">
        pontos: <b>{info.n}</b>
        {info.total !== undefined && (
          <>
            <br />passo: <b>{info.passo}/{info.total}</b>
            <br />comparações D&amp;C: <b>{info.comparacoes}</b>
            <br />comparações força bruta: <b>{info.comparacoesBruta}</b>
            {info.pausado && <><br /><b>PAUSADO</b></>}
          </>
        )}
      </div>

      <div id="status">{status}</div>

      <div id="ajuda">
        <kbd>letras</kbd> criar/remover ponto · <kbd>Enter</kbd> rodar · <kbd>Espaço</kbd> pausar ·{' '}
        <kbd>→</kbd> próximo passo · <kbd>Backspace</kbd> apagar último · <kbd>Esc</kbd> limpar
      </div>
    </>
  );
}

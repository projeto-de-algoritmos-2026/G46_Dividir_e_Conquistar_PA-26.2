// Liga o teclado, o algoritmo e a visualização.

const visualizador = new Visualizador(document.getElementById('tela'));
const seletorLayout = document.getElementById('layout');
const velocidade = document.getElementById('velocidade');
const caixaTeclado = document.getElementById('mostrarTeclado');
const linhaStatus = document.getElementById('status');
const estatisticas = document.getElementById('estatisticas');

let layout = null;
let pontos = []; // em ordem de digitação
let execucao = null; // { resultado, estado, passo, pausado, timer }

// ---------- Layout ----------

for (const [id, { nome }] of Object.entries(LAYOUTS)) {
  seletorLayout.add(new Option(nome, id));
}
seletorLayout.value = localStorage.getItem('layout') || 'abnt2';

function trocarLayout(id) {
  layout = montarLayout(id);
  localStorage.setItem('layout', id);
  visualizador.definirTeclas(layout.teclas);
  // Os pontos já digitados vão para a posição da mesma tecla no novo layout.
  pontos = pontos
    .filter((p) => layout.mapa.has(p.ch))
    .map((p) => ({ ch: p.ch, ...layout.mapa.get(p.ch) }));
  parar();
}

seletorLayout.addEventListener('change', () => {
  trocarLayout(seletorLayout.value);
  seletorLayout.blur(); // senão as letras digitadas mudam o select
});
caixaTeclado.addEventListener('change', () => {
  visualizador.mostrarTeclado = caixaTeclado.checked;
  caixaTeclado.blur();
  desenhar();
});
velocidade.addEventListener('change', () => velocidade.blur());

// ---------- Pontos ----------

function alternarPonto(ch) {
  const i = pontos.findIndex((p) => p.ch === ch);
  if (i >= 0) pontos.splice(i, 1);
  else pontos.push({ ch, ...layout.mapa.get(ch) });
  parar();
}

// ---------- Execução passo a passo ----------

function atraso() {
  // 0 → 1200 ms por passo, 100 → 30 ms por passo
  const t = velocidade.value / 100;
  return 1200 * Math.pow(30 / 1200, t);
}

function rodar() {
  parar();
  if (pontos.length < 2) {
    linhaStatus.textContent = 'Digite pelo menos 2 letras';
    return;
  }
  execucao = {
    resultado: parMaisProximo(pontos),
    estado: estadoInicial(),
    passo: 0,
    pausado: false,
    timer: null,
  };
  conferirComForcaBruta(execucao.resultado);
  agendar();
}

function parar() {
  if (execucao) clearTimeout(execucao.timer);
  execucao = null;
  linhaStatus.textContent = pontos.length < 2
    ? 'Digite algumas letras para criar pontos'
    : 'Pressione Enter para encontrar o par mais próximo';
  desenhar();
}

function avancar() {
  const { resultado, estado } = execucao;
  if (execucao.passo >= resultado.passos.length) return false;
  linhaStatus.textContent = aplicarPasso(estado, resultado.passos[execucao.passo]);
  execucao.passo++;
  desenhar();
  return true;
}

function agendar() {
  clearTimeout(execucao.timer);
  if (!execucao.pausado && avancar()) {
    execucao.timer = setTimeout(agendar, atraso());
  }
}

function conferirComForcaBruta(resultado) {
  const bruta = forcaBruta(pontos);
  if (Math.abs(bruta.melhor.d - resultado.melhor.d) > 1e-9) {
    console.error('Resultado diferente da força bruta!', bruta, resultado);
  }
  execucao.comparacoesBruta = bruta.comparacoes;
}

// ---------- Desenho ----------

function desenhar() {
  visualizador.desenhar(pontos, execucao?.estado, execucao?.resultado.px);

  const n = pontos.length;
  let texto = `pontos: <b>${n}</b>`;
  if (execucao) {
    const total = execucao.resultado.passos.length;
    texto += `<br>passo: <b>${execucao.passo}/${total}</b>`;
    texto += `<br>comparações D&C: <b>${execucao.resultado.comparacoes}</b>`;
    texto += `<br>comparações força bruta: <b>${execucao.comparacoesBruta}</b>`;
    if (execucao.pausado) texto += '<br><b>PAUSADO</b>';
  }
  estatisticas.innerHTML = texto;
}

// ---------- Teclado ----------

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  switch (e.key) {
    case 'Enter':
      e.preventDefault();
      rodar();
      return;
    case ' ':
      e.preventDefault();
      if (execucao) {
        execucao.pausado = !execucao.pausado;
        agendar();
        desenhar();
      }
      return;
    case 'ArrowRight':
      if (execucao) {
        execucao.pausado = true;
        clearTimeout(execucao.timer);
        avancar();
        desenhar();
      }
      return;
    case 'Backspace':
      e.preventDefault();
      pontos.pop();
      parar();
      return;
    case 'Escape':
      pontos = [];
      parar();
      return;
  }

  const ch = e.key.toLowerCase();
  if (ch.length === 1 && layout.mapa.has(ch)) {
    e.preventDefault();
    alternarPonto(ch);
  }
});

trocarLayout(seletorLayout.value);

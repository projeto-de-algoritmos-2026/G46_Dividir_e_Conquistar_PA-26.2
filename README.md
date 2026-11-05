# Par Mais Próximo no Teclado

**Disciplina:** Projeto de Algoritmos — UnB
**Conteúdo:** Dividir e Conquistar

**Acesse:** https://projeto-de-algoritmos-2026.github.io/G46_Dividir_e_Conquistar_PA-26.2/

## Sobre

Uma tela preta onde cada tecla digitada vira um ponto, desenhado na mesma
posição que a tecla ocupa no teclado. Ao apertar **Enter**, o programa
encontra o **par de pontos mais próximo** usando Dividir e Conquistar e
mostra o algoritmo passo a passo: as divisões, os casos base, a faixa em
volta da reta de corte e cada comparação.

Como cada teclado tem uma disposição diferente, o layout é escolhido na tela:
ABNT2, QWERTY (EUA), AZERTY, QWERTZ, Dvorak e Colemak.

## Como executar

Feito com **Next.js** e **TypeScript**. É preciso ter o [Node.js](https://nodejs.org) instalado.

```bash
npm install
npm run dev
```

Depois é só abrir http://localhost:3000 no navegador.

## Controles

| Tecla | Ação |
|---|---|
| letras, números, símbolos | cria o ponto (apertar de novo remove) |
| `Enter` | roda o algoritmo |
| `Espaço` | pausa / continua |
| `→` | avança um passo (pausa a animação) |
| `Backspace` | apaga o último ponto |
| `Esc` | limpa a tela |

## O algoritmo

Força bruta compara todos os pares: **O(n²)**. A versão de Dividir e
Conquistar faz **O(n log n)**:

1. **Ordenar** os pontos por x e por y (uma vez só).
2. **Dividir** os pontos ao meio por uma reta vertical.
3. **Conquistar**: achar recursivamente a menor distância de cada metade
   (`dE` e `dD`). Com até 3 pontos, usa força bruta (caso base).
4. **Combinar**: com `d = min(dE, dD)`, o par mais próximo só pode cruzar a
   reta se os dois pontos estiverem a menos de `d` dela. Nessa faixa,
   ordenada por y, cada ponto só precisa ser comparado com os vizinhos a menos
   de `d` acima dele — no máximo 7 —, então a combinação é O(n).

Recorrência: `T(n) = 2T(n/2) + O(n)` → `T(n) = O(n log n)`.

O painel no canto da tela mostra quantas comparações o Dividir e Conquistar
fez e quantas a força bruta faria para os mesmos pontos.

### Legenda das cores

- **Região clara:** subproblema que está sendo resolvido
- **Linha vermelha tracejada:** reta de divisão
- **Faixa azul:** pontos a menos de `d` da reta
- **Linha amarela:** par sendo comparado
- **Linha verde:** melhor par encontrado até agora

## Estrutura

```
app/layout.tsx              layout raiz da página
app/page.tsx                página inicial
app/globals.css             estilo
components/Visualizador.tsx entrada do teclado, painel e controle da execução
lib/layouts.ts              posição das teclas em cada layout
lib/parMaisProximo.ts       algoritmo (Dividir e Conquistar + força bruta)
lib/visualizador.ts         estado da animação e desenho no canvas
```

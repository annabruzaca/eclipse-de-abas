// Eclipse de Abas - Fases da Lua conforme a quantidade de abas abertas
//
// Compartilhado entre o popup (logo do cabeçalho), a página de opções
// (logo estático) e o service worker (ícone da barra de ferramentas), para
// os três desenharem exatamente a mesma lua — mesma cor, mesma cobertura e,
// sobretudo, a sombra sempre entrando pelo MESMO lado (da esquerda para o
// centro, deixando o crescente aceso visível à direita). Sem essa regra
// compartilhada cada tela podia "eclipsar" para um lado diferente.
//
// A cobertura cresce de forma CONTÍNUA com o número de abas — nada de saltos
// entre poucos estágios. Os pontos de referência abaixo (TAB_PERCENT_STOPS)
// definem a curva; os valores entre um ponto e outro são interpolados
// linearmente, então a progressão fica suave mesmo com poucos pontos
// cadastrados. Isso reflete quantas abas estão ABERTAS no total, não
// quantas estão eclipsadas/suspensas.

// tabs -> % da lua coberta pela sombra.
const TAB_PERCENT_STOPS = [
  { tabs: 1, percent: 0 },
  { tabs: 4, percent: 2 },
  { tabs: 9, percent: 7 },
  { tabs: 15, percent: 17 },
  { tabs: 21, percent: 22 },
  { tabs: 29, percent: 32 },
  { tabs: 36, percent: 47 },
  { tabs: 45, percent: 56 },
  { tabs: 50, percent: 69 },
  { tabs: 60, percent: 78 },
  { tabs: 72, percent: 93 },
  { tabs: 80, percent: 95 }
];

const MOON_COLOR_STOPS = [
  { percent: 0, lit: [238, 241, 250], shadow: [28, 33, 64] },
  { percent: 25, lit: [227, 231, 246], shadow: [51, 38, 58] },
  { percent: 50, lit: [219, 219, 230], shadow: [92, 42, 40] },
  { percent: 75, lit: [231, 215, 201], shadow: [138, 53, 36] },
  { percent: 93, lit: [240, 201, 160], shadow: [124, 36, 22] }
];

// Faixas mais amplas, só para o texto do tooltip (a cor/cobertura visual já
// é contínua e não pula entre elas).
const MOON_LABEL_TIERS = [
  { max: 20, label: 'Poucas abas abertas' },
  { max: 35, label: 'Algumas abas abertas' },
  { max: 59, label: 'Muitas abas abertas' },
  { max: Infinity, label: 'Excesso de abas abertas' }
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColorHex(c1, c2, t) {
  const r = Math.round(lerp(c1[0], c2[0], t));
  const g = Math.round(lerp(c1[1], c2[1], t));
  const b = Math.round(lerp(c1[2], c2[2], t));
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// Interpolação linear por trechos sobre TAB_PERCENT_STOPS. Abaixo do
// primeiro ponto ou acima do último, o valor fica travado (não saem abas
// negativas, nem passa do teto do último ponto).
function tabCountToPercent(tabCount) {
  const first = TAB_PERCENT_STOPS[0];
  const last = TAB_PERCENT_STOPS[TAB_PERCENT_STOPS.length - 1];

  if (tabCount <= first.tabs) return first.percent;
  if (tabCount >= last.tabs) return last.percent;

  for (let i = 0; i < TAB_PERCENT_STOPS.length - 1; i++) {
    const a = TAB_PERCENT_STOPS[i];
    const b = TAB_PERCENT_STOPS[i + 1];
    if (tabCount >= a.tabs && tabCount <= b.tabs) {
      const t = (tabCount - a.tabs) / (b.tabs - a.tabs);
      return lerp(a.percent, b.percent, t);
    }
  }
  return last.percent;
}

// Retorna { percent, coverage (0-1), litColor, shadowColor, label } para a
// quantidade de abas dada. coverage é o valor pronto para deslocar a sombra
// sempre na mesma direção nos três lugares que desenham a lua.
function getMoonPhase(tabCount) {
  const percent = tabCountToPercent(tabCount);

  // A cor já está "no teto" a partir do último estágio cadastrado (93%);
  // acima disso (até o 95% do maior ponto da tabela) só a cobertura
  // continua avançando, a lua já está com a cor de totalidade.
  const maxColorStop = MOON_COLOR_STOPS[MOON_COLOR_STOPS.length - 1];
  const colorPercent = Math.min(percent, maxColorStop.percent);

  let lower = MOON_COLOR_STOPS[0];
  let upper = maxColorStop;
  for (let i = 0; i < MOON_COLOR_STOPS.length - 1; i++) {
    if (colorPercent >= MOON_COLOR_STOPS[i].percent && colorPercent <= MOON_COLOR_STOPS[i + 1].percent) {
      lower = MOON_COLOR_STOPS[i];
      upper = MOON_COLOR_STOPS[i + 1];
      break;
    }
  }
  const span = upper.percent - lower.percent;
  const t = span > 0 ? (colorPercent - lower.percent) / span : 0;

  const label = (MOON_LABEL_TIERS.find(tier => tabCount <= tier.max) || MOON_LABEL_TIERS[MOON_LABEL_TIERS.length - 1]).label;

  return {
    percent: Math.round(percent),
    coverage: percent / 100,
    litColor: lerpColorHex(lower.lit, upper.lit, t),
    shadowColor: lerpColorHex(lower.shadow, upper.shadow, t),
    label
  };
}

(typeof self !== 'undefined' ? self : globalThis).getMoonPhase = getMoonPhase;

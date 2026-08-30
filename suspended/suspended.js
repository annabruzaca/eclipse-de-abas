// Eclipse de Abas - Script da Tela de Hibernação

document.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);

  const originalUrl = params.get('url') || 'https://google.com';
  const originalTitle = params.get('title') || 'Aba Eclipsada';
  const originalIcon = params.get('icon') || '';

  // Elementos da Interface
  const tabTitleEl = document.getElementById('tab-title');
  const tabDomainEl = document.getElementById('tab-domain');
  const tabFaviconEl = document.getElementById('tab-favicon');
  const wakeBtn = document.getElementById('wake-btn');
  const mainContainer = document.getElementById('main-container');
  const quoteEl = document.getElementById('quote-text');

  // Atualizar Título do Documento
  document.title = `🌑 [Eclipse] ${originalTitle}`;

  // Preencher dados na interface
  tabTitleEl.textContent = originalTitle;

  try {
    const urlObj = new URL(originalUrl);
    tabDomainEl.textContent = urlObj.hostname;
  } catch (e) {
    tabDomainEl.textContent = originalUrl;
  }

  if (originalIcon && originalIcon !== 'undefined') {
    tabFaviconEl.src = originalIcon;
  } else {
    try {
      const urlObj = new URL(originalUrl);
      tabFaviconEl.src = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    } catch (e) {
      tabFaviconEl.src = '../assets/icons/icon48.png';
    }
  }

  // Lista de Frases Celestiais
  const celestialQuotes = [
    '"As estrelas não podem brilhar sem a escuridão."',
    '"No vasto eclipse do cosmos, o foco encontra a sua luz."',
    '"O silêncio do espaço preserva a energia do amanhã."',
    '"Até o Sol faz uma pausa para o espetáculo da Lua."',
    '"Economize recursos hoje para criar supernovas amanhã."'
  ];
  const randomQuote = celestialQuotes[Math.floor(Math.random() * celestialQuotes.length)];
  if (quoteEl) quoteEl.textContent = randomQuote;

  // Função para Despertar (Restaurar) a Aba
  let wakingUp = false;
  function wakeUpTab() {
    if (wakingUp) return;
    wakingUp = true;

    // Efeito de fade out visual
    document.body.style.transition = 'opacity 0.25s ease';
    document.body.style.opacity = '0';

    setTimeout(() => {
      window.location.replace(originalUrl);
    }, 150);
  }

  // Event Listeners para Despertar
  wakeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    wakeUpTab();
  });

  // Clique em qualquer lugar da tela desperta a aba
  document.body.addEventListener('click', () => {
    wakeUpTab();
  });

  // Tecla Espaço ou Enter para despertar
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      wakeUpTab();
    }
  });
});

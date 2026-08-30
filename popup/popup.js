// Eclipse de Abas - Script do Popup (Visão Orbital)

document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM
  const statRamEl = document.getElementById('stat-ram');
  const statSuspendedEl = document.getElementById('stat-suspended');
  const countOpenEl = document.getElementById('count-open');
  const tabsListEl = document.getElementById('tabs-list');
  const searchInput = document.getElementById('tab-search');
  const searchStatusEl = document.getElementById('search-status');

  // Botões de Ação Rápida
  const btnEclipseOthers = document.getElementById('btn-eclipse-others');
  const btnUnsuspendAll = document.getElementById('btn-unsuspend-all');
  const btnGroupDomain = document.getElementById('btn-group-domain');
  const btnSaveAllSession = document.getElementById('btn-save-all-session');
  const openSettingsBtn = document.getElementById('open-settings');
  const toast = document.getElementById('toast');
  const logoIconEl = document.getElementById('logo-icon');

  // Abas de Navegação Interna
  const navTabs = document.getElementById('nav-tabs');
  const navConstellations = document.getElementById('nav-constellations');
  const panelTabs = document.getElementById('panel-tabs');
  const panelConstellations = document.getElementById('panel-constellations');

  // Constelações Elements
  const constellationInput = document.getElementById('constellation-name');
  const btnSaveConstellation = document.getElementById('btn-save-constellation');
  const constellationsListEl = document.getElementById('constellations-list');

  let currentTabsCache = [];

  // Inicializar Popup
  loadStats();
  renderTabsList();

  // Troca de Abas Internas (Navegação do Popup) — padrão ARIA de "tabs":
  // só a aba selecionada fica no tabindex natural (roving tabindex) e as
  // setas do teclado movem o foco entre elas, como usuários de leitor de
  // tela e teclado esperam de uma interface de abas.
  function switchPanel(name) {
    const showTabs = name === 'tabs';

    navTabs.classList.toggle('active', showTabs);
    navTabs.setAttribute('aria-selected', String(showTabs));
    navTabs.tabIndex = showTabs ? 0 : -1;

    navConstellations.classList.toggle('active', !showTabs);
    navConstellations.setAttribute('aria-selected', String(!showTabs));
    navConstellations.tabIndex = showTabs ? -1 : 0;

    panelTabs.classList.toggle('active', showTabs);
    panelTabs.hidden = !showTabs;

    panelConstellations.classList.toggle('active', !showTabs);
    panelConstellations.hidden = showTabs;

    if (!showTabs) renderConstellationsList();
  }

  navTabs.addEventListener('click', () => switchPanel('tabs'));
  navConstellations.addEventListener('click', () => switchPanel('constellations'));

  navTabs.parentElement.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const target = document.activeElement === navTabs ? navConstellations : navTabs;
    switchPanel(target === navTabs ? 'tabs' : 'constellations');
    target.focus();
  });

  // Abrir Opções
  openSettingsBtn.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options/options.html'));
    }
  });

  // Carregar Estatísticas do Service Worker
  async function loadStats() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'GET_STATS' });
      if (response) {
        statRamEl.textContent = `${response.savedRamMB} MB`;
        statSuspendedEl.textContent = `${response.currentSuspended} / ${response.totalOpenTabs}`;
      }
    } catch (e) {
      console.error('Erro ao buscar estatísticas:', e);
    }
  }

  // Renderizar Lista de Abas Abertas
  async function renderTabsList(filterQuery = '') {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      currentTabsCache = tabs;
      countOpenEl.textContent = tabs.length;
      updateMoonLogo(tabs.length);

      const extensionUrl = chrome.runtime.getURL('suspended/suspended.html');
      tabsListEl.innerHTML = '';

      // Quantas abas cada domínio tem abertas nesta janela — usado para o
      // selo "×N" ao lado de abas repetidas do mesmo site (não fecha nem
      // agrupa nada, é só um sinal de "você tem várias abas iguais").
      const domainCounts = new Map();
      tabs.forEach(tab => {
        const domain = getTabDomain(tab, extensionUrl);
        if (domain) domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
      });

      const query = filterQuery.toLowerCase().trim();
      const filteredTabs = tabs.filter(tab => {
        if (!query) return true;
        const title = (tab.title || '').toLowerCase();
        const url = (tab.url || '').toLowerCase();
        return title.includes(query) || url.includes(query);
      });

      if (query) {
        searchStatusEl.textContent = `${filteredTabs.length} aba(s) encontrada(s) para "${filterQuery}"`;
      } else {
        searchStatusEl.textContent = '';
      }

      if (filteredTabs.length === 0) {
        tabsListEl.innerHTML = `<div class="empty-state">Nenhuma aba encontrada para "${filterQuery}"</div>`;
        return;
      }

      filteredTabs.forEach(tab => {
        const isSuspended = tab.url && tab.url.startsWith(extensionUrl);
        let displayTitle = tab.title || 'Sem título';
        let displayUrl = tab.url || '';
        let displayIcon = tab.favIconUrl || '../assets/icons/icon48.png';

        if (isSuspended && tab.url.includes('#')) {
          try {
            const params = new URLSearchParams(tab.url.split('#')[1]);
            displayTitle = params.get('title') || displayTitle;
            displayUrl = params.get('url') || displayUrl;
            if (params.get('icon')) displayIcon = params.get('icon');
          } catch (e) {}
        }

        let domainKey = null;
        try {
          const urlObj = new URL(displayUrl);
          displayUrl = urlObj.hostname;
          domainKey = urlObj.hostname.replace(/^www\./, '');
        } catch (e) {}

        const domainCount = domainKey ? (domainCounts.get(domainKey) || 0) : 0;

        const itemEl = document.createElement('div');
        itemEl.className = `tab-item ${isSuspended ? 'suspended' : ''} ${tab.active ? 'active-tab' : ''}`;

        const toggleTitle = isSuspended ? 'Acordar Aba' : 'Eclipsar Aba';

        itemEl.innerHTML = `
          <div class="tab-info" role="button" tabindex="0" aria-label="Ir para a aba: ${escapeHtml(displayTitle)}">
            <img class="tab-fav" src="${displayIcon}" onerror="this.src='../assets/icons/icon48.png'" alt="">
            <div class="tab-details">
              <span class="tab-name">${escapeHtml(displayTitle)}</span>
              <div class="tab-domain-row">
                <span class="tab-url-text">${escapeHtml(displayUrl)}</span>
                ${domainCount > 1 ? `<button type="button" class="tab-domain-badge" title="${domainCount} abas abertas em ${escapeHtml(domainKey)} — clique para filtrar" aria-label="Filtrar pelas ${domainCount} abas de ${escapeHtml(domainKey)}">×${domainCount}</button>` : ''}
              </div>
            </div>
          </div>
          <div class="tab-item-actions">
            <button class="btn-tab-action btn-toggle-suspend" title="${toggleTitle}" aria-label="${toggleTitle}: ${escapeHtml(displayTitle)}">
              ${isSuspended ?
                '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>' :
                '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
              }
            </button>
            <button class="btn-tab-action danger btn-close-tab" title="Fechar Aba" aria-label="Fechar aba: ${escapeHtml(displayTitle)}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        `;

        // Ativar Aba ao clicar (ou pressionar Enter/Espaço) no card de informações
        const activateTab = () => chrome.tabs.update(tab.id, { active: true });
        const tabInfoEl = itemEl.querySelector('.tab-info');
        tabInfoEl.addEventListener('click', activateTab);
        tabInfoEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            activateTab();
          }
        });

        // Selo "×N": clicar filtra a lista só pelas abas daquele domínio
        const domainBadgeEl = itemEl.querySelector('.tab-domain-badge');
        if (domainBadgeEl) {
          domainBadgeEl.addEventListener('click', (e) => {
            e.stopPropagation();
            searchInput.value = domainKey;
            renderTabsList(domainKey);
            searchInput.focus();
          });
        }

        // Alternar Estado Eclipsar/Acordar
        itemEl.querySelector('.btn-toggle-suspend').addEventListener('click', async (e) => {
          e.stopPropagation();
          if (isSuspended) {
            // Acordar aba
            try {
              const params = new URLSearchParams(tab.url.split('#')[1]);
              const origUrl = params.get('url');
              if (origUrl) await chrome.tabs.update(tab.id, { url: origUrl });
            } catch (err) {}
          } else {
            // Eclipsar aba
            await chrome.runtime.sendMessage({ action: 'ECLIPSE_TAB', tabId: tab.id });
          }
          setTimeout(() => {
            renderTabsList(searchInput.value);
            loadStats();
          }, 200);
        });

        // Fechar Aba
        itemEl.querySelector('.btn-close-tab').addEventListener('click', async (e) => {
          e.stopPropagation();
          await chrome.tabs.remove(tab.id);
          renderTabsList(searchInput.value);
          loadStats();
        });

        tabsListEl.appendChild(itemEl);
      });
    } catch (e) {
      console.error('Erro ao listar abas:', e);
    }
  }

  // Filtro de Busca Instantânea
  searchInput.addEventListener('input', (e) => {
    renderTabsList(e.target.value);
  });

  // Ações de Botões Globais
  btnEclipseOthers.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ action: 'ECLIPSE_OTHER_TABS' });
    const count = response?.suspendedCount || 0;
    showToast(count > 0 ? `🌑 ${count} aba(s) eclipsada(s)` : 'Nenhuma aba para eclipsar (todas já eclipsadas, fixadas, com áudio ou protegidas)');
    setTimeout(() => {
      renderTabsList(searchInput.value);
      loadStats();
    }, 300);
  });

  btnUnsuspendAll.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ action: 'UNSUSPEND_ALL_TABS' });
    const count = response?.wokenCount || 0;
    showToast(count > 0 ? `☀️ ${count} aba(s) despertada(s)` : 'Nenhuma aba eclipsada para acordar no momento');
    setTimeout(() => {
      renderTabsList(searchInput.value);
      loadStats();
    }, 300);
  });

  btnGroupDomain.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ action: 'GROUP_BY_DOMAIN' });
    const groups = response?.groupsCreated || 0;
    showToast(groups > 0 ? `📁 ${groups} grupo(s) criado(s) por domínio` : 'Nenhum site tem 2+ abas abertas para agrupar');
    renderTabsList();
  });

  btnSaveAllSession.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ action: 'ECLIPSE_ALL_TABS' });
    const count = response?.suspendedCount || 0;
    showToast(count > 0 ? `🌑 ${count} aba(s) eclipsada(s)` : 'Nenhuma aba para eclipsar (todas já eclipsadas, fixadas, com áudio ou protegidas)');
    setTimeout(() => {
      renderTabsList();
      loadStats();
    }, 300);
  });

  // Gerenciamento de Constelações (Sessões Salvas)
  btnSaveConstellation.addEventListener('click', async () => {
    const name = constellationInput.value.trim() || `Constelação #${Date.now().toString().slice(-4)}`;
    const tabs = await chrome.tabs.query({ currentWindow: true });

    const constellationData = {
      id: 'const_' + Date.now(),
      name: name,
      date: new Date().toLocaleDateString('pt-BR'),
      tabs: tabs.map(t => ({ title: t.title, url: t.url, favIconUrl: t.favIconUrl }))
    };

    const { savedConstellations = [] } = await chrome.storage.local.get('savedConstellations');
    savedConstellations.push(constellationData);
    await chrome.storage.local.set({ savedConstellations });

    constellationInput.value = '';
    showToast(`⭐ Constelação "${name}" salva com ${constellationData.tabs.length} aba(s)`);
    renderConstellationsList();
  });

  async function renderConstellationsList() {
    const { savedConstellations = [] } = await chrome.storage.local.get('savedConstellations');
    constellationsListEl.innerHTML = '';

    if (savedConstellations.length === 0) {
      constellationsListEl.innerHTML = `<div class="empty-state">Nenhuma constelação salva ainda. Salve a sessão atual para guardar suas abas favoritas!</div>`;
      return;
    }

    savedConstellations.forEach(constellation => {
      const card = document.createElement('div');
      card.className = 'constellation-card';
      card.innerHTML = `
        <div>
          <div class="constellation-title">${escapeHtml(constellation.name)}</div>
          <div class="constellation-count">${constellation.tabs.length} abas • ${constellation.date}</div>
        </div>
        <div class="tab-item-actions">
          <button class="primary-sm-btn btn-open-const" title="Reabrir todas as abas em segundo plano" aria-label="Reabrir constelação ${escapeHtml(constellation.name)}">Abrir</button>
          <button class="btn-tab-action danger btn-del-const" title="Excluir (clique 2x para confirmar)" aria-label="Excluir constelação ${escapeHtml(constellation.name)}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `;

      card.querySelector('.btn-open-const').addEventListener('click', async () => {
        for (const t of constellation.tabs) {
          if (t.url) chrome.tabs.create({ url: t.url, active: false });
        }
        showToast(`🪐 ${constellation.tabs.length} aba(s) reabertas de "${constellation.name}"`);
      });

      // Excluir constelação exige confirmação: é uma ação irreversível (não
      // há "desfazer" como no fechar de aba, que pode ser reaberta com
      // Ctrl+Shift+T). O primeiro clique só arma a confirmação por alguns
      // segundos; só o segundo clique de fato apaga.
      const btnDelConst = card.querySelector('.btn-del-const');
      let deleteArmed = false;
      let deleteArmTimer = null;
      btnDelConst.addEventListener('click', async () => {
        if (!deleteArmed) {
          deleteArmed = true;
          btnDelConst.classList.add('confirm-armed');
          btnDelConst.title = 'Clique novamente para confirmar a exclusão';
          btnDelConst.setAttribute('aria-label', `Confirmar exclusão da constelação ${constellation.name}`);
          deleteArmTimer = setTimeout(() => {
            deleteArmed = false;
            btnDelConst.classList.remove('confirm-armed');
            btnDelConst.title = 'Excluir (clique 2x para confirmar)';
            btnDelConst.setAttribute('aria-label', `Excluir constelação ${constellation.name}`);
          }, 3000);
          return;
        }
        clearTimeout(deleteArmTimer);
        const { savedConstellations = [] } = await chrome.storage.local.get('savedConstellations');
        const updated = savedConstellations.filter(c => c.id !== constellation.id);
        await chrome.storage.local.set({ savedConstellations: updated });
        showToast(`🗑️ Constelação "${constellation.name}" removida`);
        renderConstellationsList();
      });

      constellationsListEl.appendChild(card);
    });
  }

  let toastTimer = null;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // Extrai o domínio "real" de uma aba, mesmo se ela estiver eclipsada
  // (nesse caso a URL real vem codificada no hash de suspended.html).
  function getTabDomain(tab, extensionUrl) {
    let url = tab.url || '';
    if (url.startsWith(extensionUrl) && url.includes('#')) {
      try {
        const params = new URLSearchParams(url.split('#')[1]);
        url = params.get('url') || url;
      } catch (e) {}
    }
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (e) {
      return null;
    }
  }

  // Ajusta a fase da lua do logo conforme o total de abas abertas nesta
  // janela — cobertura contínua (sem saltos), quanto mais abas, mais a lua
  // fica coberta pela sombra (alerta visual). O deslocamento da sombra usa
  // a mesma fórmula e a mesma direção (esquerda -> centro) do ícone da
  // barra de ferramentas, para os dois eclipsarem para o mesmo lado.
  const LOGO_MAX_OFFSET_PX = 9;
  const LOGO_MIN_MOON_SIZE = 22;
  const LOGO_MAX_MOON_SIZE = 24;

  function updateMoonLogo(tabCount) {
    const phase = getMoonPhase(tabCount);
    const offset = LOGO_MAX_OFFSET_PX * (1 - phase.coverage);
    const moonSize = LOGO_MIN_MOON_SIZE + phase.coverage * (LOGO_MAX_MOON_SIZE - LOGO_MIN_MOON_SIZE);

    logoIconEl.style.setProperty('--moon-lit', phase.litColor);
    logoIconEl.style.setProperty('--moon-shadow', phase.shadowColor);
    logoIconEl.style.setProperty('--moon-offset', `${offset.toFixed(2)}px`);
    logoIconEl.style.setProperty('--moon-size', `${moonSize.toFixed(2)}px`);
    logoIconEl.title = `${tabCount} aba(s) abertas nesta janela — ${phase.label} (${phase.percent}%)`;
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});

// Eclipse de Abas - Service Worker (Background Script Manifest V3)

importScripts('../shared/moon-phase.js');

// Configurações e estados iniciais
const DEFAULT_SETTINGS = {
  suspendTimeout: 30, // minutos
  neverSuspendAudio: true,
  neverSuspendPinned: true,
  neverSuspendForms: true,
  whitelist: [
    'chrome://',
    'chrome-extension://',
    'devtools://',
    'localhost',
    '127.0.0.1'
  ],
  savedConstellations: [],
  eclipsedCount: 0,
  savedRamMB: 0
};

// Última atividade de cada aba: tabId -> timestamp (ms).
// Persistida em chrome.storage.session (não em um Map em memória) porque o
// service worker do Manifest V3 é descartado após ~30s ocioso e reinicia do
// zero a cada evento/alarme — um Map em memória perderia os timestamps entre
// um ciclo e outro, fazendo o cronômetro de inatividade nunca avançar.
async function getTabLastActiveMap() {
  const { tabLastActive = {} } = await chrome.storage.session.get('tabLastActive');
  return tabLastActive;
}

async function setTabLastActive(tabId, timestamp) {
  const map = await getTabLastActiveMap();
  map[tabId] = timestamp;
  await chrome.storage.session.set({ tabLastActive: map });
}

async function removeTabLastActive(tabId) {
  const map = await getTabLastActiveMap();
  delete map[tabId];
  await chrome.storage.session.set({ tabLastActive: map });
}

// Inicialização da Extensão
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Eclipse de Abas] Extensão instalada/atualizada.');
  
  // Carrega ou define as configurações padrão
  const data = await chrome.storage.local.get(null);
  const newSettings = { ...DEFAULT_SETTINGS };

  for (const key in DEFAULT_SETTINGS) {
    if (data[key] === undefined) {
      newSettings[key] = DEFAULT_SETTINGS[key];
    } else {
      newSettings[key] = data[key];
    }
  }
  await chrome.storage.local.set(newSettings);

  // Configura Alarme para verificar inatividade periodicamente (a cada 1 minuto)
  chrome.alarms.create('checkTabActivity', { periodInMinutes: 1 });

  // Configura Menus de Contexto
  setupContextMenus();
  
  // Atualizar contadores em todas as janelas ativas
  initializeActiveTabs();
  updateBadge();
  updateActionIcon();
});

// Inicialização ao subir a extensão (Service Worker)
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('checkTabActivity', { periodInMinutes: 1 });
  initializeActiveTabs();
  updateBadge();
  updateActionIcon();
});

// Registra timestamp para abas existentes no arranque
async function initializeActiveTabs() {
  const tabs = await chrome.tabs.query({});
  const now = Date.now();
  const map = {};
  tabs.forEach(tab => {
    map[tab.id] = now;
  });
  await chrome.storage.session.set({ tabLastActive: map });
}

// Menus de Contexto (Clique direito)
function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'eclipse-current-tab',
      title: '🌑 Eclipsar esta aba agora',
      contexts: ['page', 'action']
    });
    chrome.contextMenus.create({
      id: 'eclipse-other-tabs',
      title: '🌒 Eclipsar todas as outras abas',
      contexts: ['page', 'action']
    });
    chrome.contextMenus.create({
      id: 'whitelist-domain',
      title: '🛡️ Proteger este domínio (Lista Branca)',
      contexts: ['page']
    });
  });
}

// Handler de Menus de Contexto
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'eclipse-current-tab' && tab) {
    suspendTab(tab);
  } else if (info.menuItemId === 'eclipse-other-tabs' && tab) {
    eclipseOtherTabs(tab.windowId, tab.id);
  } else if (info.menuItemId === 'whitelist-domain' && tab && tab.url) {
    try {
      const urlObj = new URL(tab.url);
      const domain = urlObj.hostname;
      if (domain) {
        const { whitelist = [] } = await chrome.storage.local.get('whitelist');
        if (!whitelist.includes(domain)) {
          whitelist.push(domain);
          await chrome.storage.local.set({ whitelist });
          console.log(`[Eclipse de Abas] Domínio ${domain} adicionado à lista branca.`);
        }
      }
    } catch (e) {
      console.error('Erro ao adicionar à lista branca:', e);
    }
  }
});

// Monitoramento de Atividade das Abas
chrome.tabs.onActivated.addListener(activeInfo => {
  setTabLastActive(activeInfo.tabId, Date.now());
});

// A quantidade total de abas só muda ao criar/fechar uma aba — atualiza o
// ícone (fase da lua) nesses dois momentos.
chrome.tabs.onCreated.addListener(() => {
  updateActionIcon();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    setTabLastActive(tabId, Date.now());
  }
  // Só recalcula o badge quando o carregamento termina, evitando disparos
  // repetidos a cada mudança de título/favicon durante a navegação.
  if (changeInfo.status === 'complete') {
    updateBadge();
  }
});

chrome.tabs.onRemoved.addListener(tabId => {
  removeTabLastActive(tabId);
  updateBadge();
  updateActionIcon();
});

// Listener do Alarme Periódico
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'checkTabActivity') {
    checkAndSuspendInactiveTabs();
  }
});

// Verificação principal de abas inativas
async function checkAndSuspendInactiveTabs() {
  const settings = await chrome.storage.local.get([
    'suspendTimeout',
    'neverSuspendAudio',
    'neverSuspendPinned',
    'whitelist'
  ]);

  const timeoutMinutes = settings.suspendTimeout || 30;
  // Se o tempo estiver setado para 0, suspensão automática desativada
  if (timeoutMinutes <= 0) return;

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const now = Date.now();

  const tabs = await chrome.tabs.query({});
  const lastActiveMap = await getTabLastActiveMap();

  for (const tab of tabs) {
    // Não suspender a aba ativa atual da janela
    if (tab.active) continue;

    // Verificar se já está suspensa
    if (isTabSuspended(tab)) continue;

    // Verificar aba fixada
    if (settings.neverSuspendPinned && tab.pinned) continue;

    // Verificar áudio
    if (settings.neverSuspendAudio && tab.audible) continue;

    // Verificar se a URL está na lista branca
    if (isWhitelisted(tab.url, settings.whitelist || [])) continue;

    // Verificar tempo de inatividade
    const lastActive = lastActiveMap[tab.id] ?? now;
    if (now - lastActive >= timeoutMs) {
      await suspendTab(tab);
    }
  }
}

// Verifica se a URL pertence à Lista Branca.
// Entradas com esquema (ex: "chrome://") comparam por prefixo da URL;
// entradas simples (ex: "youtube.com") comparam pelo hostname exato ou
// por subdomínio, evitando falso-positivo por substring (ex: "a.com"
// não deve casar com "evil-a.com.attacker.net").
function isWhitelisted(url, whitelist) {
  if (!url) return true;
  const lowerUrl = url.toLowerCase();

  let hostname = '';
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch (e) {}

  return whitelist.some(item => {
    const entry = item.toLowerCase();
    if (entry.includes('://')) {
      return lowerUrl.startsWith(entry);
    }
    return hostname === entry || hostname.endsWith('.' + entry);
  });
}

// Verifica se a aba já está na página de Eclipse
function isTabSuspended(tab) {
  if (!tab.url) return false;
  const extensionUrl = chrome.runtime.getURL('suspended/suspended.html');
  return tab.url.startsWith(extensionUrl);
}

// Função para Eclipsar (Suspender) uma Aba
async function suspendTab(tab) {
  if (!tab || !tab.url || isTabSuspended(tab)) return false;

  // Não eclipsar páginas internas do sistema Chrome não permitidas
  if (
    tab.url.startsWith('chrome://') ||
    tab.url.startsWith('chrome-extension://') ||
    tab.url.startsWith('edge://') ||
    tab.url.startsWith('about:')
  ) {
    return false;
  }

  const suspendedUrl = createSuspendedUrl(tab.url, tab.title || '', tab.favIconUrl || '');

  try {
    await chrome.tabs.update(tab.id, { url: suspendedUrl });

    // Atualizar estatísticas de RAM salva (estimativa média de 150MB por aba)
    const stats = await chrome.storage.local.get(['eclipsedCount', 'savedRamMB']);
    const newCount = (stats.eclipsedCount || 0) + 1;
    const newRam = (stats.savedRamMB || 0) + 150;

    await chrome.storage.local.set({
      eclipsedCount: newCount,
      savedRamMB: newRam
    });

    updateBadge();
    return true;
  } catch (err) {
    console.error(`[Eclipse de Abas] Erro ao suspender aba ${tab.id}:`, err);
    return false;
  }
}

// Constrói a URL do suspended.html codificando os parâmetros da aba original
function createSuspendedUrl(url, title, icon) {
  const baseUrl = chrome.runtime.getURL('suspended/suspended.html');
  const params = new URLSearchParams({
    url: url,
    title: title,
    icon: icon || ''
  });
  return `${baseUrl}#${params.toString()}`;
}

// Eclipsar todas as outras abas da janela exceto a ativa
async function eclipseOtherTabs(windowId, activeTabId) {
  const tabs = await chrome.tabs.query({ windowId: windowId });
  const settings = await chrome.storage.local.get(['neverSuspendAudio', 'neverSuspendPinned', 'whitelist']);
  let suspendedCount = 0;

  for (const tab of tabs) {
    if (tab.id === activeTabId) continue;
    if (isTabSuspended(tab)) continue;
    if (settings.neverSuspendPinned && tab.pinned) continue;
    if (settings.neverSuspendAudio && tab.audible) continue;
    if (isWhitelisted(tab.url, settings.whitelist || [])) continue;

    if (await suspendTab(tab)) suspendedCount++;
  }
  updateBadge();
  return suspendedCount;
}

// Eclipsar TODAS as abas da janela (ou todas as janelas)
async function eclipseAllTabs(onlyCurrentWindow = true) {
  const queryFilter = onlyCurrentWindow ? { currentWindow: true } : {};
  const tabs = await chrome.tabs.query(queryFilter);
  const settings = await chrome.storage.local.get(['neverSuspendAudio', 'neverSuspendPinned', 'whitelist']);
  let suspendedCount = 0;

  for (const tab of tabs) {
    if (tab.active) continue; // Mantém a aba atual ativa para o usuário não perder a tela
    if (isTabSuspended(tab)) continue;
    if (settings.neverSuspendPinned && tab.pinned) continue;
    if (settings.neverSuspendAudio && tab.audible) continue;
    if (isWhitelisted(tab.url, settings.whitelist || [])) continue;

    if (await suspendTab(tab)) suspendedCount++;
  }
  updateBadge();
  return suspendedCount;
}

// Reativar (Acordar) todas as abas eclipsadas
async function unsuspendAllTabs() {
  const tabs = await chrome.tabs.query({});
  let wokenCount = 0;

  for (const tab of tabs) {
    if (isTabSuspended(tab)) {
      try {
        const hash = tab.url.split('#')[1];
        if (hash) {
          const params = new URLSearchParams(hash);
          const originalUrl = params.get('url');
          if (originalUrl) {
            await chrome.tabs.update(tab.id, { url: originalUrl });
            wokenCount++;
          }
        }
      } catch (e) {
        console.error('Erro ao reativar aba:', e);
      }
    }
  }
  updateBadge();
  return wokenCount;
}

// Agrupar Abas por Domínio (Chrome Tab Groups).
// A criação/atribuição de abas a um grupo é feita por chrome.tabs.group() —
// o namespace chrome.tabGroups só gerencia grupos já existentes (update,
// move, query); ele não tem um método group(), então chamá-lo lançava
// "chrome.tabGroups.group is not a function" e o agrupamento nunca acontecia.
async function groupByDomain() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const domainMap = new Map();

  tabs.forEach(tab => {
    if (!tab.url || isTabSuspended(tab)) return;
    try {
      const urlObj = new URL(tab.url);
      const host = urlObj.hostname.replace(/^www\./, '');
      if (host) {
        if (!domainMap.has(host)) domainMap.set(host, []);
        domainMap.get(host).push(tab.id);
      }
    } catch (e) {}
  });

  const colors = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
  let colorIdx = 0;
  let groupsCreated = 0;
  let tabsGrouped = 0;

  for (const [domain, tabIds] of domainMap.entries()) {
    if (tabIds.length > 1) {
      try {
        const groupId = await chrome.tabs.group({ tabIds: tabIds });
        await chrome.tabGroups.update(groupId, {
          title: domain,
          color: colors[colorIdx % colors.length]
        });
        colorIdx++;
        groupsCreated++;
        tabsGrouped += tabIds.length;
      } catch (e) {
        console.error('Erro ao agrupar abas:', e);
      }
    }
  }

  return { groupsCreated, tabsGrouped };
}

// Atualizar Badge de Contagem no ícone da extensão
async function updateBadge() {
  const tabs = await chrome.tabs.query({});
  let suspendedCount = 0;

  tabs.forEach(tab => {
    if (isTabSuspended(tab)) suspendedCount++;
  });

  if (suspendedCount > 0) {
    chrome.action.setBadgeText({ text: suspendedCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#c1642f' }); // Cobre do Eclipse
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Desenha a lua em eclipse em um tamanho: um disco prateado ("lua") sendo
// coberto por uma sombra que muda de cor conforme a fase — azul-marinho no
// início do eclipse, cobre/vermelho-sangue na totalidade —, com um halo e um
// anel orbital tracejado, no mesmo estilo da tela de aba eclipsada. Quanto
// mais abas abertas, mais da lua fica coberta pela sombra.
//
// A sombra sempre entra pelo mesmo lado (deslocada à esquerda do centro,
// convergindo para o centro conforme a cobertura cresce) — essa direção é
// repetida de propósito no logo do popup e no logo da página de opções,
// para os três "eclipsarem" sempre para o mesmo lado.
function renderMoonIcon(size, phase) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const coverage = phase.coverage;

  ctx.clearRect(0, 0, size, size);

  // Halo suave atrás de tudo, na cor da sombra (frio no início, quente na totalidade)
  const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.9);
  glow.addColorStop(0, phase.shadowColor + '77');
  glow.addColorStop(1, phase.shadowColor + '00');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.9, 0, Math.PI * 2);
  ctx.fill();

  // Anel orbital tracejado, ecoando o visual da tela de aba eclipsada
  ctx.strokeStyle = 'rgba(169, 184, 232, 0.55)';
  ctx.lineWidth = Math.max(1, size * 0.018);
  ctx.setLineDash([size * 0.035, size * 0.05]);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // "Lua": disco cheio prateado/iluminado
  ctx.fillStyle = phase.litColor;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Sombra da Terra: disco sobreposto, deslocado conforme a cobertura da fase
  // (contínua, sem saltos). coverage=0 -> sombra afastada à esquerda, lua
  // praticamente toda visível. coverage=0.93 -> sombra quase centralizada,
  // cobrindo quase toda a lua, com um fino crescente aceso à direita.
  const maxOffset = r * 1.9;
  const shadowOffset = maxOffset * (1 - coverage);
  ctx.fillStyle = phase.shadowColor;
  ctx.beginPath();
  ctx.arc(cx - shadowOffset, cy, r * 0.98, 0, Math.PI * 2);
  ctx.fill();

  return ctx.getImageData(0, 0, size, size);
}

// Recalcula e aplica o ícone da barra de ferramentas com base no total de
// abas abertas em todas as janelas (não confundir com abas eclipsadas).
async function updateActionIcon() {
  try {
    const tabs = await chrome.tabs.query({});
    const phase = getMoonPhase(tabs.length);
    const sizes = [16, 32, 48, 128];
    const imageData = {};
    sizes.forEach(size => {
      imageData[size] = renderMoonIcon(size, phase);
    });

    await chrome.action.setIcon({ imageData });
    await chrome.action.setTitle({
      title: `Eclipse de Abas — ${tabs.length} aba(s) abertas · ${phase.label} (${phase.percent}%)`
    });
  } catch (e) {
    console.error('[Eclipse de Abas] Erro ao atualizar ícone da barra de ferramentas:', e);
  }
}

// Listener para Comandos de Teclado
chrome.commands.onCommand.addListener(async (command) => {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (command === 'eclipse-current-tab' && activeTab) {
    suspendTab(activeTab);
  } else if (command === 'eclipse-other-tabs' && activeTab) {
    eclipseOtherTabs(activeTab.windowId, activeTab.id);
  }
});

// Listener para Mensagens vindas do Popup ou Options
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    switch (request.action) {
      case 'ECLIPSE_TAB':
        if (request.tabId) {
          const tab = await chrome.tabs.get(request.tabId);
          await suspendTab(tab);
        }
        sendResponse({ success: true });
        break;

      case 'ECLIPSE_OTHER_TABS': {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const suspendedCount = activeTab ? await eclipseOtherTabs(activeTab.windowId, activeTab.id) : 0;
        sendResponse({ success: true, suspendedCount });
        break;
      }

      case 'ECLIPSE_ALL_TABS': {
        const suspendedCount = await eclipseAllTabs(true);
        sendResponse({ success: true, suspendedCount });
        break;
      }

      case 'UNSUSPEND_ALL_TABS': {
        const wokenCount = await unsuspendAllTabs();
        sendResponse({ success: true, wokenCount });
        break;
      }

      case 'GROUP_BY_DOMAIN': {
        const { groupsCreated, tabsGrouped } = await groupByDomain();
        sendResponse({ success: true, groupsCreated, tabsGrouped });
        break;
      }

      case 'GET_STATS':
        const tabsAll = await chrome.tabs.query({});
        let currentSuspended = 0;
        tabsAll.forEach(t => { if (isTabSuspended(t)) currentSuspended++; });
        const storageStats = await chrome.storage.local.get(['savedRamMB', 'eclipsedCount']);

        sendResponse({
          totalOpenTabs: tabsAll.length,
          currentSuspended: currentSuspended,
          eclipsedCountTotal: storageStats.eclipsedCount || 0,
          savedRamMB: (currentSuspended * 150) // RAM economizada atual (estimada em 150MB por aba)
        });
        break;

      default:
        sendResponse({ error: 'Ação desconhecida' });
    }
  })();

  return true; // async response
});

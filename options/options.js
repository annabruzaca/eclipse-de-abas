// Eclipse de Abas - Script da Página de Opções

document.addEventListener('DOMContentLoaded', async () => {
  const suspendTimeoutSelect = document.getElementById('suspend-timeout');
  const customTimeoutGroup = document.getElementById('custom-timeout-group');
  const customTimeoutValue = document.getElementById('custom-timeout-value');
  const customTimeoutUnit = document.getElementById('custom-timeout-unit');
  const neverAudioCheckbox = document.getElementById('never-audio');
  const neverPinnedCheckbox = document.getElementById('never-pinned');

  const whitelistInput = document.getElementById('whitelist-input');
  const btnAddWhitelist = document.getElementById('btn-add-whitelist');
  const whitelistTagsContainer = document.getElementById('whitelist-tags');
  const toast = document.getElementById('toast');

  let currentWhitelist = [];

  // Valores dos presets do <select id="suspend-timeout"> (em minutos).
  // Qualquer valor de suspendTimeout que não esteja nesta lista é tratado como personalizado.
  const PRESET_MINUTES = [5, 15, 30, 60, 120, 240, 480, 720, 1440, 2880, 4320, 0];

  // Carregar opções do storage
  const settings = await chrome.storage.local.get([
    'suspendTimeout',
    'neverSuspendAudio',
    'neverSuspendPinned',
    'whitelist'
  ]);

  const savedTimeout = settings.suspendTimeout !== undefined ? settings.suspendTimeout : 30;
  applySuspendTimeoutToUI(savedTimeout);

  if (settings.neverSuspendAudio !== undefined) {
    neverAudioCheckbox.checked = settings.neverSuspendAudio;
  }
  if (settings.neverSuspendPinned !== undefined) {
    neverPinnedCheckbox.checked = settings.neverSuspendPinned;
  }

  currentWhitelist = settings.whitelist || ['chrome://', 'chrome-extension://', 'devtools://', 'localhost'];
  renderWhitelistTags();

  // Preenche o select e (se for o caso) os campos de personalizado a partir de um valor em minutos salvo.
  function applySuspendTimeoutToUI(totalMinutes) {
    if (PRESET_MINUTES.includes(totalMinutes)) {
      suspendTimeoutSelect.value = String(totalMinutes);
      toggleCustomGroup(false);
      return;
    }

    suspendTimeoutSelect.value = 'custom';
    toggleCustomGroup(true);

    // Escolhe a unidade mais "redonda" pra exibir o valor salvo (dias > horas > minutos).
    if (totalMinutes > 0 && totalMinutes % 1440 === 0) {
      customTimeoutUnit.value = '1440';
      customTimeoutValue.value = totalMinutes / 1440;
    } else if (totalMinutes > 0 && totalMinutes % 60 === 0) {
      customTimeoutUnit.value = '60';
      customTimeoutValue.value = totalMinutes / 60;
    } else {
      customTimeoutUnit.value = '1';
      customTimeoutValue.value = totalMinutes;
    }
  }

  function toggleCustomGroup(show) {
    customTimeoutGroup.hidden = !show;
    if (show) {
      customTimeoutValue.focus();
    }
  }

  // Retorna o valor de suspendTimeout (em minutos) baseado na seleção atual, ou null
  // se "Personalizado" estiver selecionado mas o número ainda não é válido (nada a salvar ainda).
  function getSelectedSuspendMinutes() {
    if (suspendTimeoutSelect.value === 'custom') {
      const amount = parseInt(customTimeoutValue.value, 10);
      const unitMultiplier = parseInt(customTimeoutUnit.value, 10);
      if (!Number.isFinite(amount) || amount <= 0) return null;
      return amount * unitMultiplier;
    }
    return parseInt(suspendTimeoutSelect.value, 10);
  }

  // Listeners para Salvar Automaticamente
  suspendTimeoutSelect.addEventListener('change', () => {
    toggleCustomGroup(suspendTimeoutSelect.value === 'custom');
    saveSettings();
  });
  customTimeoutValue.addEventListener('change', saveSettings);
  customTimeoutUnit.addEventListener('change', saveSettings);
  neverAudioCheckbox.addEventListener('change', saveSettings);
  neverPinnedCheckbox.addEventListener('change', saveSettings);

  // Adicionar à Lista Branca
  btnAddWhitelist.addEventListener('click', addWhitelistDomain);
  whitelistInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addWhitelistDomain();
  });

  async function addWhitelistDomain() {
    const val = whitelistInput.value.trim().toLowerCase();
    if (!val) return;

    if (!currentWhitelist.includes(val)) {
      currentWhitelist.push(val);
      await chrome.storage.local.set({ whitelist: currentWhitelist });
      renderWhitelistTags();
      showToast(`Domínio "${val}" adicionado à lista branca!`);
    }
    whitelistInput.value = '';
  }

  async function removeWhitelistDomain(domain) {
    currentWhitelist = currentWhitelist.filter(item => item !== domain);
    await chrome.storage.local.set({ whitelist: currentWhitelist });
    renderWhitelistTags();
    showToast(`Domínio "${domain}" removido da lista branca!`);
  }

  function renderWhitelistTags() {
    whitelistTagsContainer.innerHTML = '';
    currentWhitelist.forEach(domain => {
      const tag = document.createElement('div');
      tag.className = 'tag-item';
      tag.innerHTML = `
        <span>${escapeHtml(domain)}</span>
        <button class="remove-tag" title="Remover" aria-label="Remover ${escapeHtml(domain)} da lista branca">&times;</button>
      `;

      tag.querySelector('.remove-tag').addEventListener('click', () => {
        removeWhitelistDomain(domain);
      });

      whitelistTagsContainer.appendChild(tag);
    });
  }

  async function saveSettings() {
    const suspendTimeout = getSelectedSuspendMinutes();
    if (suspendTimeout === null) return; // "Personalizado" ainda sem um número válido — não salva

    const neverSuspendAudio = neverAudioCheckbox.checked;
    const neverSuspendPinned = neverPinnedCheckbox.checked;

    await chrome.storage.local.set({
      suspendTimeout,
      neverSuspendAudio,
      neverSuspendPinned
    });

    showToast('Preferências salvas com sucesso!');
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});

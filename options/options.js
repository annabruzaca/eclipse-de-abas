// Eclipse de Abas - Script da Página de Opções

document.addEventListener('DOMContentLoaded', async () => {
  const suspendTimeoutSelect = document.getElementById('suspend-timeout');
  const neverAudioCheckbox = document.getElementById('never-audio');
  const neverPinnedCheckbox = document.getElementById('never-pinned');

  const whitelistInput = document.getElementById('whitelist-input');
  const btnAddWhitelist = document.getElementById('btn-add-whitelist');
  const whitelistTagsContainer = document.getElementById('whitelist-tags');
  const toast = document.getElementById('toast');

  let currentWhitelist = [];

  // Carregar opções do storage
  const settings = await chrome.storage.local.get([
    'suspendTimeout',
    'neverSuspendAudio',
    'neverSuspendPinned',
    'whitelist'
  ]);

  if (settings.suspendTimeout !== undefined) {
    suspendTimeoutSelect.value = settings.suspendTimeout;
  }
  if (settings.neverSuspendAudio !== undefined) {
    neverAudioCheckbox.checked = settings.neverSuspendAudio;
  }
  if (settings.neverSuspendPinned !== undefined) {
    neverPinnedCheckbox.checked = settings.neverSuspendPinned;
  }

  currentWhitelist = settings.whitelist || ['chrome://', 'chrome-extension://', 'devtools://', 'localhost'];
  renderWhitelistTags();

  // Listeners para Salvar Automaticamente
  suspendTimeoutSelect.addEventListener('change', saveSettings);
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
    const suspendTimeout = parseInt(suspendTimeoutSelect.value, 10);
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

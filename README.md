# 🌘 Eclipse de Abas

Extensão para Chrome que hiberna abas inativas para economizar memória RAM, com uma identidade visual de eclipse lunar — o ícone da extensão e o logo do popup mudam de fase conforme a quantidade de abas abertas.

## Funcionalidades

- **Suspensão automática**: abas inativas por um tempo configurável são "eclipsadas" (hibernadas) para liberar RAM.
- **Proteções**: abas fixadas, abas com áudio/vídeo tocando e domínios da lista branca nunca são suspensos automaticamente.
- **Ações rápidas**: eclipsar outras abas, acordar todas, agrupar abas do mesmo domínio em grupos nativos do Chrome.
- **Constelações**: salve a sessão de abas atual e reabra tudo de uma vez depois.
- **Atalhos de teclado**: `Alt+Shift+E` eclipsa a aba atual, `Alt+Shift+O` eclipsa todas as outras.
- **Ícone dinâmico**: o ícone da barra de ferramentas e o logo do popup mostram a lua cada vez mais coberta pela sombra conforme o número de abas abertas cresce — um termômetro visual de "poucas vs. muitas abas", sem limite nem trava de suspensão.

## Instalação manual (modo desenvolvedor)

Enquanto a extensão não está publicada na Chrome Web Store, é possível instalá-la manualmente:

1. Baixe ou clone este repositório.
2. Acesse `chrome://extensions` no Chrome.
3. Ative o **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** e selecione a pasta do projeto.

## Permissões

| Permissão | Uso |
|---|---|
| `tabs` | Ler título/URL das abas e trocar seu conteúdo pela tela de hibernação |
| `storage` | Salvar preferências, lista branca e constelações localmente |
| `alarms` | Verificar periodicamente quais abas estão inativas |
| `contextMenus` | Itens de menu de clique direito para eclipsar abas |
| `tabGroups` | Agrupar abas por domínio |
| `host_permissions: <all_urls>` | Necessário para suspender/restaurar abas de qualquer site |

Nenhum dado é enviado para servidores externos — tudo fica salvo localmente via `chrome.storage.local`.

## Privacidade

Eclipse de Abas não coleta, não envia e não vende nenhum dado do usuário. Preferências, lista branca e sessões salvas ("constelações") ficam guardadas apenas localmente no seu navegador, via `chrome.storage.local`. A extensão não tem servidores próprios, não usa analytics e não faz rastreamento de nenhum tipo.

## Publicando na Chrome Web Store

Veja [`store/CHROME_WEB_STORE.md`](store/CHROME_WEB_STORE.md) para o pacote pronto para envio (descrição, screenshots e justificativa de permissões).

## Estrutura do projeto

```
manifest.json
popup/         # Interface do popup da extensão
options/       # Página de configurações
suspended/     # Tela mostrada em abas eclipsadas
background/    # Service worker (Manifest V3)
shared/        # Lógica compartilhada das fases da lua
assets/icons/  # Ícones da extensão
```

## Licença

Ainda não definida.

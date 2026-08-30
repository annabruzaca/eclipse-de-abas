# Ficha para a Chrome Web Store

Guia com tudo pronto para o envio em https://chrome.google.com/webstore/devconsole (taxa única de registro de desenvolvedor: US$5).

## Pacote

`eclipse-de-abas-v1.0.0.zip`, na raiz do projeto (gerado a partir do `manifest.json` + `popup/` + `options/` + `suspended/` + `background/` + `shared/` + `assets/`). Regenere com:

```bash
cd "Eclipse de Abas"
zip -r -q "eclipse-de-abas-v1.0.1.zip" manifest.json popup options suspended background shared assets -x "*.DS_Store"
```

Troque a versão a cada atualização, junto com o campo `version` do `manifest.json`.

## Nome do item

```
Eclipse de Abas
```

## Resumo curto (máx. 132 caracteres)

```
Hiberne abas inativas para economizar RAM. O ícone muda de fase como um eclipse lunar conforme suas abas se acumulam.
```

## Descrição detalhada

```
Eclipse de Abas suspende (hiberna) as abas que você não está usando para liberar memória RAM do navegador — sem fechar nada, sem perder o que estava aberto. Basta clicar na aba eclipsada para ela voltar exatamente de onde parou.

PRINCIPAIS RECURSOS

🌑 Suspensão automática — abas inativas por um tempo configurável são eclipsadas sozinhas. Ajuste o tempo (ou desative) nas configurações.

🛡️ Proteções inteligentes — abas fixadas, abas tocando áudio/vídeo (Spotify, YouTube, chamadas) e domínios da sua lista branca nunca são suspensos sem você pedir.

⚡ Ações rápidas — eclipsar todas as outras abas, acordar todas de uma vez, ou agrupar abas do mesmo site em grupos nativos e coloridos do Chrome, tudo com um clique.

💫 Constelações — salve a sessão de abas atual com um nome e reabra tudo de uma vez quando quiser, como marcadores de uma sessão inteira.

⌨️ Atalhos de teclado — Alt+Shift+E eclipsa a aba atual, Alt+Shift+O eclipsa todas as outras.

🌘 Ícone vivo — o ícone da extensão e o logo do popup mostram uma lua cada vez mais coberta pela sombra conforme o número de abas abertas cresce. É só um termômetro visual de "poucas vs. muitas abas" — não é um limite nem uma trava de suspensão.

PRIVACIDADE

Eclipse de Abas não coleta, não envia e não vende nenhum dado. Tudo (preferências, lista branca, sessões salvas) fica guardado localmente no seu navegador via chrome.storage.local. Não há servidores próprios, não há analytics, não há rastreamento.
```

## Categoria

Produtividade (Productivity)

## Idioma

Português (Brasil) — principal. (Toda a interface está em pt-BR; se quiser alcance maior, considere adicionar `_locales` com inglês antes de publicar.)

## Screenshots

Todas em 1280×800, prontas para upload (a Chrome Web Store aceita até 5, esse é o limite e já está no pacote):

1. `store/screenshot-1-popup.png` — popup principal, lista de abas aberta, com o selo de abas duplicadas do mesmo domínio.
2. `store/screenshot-2-icone-dinamico.png` — o mesmo popup com muitas abas abertas, mostrando o ícone/logo em fase avançada de eclipse (vermelho).
3. `store/screenshot-3-constelacoes.png` — aba "Constelações Salvas", com sessões de abas salvas.
4. `store/screenshot-4-aba-eclipsada.png` — tela de tela cheia mostrada quando uma aba é eclipsada.
5. `store/screenshot-5-opcoes.png` — página de configurações.

Os dados de abas/sessões nas imagens 1–3 são fictícios (gerados para a captura, não vêm de nenhum navegador real) — troque por capturas do seu próprio uso se preferir algo 100% autêntico, mas não é obrigatório.

## Ícone da loja

`assets/icons/listing128.png` (128×128, já no formato exigido).

## Justificativa de permissões (obrigatório na revisão)

A Google exige uma justificativa curta para cada permissão "poderosa" na aba **Privacy practices** do dashboard. Use estes textos:

| Permissão | Justificativa (colar no formulário) |
|---|---|
| `tabs` | "Necessário para ler o título e a URL das abas abertas, exibi-las na lista do popup e trocar seu conteúdo pela tela de hibernação ao eclipsar/acordar uma aba." |
| `storage` | "Usado para salvar localmente as preferências do usuário (tempo de suspensão, lista branca) e as sessões de abas salvas (\"constelações\"). Nenhum dado sai do dispositivo." |
| `alarms` | "Aciona a verificação periódica (a cada 1 minuto) de quais abas estão inativas há tempo suficiente para serem suspensas automaticamente." |
| `contextMenus` | "Adiciona itens no menu de clique direito para eclipsar a aba atual ou outras abas rapidamente." |
| `tabGroups` | "Usado exclusivamente pela ação \"Agrupar\", que organiza abas do mesmo domínio em grupos nativos do Chrome." |
| Acesso a todos os sites (`<all_urls>`) | "A extensão precisa poder suspender e restaurar qualquer aba, de qualquer site, já que essa é a função principal dela — não é possível saber de antemão quais sites o usuário vai querer eclipsar." |

**Uso de dados remotos**: nenhum. Marque "Não" para coleta/venda/compartilhamento de dados do usuário — tudo é 100% local.

**Política de privacidade**: como não há coleta de dados, uma política formal não é estritamente obrigatória, mas a Chrome Web Store às vezes pede uma URL mesmo assim. Se pedir, publique o texto da seção "Privacidade" acima em uma página (por exemplo, como uma seção do `README.md` no GitHub) e cole a URL, ex:
`https://github.com/annabruzaca/eclipse-de-abas#privacidade`

## Antes de enviar

- [ ] Rodar `git log -1` e conferir que o `manifest.json` do zip bate com a versão publicada no GitHub.
- [ ] (Opcional) Trocar os 5 screenshots por capturas reais do seu uso, se quiser dados 100% autênticos em vez dos fictícios.
- [ ] Revisar a descrição por erros de digitação.
- [ ] Confirmar o e-mail de contato do desenvolvedor no dashboard.

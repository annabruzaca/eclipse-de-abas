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

## Aba "Práticas de privacidade" (Privacy practices) — resolve a tela "Não foi possível publicar"

Essa tela lista tudo que falta preencher antes do envio. Vá em **Editar item → Práticas de privacidade** e preencha cada campo com o texto abaixo (copiar e colar direto).

### Descrição do único propósito (Single purpose)

```
Eclipse de Abas suspende (descarrega da memória) as abas do navegador que o usuário deixou inativas por um tempo configurável, liberando RAM, e permite reativá-las a qualquer momento com um clique. Esse é o único propósito da extensão; os recursos de organização (grupos por domínio, sessões salvas) servem diretamente esse objetivo de gerenciar abas com mais eficiência.
```

### Justificativa de cada permissão

| Campo no formulário | Texto (colar) |
|---|---|
| **Justificativa para `alarms`** | Aciona a verificação periódica (a cada 1 minuto) de quais abas estão inativas há tempo suficiente para serem suspensas automaticamente. |
| **Justificativa para `contextMenus`** | Adiciona itens no menu de clique direito da página para eclipsar a aba atual ou todas as outras rapidamente, sem precisar abrir o popup. |
| **Justificativa para o uso de código remoto** | A extensão não carrega nem executa nenhum código remoto. Todo o HTML, CSS e JavaScript está empacotado localmente dentro da extensão. |
| **Justificativa para `storage`** | Usado para salvar localmente as preferências do usuário (tempo de suspensão, lista branca) e as sessões de abas salvas ("constelações"). Nenhum dado sai do dispositivo. |
| **Justificativa para `tabGroups`** | Usado exclusivamente pela ação "Agrupar", que organiza abas do mesmo domínio em grupos nativos e coloridos do Chrome. |
| **Justificativa para `tabs`** | Necessário para ler o título e a URL das abas abertas, exibi-las na lista do popup e trocar seu conteúdo pela tela de hibernação ao eclipsar/acordar uma aba. |

> "Uso de código remoto" só aparece na lista porque as páginas antes carregavam a fonte Outfit do Google Fonts por um link remoto. Isso foi removido do código (as páginas agora usam a fonte padrão do sistema, que já era o fallback) — então a resposta correta agora é "Não" / justificativa acima confirmando que não há código remoto. **Reempacote o `.zip` depois dessa mudança antes de subir** (veja a seção Pacote).

> **Permissão de host removida** (não precisa mais justificar `<all_urls>`): o `manifest.json` pedia `host_permissions: ["<all_urls>"]`, o que a Google sinaliza como "permissões amplas do host" e atrasa a revisão. Na prática a extensão nunca precisou disso — a permissão `tabs` (já declarada) já dá acesso a título/URL/favicon de todas as abas, e trocar a URL de uma aba para suspender/acordar não exige permissão de host nenhuma. Removida do manifest; reempacote o `.zip` antes de reenviar.

### Uso de dados (Data usage)

Na seção de práticas de dados, marque **"Este item não coleta nem usa dados do usuário"** (ou desmarque todas as categorias de coleta, conforme a UI do momento). Tudo é salvo localmente via `chrome.storage.local`; nada é enviado para fora do dispositivo.

Se o formulário pedir uma **URL de política de privacidade**, use:
`https://github.com/annabruzaca/eclipse-de-abas#privacidade`
(é a seção "Privacidade" do README, já publicada no GitHub.)

### E-mail de contato do publisher

Isso fica em **Configurações da conta** (não na página do item) — eu não tenho como preencher isso por você:

1. No dashboard, abra **Configurações** (ícone de engrenagem / menu da conta).
2. Em **E-mail de contato**, adicione um e-mail e clique em verificar.
3. Confirme o link de verificação que chegar nesse e-mail.

Sem isso, a Google bloqueia a publicação de qualquer item, independente do resto estar certo.

## Antes de enviar

- [ ] Reempacotar o `.zip` (as páginas HTML mudaram ao remover a fonte remota) — veja o comando na seção Pacote.
- [ ] Preencher os 8 campos da aba "Práticas de privacidade" acima.
- [ ] Verificar o e-mail de contato do publisher nas Configurações da conta.
- [ ] Rodar `git log -1` e conferir que o `manifest.json` do zip bate com a versão publicada no GitHub.
- [ ] (Opcional) Trocar os 5 screenshots por capturas reais do seu uso, se quiser dados 100% autênticos em vez dos fictícios.
- [ ] Revisar a descrição por erros de digitação.

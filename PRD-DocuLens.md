# PRD — DocuLens

## 1. Identidade do Projeto

**Nome:** DocuLens

**Nome completo:** DocuLens — Document Viewer for VS Code

**Categoria:** Extensão para Visual Studio Code

**Objetivo principal:**  
Permitir que arquivos `.docx` sejam abertos e visualizados diretamente dentro do VS Code, em uma aba do editor, com uma experiência visual semelhante à de um leitor de PDF.

**Posicionamento:**

> Visualize seus documentos DOCX sem sair do VS Code.

O projeto deve ser desenvolvido inicialmente como um **viewer somente leitura**, com arquitetura preparada para expansão futura.

---

# 2. Problema

O VS Code é excelente para trabalhar com código e arquivos de texto, mas documentos `.docx` não possuem uma experiência de visualização nativa equivalente à oferecida para outros formatos.

Atualmente, o desenvolvedor frequentemente precisa:

```text
VS Code
   ↓
abrir DOCX
   ↓
Word / LibreOffice / navegador
   ↓
visualizar documento
   ↓
voltar para VS Code
```

Isso interrompe o fluxo de trabalho.

O DocuLens deve transformar esse fluxo em:

```text
VS Code
   ↓
duplo clique em arquivo.docx
   ↓
DocuLens
   ↓
documento renderizado
```

Tudo dentro da mesma interface.

---

# 3. Visão do Produto

O DocuLens deve se comportar como um **Custom Editor do VS Code**.

Para o usuário:

```text
Explorer
│
├── src/
├── package.json
├── README.md
└── documento.docx
          │
          ▼
      duplo clique
          │
          ▼
┌─────────────────────────────┐
│      documento.docx         │
├─────────────────────────────┤
│                             │
│      documento renderizado   │
│                             │
│        Página 1             │
│                             │
│        Página 2             │
│                             │
└─────────────────────────────┘
```

O usuário não deve precisar executar um comando manual para abrir um DOCX.

O `.docx` deve ser registrado como um **Custom Editor padrão**, permitindo que o VS Code abra automaticamente o documento com o DocuLens.

Extensões de terceiros existentes já demonstram esse padrão de UX, em que o usuário simplesmente abre o `.docx` e o preview assume a aba do editor.

---

# 4. Objetivos

## 4.1 Objetivos do MVP

O MVP deve:

1. Detectar arquivos `.docx`.
2. Abrir `.docx` diretamente em uma aba do VS Code.
3. Renderizar o conteúdo dentro de um Webview.
4. Preservar o máximo possível da aparência visual do documento.
5. Funcionar sem Microsoft Word.
6. Funcionar sem LibreOffice.
7. Não enviar documentos para servidores externos.
8. Funcionar offline.
9. Respeitar o tema do VS Code na interface da extensão.
10. Atualizar o preview quando o arquivo for alterado externamente.
11. Permitir zoom.
12. Permitir busca no conteúdo.
13. Permitir copiar texto.
14. Tratar erros de documentos inválidos ou não suportados de maneira amigável.

---

# 5. Fora do escopo do MVP

Não implementar inicialmente:

- edição de documentos;
- salvar alterações no DOCX;
- criação de documentos;
- conversão DOCX → PDF;
- conversão PDF → DOCX;
- suporte a `.doc`;
- suporte a `.docm`;
- suporte a `.odt`;
- suporte a `.xlsx`;
- suporte a `.pptx`;
- integração com Microsoft Office;
- integração com Google Docs;
- upload de documentos para serviços externos;
- sincronização em nuvem;
- IA;
- colaboração em tempo real.

O projeto deve ser arquitetado para permitir essas funcionalidades futuramente, porém **não devem fazer parte do MVP**.

---

# 6. Princípios fundamentais

## 6.1 Local-first

O documento do usuário deve permanecer local.

O processamento deve ocorrer dentro da máquina do usuário.

Não fazer:

```text
DOCX
 ↓
servidor externo
 ↓
HTML
 ↓
VS Code
```

Preferir:

```text
DOCX
 ↓
processamento local
 ↓
Webview
 ↓
renderização
```

O projeto deve seguir o princípio:

> O documento nunca precisa sair da máquina do usuário para ser visualizado.

---

# 7. Stack tecnológica

## 7.1 Linguagem

**TypeScript**

Motivos:

- tipagem estática;
- excelente integração com VS Code API;
- suporte a interfaces;
- enums/types;
- melhor manutenção;
- escalabilidade;
- bom suporte de tooling.

---

# 8. VS Code API

Utilizar:

```text
VS Code Extension API
```

Principalmente:

```text
vscode.CustomReadonlyEditorProvider
vscode.WebviewPanel
vscode.Uri
vscode.workspace.fs
vscode.commands
vscode.window
vscode.Disposable
```

O editor deve ser implementado utilizando a API oficial de **Custom Editors**, em vez de abrir um Webview Panel isolado.

A documentação oficial do VS Code posiciona Custom Editors como mecanismo para criar editores personalizados para tipos de arquivo específicos.

---

# 9. Renderização DOCX

## Biblioteca principal

Utilizar:

```text
docx-preview
```

A biblioteca deve ser tratada como um detalhe de infraestrutura, e não como uma dependência espalhada pelo sistema.

Não fazer:

```ts
// qualquer arquivo do projeto
import { renderAsync } from "docx-preview";
```

Preferir:

```text
Application
     ↓
DocxRenderer interface
     ↓
DocxPreviewRenderer
     ↓
docx-preview
```

Isso permitirá substituir o motor de renderização futuramente.

---

# 10. Abstração do Renderer

Criar uma interface:

```ts
export interface DocumentRenderer {
    render(
        document: Uint8Array,
        container: HTMLElement
    ): Promise<void>;
}
```

Implementação:

```text
DocumentRenderer
       │
       └── DocxPreviewRenderer
                  │
                  └── docx-preview
```

No futuro:

```text
DocumentRenderer
       ├── DocxPreviewRenderer
       ├── AlternativeDocxRenderer
       ├── PdfRenderer
       └── OdtRenderer
```

Não implementar esses renderers adicionais no MVP.

---

# 11. Arquitetura

Utilizar uma arquitetura modular inspirada em:

- Feature First;
- Clean Architecture;
- SOLID;
- separação de responsabilidades;
- Dependency Inversion;
- composição por interfaces.

Não aplicar arquitetura excessivamente complexa sem necessidade.

O objetivo é:

> simplicidade no MVP + capacidade de evolução.

---

# 12. Estrutura inicial

A estrutura recomendada:

```text
doculens/
│
├── src/
│   │
│   ├── extension/
│   │   └── activate.ts
│   │
│   ├── features/
│   │   └── document-viewer/
│   │       │
│   │       ├── application/
│   │       │   ├── DocumentService.ts
│   │       │   └── RenderDocumentUseCase.ts
│   │       │
│   │       ├── domain/
│   │       │   ├── Document.ts
│   │       │   ├── DocumentType.ts
│   │       │   └── DocumentRenderer.ts
│   │       │
│   │       ├── infrastructure/
│   │       │   ├── DocxFileReader.ts
│   │       │   └── DocxPreviewRenderer.ts
│   │       │
│   │       └── presentation/
│   │           ├── DocxCustomEditorProvider.ts
│   │           └── webview/
│   │               ├── index.ts
│   │               ├── index.html
│   │               └── styles.css
│   │
│   └── shared/
│       ├── errors/
│       ├── logging/
│       ├── utils/
│       └── types/
│
├── test/
│   ├── unit/
│   └── integration/
│
├── package.json
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
├── esbuild.js
├── README.md
├── CHANGELOG.md
├── LICENSE
└── THIRD_PARTY_NOTICES.md
```

A arquitetura deve permitir que novos formatos possam ser adicionados futuramente sem modificar excessivamente o código existente.

---

# 13. Feature First

A implementação deve ser organizada por funcionalidade.

Evitar uma estrutura genérica como:

```text
controllers/
models/
services/
repositories/
components/
utils/
```

para todo o sistema.

Preferir:

```text
features/
    document-viewer/
```

E, no futuro:

```text
features/
    document-viewer/
    search/
    settings/
    document-outline/
```

Porém, não criar features vazias antecipadamente.

---

# 14. Fluxo completo de abertura

## Fluxo principal

```text
Usuário
   │
   │ duplo clique
   ▼
documento.docx
   │
   ▼
VS Code
   │
   ▼
Custom Editor Registry
   │
   ▼
DocxCustomEditorProvider
   │
   ▼
openCustomDocument()
   │
   ▼
CustomDocument
   │
   ▼
resolveCustomEditor()
   │
   ├── lê documento
   │
   ├── cria Webview
   │
   └── inicializa renderer
   │
   ▼
Webview
   │
   ▼
DocxRenderer
   │
   ▼
docx-preview
   │
   ▼
HTML/CSS
   │
   ▼
Documento renderizado
```

---

# 15. Custom Editor

Registrar no `package.json`:

```json
{
  "contributes": {
    "customEditors": [
      {
        "viewType": "doculens.docxViewer",
        "displayName": "DocuLens",
        "selector": [
          {
            "filenamePattern": "*.docx"
          }
        ],
        "priority": "default"
      }
    ]
  }
}
```

O `priority` deve ser configurado para permitir a abertura automática do `.docx`.

O usuário também deve conseguir utilizar:

```text
Reopen Editor With...
```

caso queira abrir o mesmo arquivo utilizando outro editor.

---

# 16. Webview

O Webview será responsável exclusivamente pela apresentação.

Responsabilidades:

- renderização;
- toolbar;
- zoom;
- busca;
- controles de navegação;
- estado visual;
- interação do usuário;
- exibição de mensagens de erro.

Não colocar regras de negócio complexas no Webview.

---

# 17. Comunicação Extension ↔ Webview

Utilizar:

```ts
webview.postMessage(...)
```

e:

```ts
window.addEventListener("message", ...)
```

Criar tipos para as mensagens.

Exemplo:

```ts
type WebviewMessage =
    | {
        type: "zoom-in";
      }
    | {
        type: "zoom-out";
      }
    | {
        type: "reset-zoom";
      }
    | {
        type: "search";
        query: string;
      };
```

Não utilizar strings espalhadas pelo código:

```ts
postMessage({
    type: "zoom-in"
});
```

sem um modelo tipado central.

---

# 18. Segurança do Webview

A extensão deve utilizar uma política de segurança restritiva.

Implementar:

```text
Content Security Policy
```

O Webview não deve permitir:

```text
javascript inline arbitrário
requests externos
CDNs
scripts de terceiros externos
```

As bibliotecas necessárias devem ser empacotadas localmente.

Não utilizar:

```html
<script src="https://cdn..."></script>
```

Preferir assets locais e `webview.asWebviewUri()`.

---

# 19. Privacidade

O projeto deve ser:

```text
Offline-first
Local-first
Privacy-first
```

Não implementar telemetria no MVP.

Não enviar conteúdo do documento para:

- APIs externas;
- servidores próprios;
- analytics;
- serviços de terceiros.

O README deve explicar claramente essa característica.

---

# 20. Interface visual

A interface deve se inspirar conceitualmente em leitores de PDF modernos dentro do VS Code.

Exemplo:

```text
┌─────────────────────────────────────────────────────┐
│ documento.docx                                      │
├─────────────────────────────────────────────────────┤
│  🔍     −   100%   +     ⛶          1 / 8          │
├─────────────────────────────────────────────────────┤
│                                                     │
│           ┌─────────────────────────┐               │
│           │                         │               │
│           │                         │               │
│           │       DOCUMENTO         │               │
│           │                         │               │
│           │       Lorem ipsum       │               │
│           │                         │               │
│           └─────────────────────────┘               │
│                                                     │
│           ┌─────────────────────────┐               │
│           │                         │               │
│           │       Página 2          │               │
│           │                         │               │
│           └─────────────────────────┘               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

# 21. Design System

Não hardcodar cores arbitrárias.

Utilizar variáveis e tokens baseados nas cores fornecidas pelo VS Code.

Exemplo:

```css
:root {
    --doculens-background: var(--vscode-editor-background);
    --doculens-foreground: var(--vscode-editor-foreground);
    --doculens-toolbar: var(--vscode-titleBar-activeBackground);
    --doculens-border: var(--vscode-panel-border);
}
```

A interface deve funcionar corretamente em:

```text
Light Theme
Dark Theme
High Contrast
```

---

# 22. Responsividade

O Webview deve funcionar corretamente quando o usuário:

- redimensionar o painel;
- utilizar split editor;
- abrir o documento em uma tela menor;
- utilizar zoom do VS Code;
- utilizar diferentes densidades de interface.

Evitar posições absolutas desnecessárias.

---

# 23. Funcionalidade: Zoom

Implementar:

```text
Zoom In
Zoom Out
Reset Zoom
```

Com valores controlados.

Exemplo:

```text
50%
75%
90%
100%
110%
125%
150%
175%
200%
```

Não permitir zoom infinito.

O zoom deve ser gerenciado por um serviço/estado centralizado do Webview.

---

# 24. Atalhos

Implementar:

```text
Ctrl + +
Ctrl + -
Ctrl + 0
Ctrl + F
```

No macOS:

```text
Cmd + +
Cmd + -
Cmd + 0
Cmd + F
```

Os atalhos devem respeitar os padrões do VS Code e não devem quebrar comandos nativos desnecessariamente.

---

# 25. Busca

Implementar busca textual dentro do documento renderizado.

Requisitos:

- abrir com `Ctrl + F`;
- pesquisar texto;
- próximo resultado;
- resultado anterior;
- fechar busca com `Esc`;
- destacar ocorrências;
- permitir pesquisa case-insensitive;
- não travar documentos grandes.

A arquitetura deve separar:

```text
SearchController
SearchState
SearchRenderer
```

para evitar acoplamento.

---

# 26. Copiar texto

O texto renderizado deve ser selecionável sempre que a biblioteca de renderização permitir.

O comportamento esperado:

```text
selecionar texto
       ↓
Ctrl + C
       ↓
texto copiado
```

Não implementar um mecanismo artificial de seleção caso o DOM renderizado já ofereça seleção nativa.

---

# 27. Atualização automática

Quando o arquivo mudar no disco:

```text
documento.docx
     │
     │ alteração externa
     ▼
FileSystemWatcher
     │
     ▼
reload
     │
     ▼
renderer
     │
     ▼
Webview atualizado
```

Utilizar os mecanismos oficiais do VS Code para observar alterações.

Evitar polling:

```ts
setInterval(...)
```

quando não for necessário.

---

# 28. Estado do documento

O estado deve ser separado de:

- UI;
- renderer;
- filesystem.

Modelo conceitual:

```ts
interface DocumentState {
    uri: vscode.Uri;
    zoom: number;
    isLoading: boolean;
    error?: DocumentError;
}
```

Não armazenar objetos enormes do DOCX no estado global quando não for necessário.

---

# 29. Tratamento de erros

Criar erros específicos.

Exemplo:

```ts
class DocumentReadError extends Error {}

class DocumentRenderError extends Error {}

class UnsupportedDocumentError extends Error {}
```

A UI deve apresentar mensagens úteis.

Exemplo:

```text
Não foi possível visualizar este documento.

O arquivo pode estar:
• corrompido;
• protegido;
• incompleto;
• utilizando recursos não suportados.

Tente abrir o documento novamente ou utilize
"Reopen Editor With..." para escolher outro editor.
```

Nunca exibir stack trace para o usuário final.

Logs técnicos podem existir no Output Channel.

---

# 30. Logging

Criar um logger centralizado:

```ts
Logger.info(...)
Logger.warn(...)
Logger.error(...)
```

Utilizar:

```text
DocuLens
```

como prefixo.

Exemplo:

```text
[DocuLens] Loading document
[DocuLens] Rendering document
[DocuLens] Render completed
```

Não logar conteúdo completo do documento.

Não logar informações potencialmente sensíveis do usuário.

---

# 31. Dependency Injection

Evitar criar dependências diretamente dentro das classes quando isso dificulta testes.

Ruim:

```ts
class DocumentService {
    private renderer = new DocxPreviewRenderer();
}
```

Preferir:

```ts
class DocumentService {
    constructor(
        private readonly renderer: DocumentRenderer,
        private readonly fileReader: FileReader
    ) {}
}
```

Assim podemos testar com mocks/fakes.

---

# 32. SOLID

Aplicar os princípios somente onde trouxerem benefício real.

### Single Responsibility

Uma classe deve possuir uma responsabilidade clara.

Exemplo:

```text
DocxFileReader
→ lê arquivo

DocxPreviewRenderer
→ renderiza arquivo

DocxCustomEditorProvider
→ integra com VS Code

SearchService
→ busca conteúdo
```

Não criar uma classe gigantesca:

```text
DocxManagerEverything
```

---

### Open/Closed

O sistema deve permitir novos renderizadores sem reescrever a aplicação.

```text
DocumentRenderer
       │
       ├── DocxPreviewRenderer
       └── FutureRenderer
```

---

### Dependency Inversion

A camada de aplicação deve depender de abstrações:

```text
Application
     ↓
DocumentRenderer
```

e não diretamente:

```text
Application
     ↓
docx-preview
```

---

# 33. DRY

Não duplicar:

- mensagens;
- tipos;
- comunicação de mensagens;
- constantes;
- configuração;
- lógica de zoom;
- lógica de tema.

Mas não transformar pequenos trechos simples em abstrações desnecessárias.

---

# 34. KISS

Preferir:

```text
solução simples e correta
```

a:

```text
arquitetura complexa e prematura
```

Não introduzir:

- frameworks;
- containers de DI complexos;
- state managers;
- abstrações genéricas;
- bibliotecas desnecessárias.

sem necessidade concreta.

---

# 35. YAGNI

Não implementar funcionalidades futuras antes que sejam necessárias.

Por exemplo, não criar agora:

```text
PdfRenderer
ExcelRenderer
PowerPointRenderer
CloudService
AIService
SyncService
```

somente porque a arquitetura poderia suportar isso.

Criar somente as abstrações necessárias para evitar acoplamento.

---

# 36. SOLID + Feature First

A combinação desejada é:

```text
features/
   document-viewer/
       domain/
       application/
       infrastructure/
       presentation/
```

e não:

```text
SOLID/
CleanArchitecture/
DDD/
```

como objetivo por si só.

A arquitetura deve servir ao produto.

---

# 37. Performance

A extensão precisa evitar bloquear o Extension Host.

Prioridades:

1. não bloquear a UI;
2. evitar operações síncronas desnecessárias;
3. evitar cópias redundantes de buffers;
4. não renderizar o mesmo documento várias vezes sem necessidade;
5. liberar recursos quando o editor for fechado;
6. utilizar lazy operations quando possível.

---

# 38. Documentos grandes

O MVP deve funcionar bem em documentos pequenos e médios.

A arquitetura deve considerar documentos grandes.

Criar configurações futuras possíveis:

```text
maxFileSize
renderTimeout
retainContext
```

Porém, não adicionar dezenas de configurações prematuramente.

Para documentos muito grandes, o sistema deve falhar de maneira controlada em vez de consumir memória indefinidamente.

---

# 39. Lifecycle

Todos os recursos precisam respeitar o lifecycle do VS Code.

Ao fechar o editor:

```text
Webview
   ↓
listeners
   ↓
watchers
   ↓
subscriptions
```

devem ser liberados.

Utilizar:

```ts
context.subscriptions.push(...)
```

sempre que apropriado.

Evitar memory leaks.

---

# 40. Concorrência

O sistema deve suportar:

```text
documento-a.docx
documento-b.docx
documento-c.docx
```

abertos simultaneamente.

Cada editor deve possuir seu próprio estado.

Não utilizar um singleton global contendo o estado do documento atualmente aberto.

Ruim:

```ts
let currentDocument: Document;
```

Preferir estado por instância do editor.

---

# 41. Cache

Não implementar cache complexo no MVP.

Caso posteriormente seja necessário cachear renderizações:

```text
URI + file modification timestamp
```

pode ser utilizado como chave.

Qualquer cache deve possuir:

- limite;
- invalidação;
- limpeza;
- estratégia previsível.

---

# 42. Testes

## Unitários

Testar:

```text
DocumentService
DocxFileReader
estado de zoom
SearchService
tratamento de erros
mensagens
```

Não testar bibliotecas externas.

---

## Integration

Testar:

```text
DOCX
 ↓
Custom Editor
 ↓
Webview initialization
```

quando possível.

---

## Manual QA

Criar uma coleção de DOCX de teste contendo:

1. texto;
2. títulos;
3. negrito;
4. itálico;
5. listas;
6. tabelas;
7. imagens;
8. links;
9. cabeçalhos;
10. rodapés;
11. múltiplas páginas;
12. diferentes tamanhos de fonte;
13. diferentes alinhamentos;
14. quebras de página;
15. documentos grandes;
16. documentos inválidos.

---

# 43. Critérios de aceitação do MVP

O MVP somente será considerado concluído quando:

### Abertura

- [ ] duplo clique em `.docx` abre o DocuLens;
- [ ] não é necessário executar comando manual;
- [ ] documento aparece dentro de uma aba do VS Code;
- [ ] `Reopen Editor With...` funciona.

### Renderização

- [ ] texto aparece corretamente;
- [ ] estilos básicos são preservados;
- [ ] tabelas são renderizadas;
- [ ] imagens são renderizadas;
- [ ] listas são renderizadas;
- [ ] múltiplas páginas funcionam;
- [ ] documentos em português funcionam corretamente.

### UX

- [ ] zoom in;
- [ ] zoom out;
- [ ] reset zoom;
- [ ] busca;
- [ ] copiar texto;
- [ ] interface responsiva;
- [ ] tema claro;
- [ ] tema escuro;
- [ ] high contrast sem quebrar a UI.

### Segurança

- [ ] sem CDN;
- [ ] sem upload externo;
- [ ] CSP configurado;
- [ ] scripts locais;
- [ ] conteúdo permanece local.

### Qualidade

- [ ] TypeScript strict;
- [ ] ESLint funcionando;
- [ ] Prettier configurado;
- [ ] testes configurados;
- [ ] build reproduzível;
- [ ] extensão pode ser empacotada em `.vsix`.

---

# 44. Configuração TypeScript

Utilizar strict mode.

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

Não utilizar:

```ts
any
```

sem justificativa explícita.

Quando uma API externa exigir tipagem difícil:

```ts
unknown
```

deve ser preferido a:

```ts
any
```

com validação posterior.

---

# 45. Build

Utilizar:

```text
esbuild
```

O bundle final da extensão deve conter as dependências necessárias.

A extensão não deve depender de:

```text
npm install
```

na máquina do usuário.

O pacote `.vsix` deve ser autocontido.

---

# 46. Scripts

O `package.json` deve possuir pelo menos:

```text
dev
build
watch
lint
format
test
package
```

Exemplo conceitual:

```bash
pnpm dev
pnpm build
pnpm watch
pnpm lint
pnpm test
pnpm package
```

---

# 47. Gerenciamento de dependências

Utilizar:

```text
pnpm
```

Manter dependências no menor número possível.

Antes de adicionar uma biblioteca:

1. verificar se a funcionalidade pode ser implementada com API nativa;
2. avaliar tamanho;
3. avaliar manutenção;
4. avaliar licença;
5. avaliar segurança;
6. avaliar necessidade real.

---

# 48. Licenças

O projeto deve possuir:

```text
LICENSE
THIRD_PARTY_NOTICES.md
```

Todas as dependências utilizadas devem ser verificadas quanto às respectivas licenças.

As licenças das bibliotecas distribuídas junto à extensão devem ser respeitadas.

---

# 49. VSIX

O projeto deve permitir:

```bash
pnpm package
```

gerando:

```text
doculens-x.y.z.vsix
```

Essa instalação deve funcionar em um VS Code limpo.

Testar:

```bash
code --install-extension doculens-x.y.z.vsix
```

---

# 50. Versionamento

Utilizar Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

Exemplo:

```text
0.1.0
```

MVP:

```text
0.1.0
```

Primeira versão estável:

```text
1.0.0
```

---

# 51. Roadmap

## Fase 1 — MVP

```text
DOCX
 ↓
Custom Editor
 ↓
Webview
 ↓
docx-preview
 ↓
renderização
```

Funcionalidades:

- abertura automática;
- renderização;
- zoom;
- busca;
- copiar;
- tema;
- reload;
- tratamento de erros.

---

## Fase 2 — UX

Adicionar:

- outline;
- navegação por títulos;
- indicador de página;
- fit to width;
- fit to page;
- persistência do zoom;
- persistência de preferências;
- miniatura de páginas, caso tecnicamente viável.

---

## Fase 3 — Performance

Adicionar:

- otimização para documentos grandes;
- rendering incremental;
- gerenciamento de memória;
- melhorias de cache;
- métricas locais de performance durante desenvolvimento.

---

## Fase 4 — Mais formatos

Arquitetura preparada para:

```text
.docx
.pdf
.pptx
.xlsx
.odt
```

Cada formato deve possuir seu próprio renderer.

Exemplo:

```text
DocumentRenderer
│
├── DocxRenderer
├── PdfRenderer
├── PptxRenderer
└── OdtRenderer
```

Não implementar agora.

---

## Fase 5 — Edição

Somente após o viewer estar maduro.

Possível arquitetura:

```text
DOCX
 ↓
Document Model
 ↓
Editor
 ↓
Document Model
 ↓
DOCX Serializer
 ↓
DOCX
```

Isso deve ser tratado como um projeto significativamente maior que o viewer.

---

# 52. Requisitos não funcionais

## Performance

A abertura de um documento comum deve parecer rápida para o usuário.

O sistema não deve bloquear desnecessariamente a interface do VS Code.

## Segurança

Nenhuma execução arbitrária de conteúdo proveniente do DOCX.

## Privacidade

Nenhum documento deve ser enviado para terceiros.

## Manutenibilidade

Código modular e tipado.

## Extensibilidade

Novos renderizadores devem poder ser adicionados sem reescrever o núcleo.

## Compatibilidade

A extensão deve funcionar em Windows, Linux e macOS, respeitando as APIs multiplataforma do VS Code.

---

# 53. Regras de implementação para o OpenCode

Estas regras são obrigatórias.

## Regra 1 — Não implementar tudo de uma vez

O desenvolvimento deve ser incremental.

Ordem:

```text
Projeto base
 ↓
Custom Editor
 ↓
Webview
 ↓
DOCX rendering
 ↓
UX
 ↓
Testes
 ↓
Performance
```

---

## Regra 2 — Inspecionar antes de alterar

Antes de modificar qualquer arquivo:

1. ler a estrutura;
2. verificar `package.json`;
3. verificar TypeScript;
4. verificar scripts;
5. verificar dependências;
6. identificar arquitetura existente;
7. identificar conflitos.

Não assumir que arquivos ou configurações existem.

---

## Regra 3 — Não inventar APIs

Sempre utilizar APIs reais da versão do VS Code configurada no projeto.

---

## Regra 4 — Não introduzir dependências sem necessidade

Toda nova dependência deve possuir uma justificativa técnica.

---

## Regra 5 — Não acoplar o domínio ao VS Code

As regras centrais do documento não devem depender diretamente de `vscode`.

Exemplo ruim:

```ts
class DocumentService {
    constructor(private vscode: typeof import("vscode")) {}
}
```

Preferir separar:

```text
Domain
Application
Infrastructure
VS Code Adapter
```

---

## Regra 6 — Não acoplar a aplicação ao docx-preview

A aplicação não deve chamar `docx-preview` diretamente.

Utilizar:

```text
DocumentRenderer
```

---

## Regra 7 — Não utilizar `any` indiscriminadamente

Sempre tentar manter tipagem segura.

---

## Regra 8 — Evitar abstrações prematuras

Não criar abstração somente porque "Clean Architecture exige".

Criar abstração quando houver:

- necessidade;
- variação esperada;
- benefício de teste;
- desacoplamento importante.

---

## Regra 9 — Não alterar arquivos fora do escopo

Não modificar configurações do sistema ou do VS Code do usuário.

---

## Regra 10 — Não utilizar serviços externos

O MVP deve funcionar completamente offline.

---

# 54. Fluxo esperado após instalação

A experiência final deve ser:

```text
Usuário instala DocuLens
          │
          ▼
abre projeto no VS Code
          │
          ▼
encontra arquivo.docx
          │
          ▼
duplo clique
          │
          ▼
DocuLens abre automaticamente
          │
          ▼
documento aparece renderizado
          │
          ├── zoom
          ├── busca
          ├── copiar
          └── navegação
```

O objetivo é que essa experiência seja tão natural quanto:

```text
clicar em um .pdf
```

---

# 55. Definição de pronto

Uma funcionalidade só pode ser considerada concluída quando:

```text
Código
 +
Testes
 +
Lint
 +
Build
 +
UX
 +
Tratamento de erros
```

estiverem funcionando.

Não considerar:

```text
"compilou"
```

como definição de pronto.

---

# 56. Resultado esperado

Ao final do MVP deverá existir uma extensão VS Code instalável via `.vsix` que:

```text
┌──────────────────────────────────────────────┐
│                  DocuLens                    │
│                                              │
│      Visualizador DOCX para VS Code          │
│                                              │
│  arquivo.docx                               │
│        ↓                                     │
│  abre automaticamente                        │
│        ↓                                     │
│  renderiza documento                          │
│        ↓                                     │
│  permanece dentro do VS Code                 │
│                                              │
└──────────────────────────────────────────────┘
```

O produto deve ser:

**rápido, local, seguro, modular, tipado, testável e preparado para evolução.**

---

# 57. Primeira tarefa do OpenCode

Antes de implementar:

1. analisar completamente o repositório;
2. identificar se o projeto já possui arquivos;
3. identificar conflitos de configuração;
4. verificar versão mínima do VS Code;
5. verificar Node.js e package manager;
6. verificar arquitetura atual;
7. apresentar uma análise da implementação proposta;
8. propor a estrutura final;
9. somente depois iniciar a implementação.

**IMPORTANTE:**

Não criar a implementação completa em uma única etapa.

O desenvolvimento deve seguir pequenas fases verificáveis.

Primeira implementação:

```text
Scaffold
   ↓
Custom Editor
   ↓
abrir .docx
   ↓
Webview
   ↓
primeira renderização
```

Somente após validar essa cadeia implementar as funcionalidades adicionais.

---

# 58. Comando inicial recomendado para o OpenCode

Utilizar este PRD como fonte de verdade.

Primeiro:

> Analise o PRD do DocuLens e o repositório atual. Não implemente nada ainda. Inspecione a estrutura, dependências, configurações, versão do VS Code, TypeScript, scripts de build e arquitetura existente. Identifique possíveis conflitos e apresente uma proposta de implementação incremental alinhada ao PRD. Não invente contexto e não altere arquivos nesta etapa.

Após aprovação da análise, iniciar pela Fase 1.

---

# 59. Regra final

Sempre priorizar nesta ordem:

```text
Corretude
   ↓
Segurança
   ↓
Experiência do usuário
   ↓
Performance
   ↓
Manutenibilidade
   ↓
Extensibilidade
```

Não sacrificar segurança ou corretude para obter uma implementação mais rápida.

Não adicionar complexidade arquitetural sem benefício concreto.
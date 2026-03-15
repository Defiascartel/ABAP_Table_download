# WalkMe CLI - Istruzioni per Claude

## Panoramica progetto

CLI Node.js (ESM) per generare e gestire **tutti i tipi di contenuto WalkMe** per SAP Fiori / BTP Work Zone.

Tre modalità:
1. **Generazione locale** - da specifica JSON/YAML o interattiva
2. **Generazione con Claude AI** - analisi PDF di documentazione SAP (`pdf`)
3. **Gestione remota** - API REST WalkMe con OAuth2 (`list`, `publish`, `goals`, `segments`)

## Struttura progetto

```
walkme-cli/
├── bin/walkme-cli.js              # Entry point CLI (Commander.js)
├── src/
│   ├── commands/
│   │   ├── generate.js            # Smart Walk-Thru interattivo/da file
│   │   ├── create-content.js      # SmartTips, Launcher, ShoutOut, Survey, Shuttle, Resource
│   │   ├── pdf.js                 # Analisi PDF con Claude API
│   │   ├── content.js             # Gestione contenuti remoti (list/publish/analytics)
│   │   ├── goals.js               # CRUD goals WalkMe
│   │   ├── segments.js            # CRUD segmenti WalkMe
│   │   ├── templates.js           # Template per transazioni SAP
│   │   ├── validate.js            # Validazione flussi (tutti i tipi)
│   │   ├── convert.js             # Conversione JSON <-> YAML
│   │   ├── selectors.js           # Catalogo selettori CSS Fiori
│   │   ├── spec.js                # Generatore specifica vuota
│   │   └── config.js              # Gestione configurazione
│   ├── generator.js               # Core: converte specifica -> contenuto WalkMe
│   ├── schema/
│   │   └── walkme-flow.js         # Schema e factory per TUTTI i tipi WalkMe
│   ├── templates/
│   │   └── sap-fiori.js           # Selettori CSS SAP Fiori/UI5 + mappa transazioni
│   └── utils/
│       ├── config.js              # Persistenza config (~/.walkme-cli/config.json)
│       └── walkme-api.js          # Client HTTP API WalkMe (OAuth2)
└── package.json
```

## I 7 tipi di contenuto WalkMe

| Tipo | Comando CLI | Quando usarlo |
|------|-------------|---------------|
| **Smart Walk-Thru** | `generate` | Guida passo-passo che accompagna l'utente in un processo SAP |
| **SmartTips** | `smarttips` | Tooltip contestuali su campi/elementi UI per spiegare cosa fare |
| **Launcher** | `launcher` | Pulsante/widget flottante che avvia un Walk-Thru o apre un URL |
| **ShoutOut** | `shoutout` | Banner/popup overlay per annunci, onboarding, notifiche |
| **Survey** | `survey` | Sondaggio in-app per raccogliere feedback utenti |
| **Shuttle** | `shuttle` | Popup informativo multi-pagina (tutorial, changelog, guide) |
| **Resource** | `resource` | Menu help center con link a Walk-Thru, articoli, video |

### Quando scegliere quale tipo

```
L'utente deve completare un processo SAP?
  └─> Smart Walk-Thru

Devo spiegare un campo o un'area dell'interfaccia?
  └─> SmartTips

Devo avviare qualcosa (Walk-Thru, URL) con un pulsante visibile?
  └─> Launcher

Devo comunicare un annuncio, un cambio, una novità?
  └─> ShoutOut

Devo raccogliere feedback sulla UX o sulla soddisfazione?
  └─> Survey

Devo spiegare un concetto con più pagine (come una presentazione)?
  └─> Shuttle

Devo creare un punto di accesso a tutte le risorse di aiuto?
  └─> Resource
```

---

## 1. Smart Walk-Thru

Guida passo-passo sequenziale. Ogni step si ancora a un elemento UI.

### Specifica

```json
{
  "contentType": "SmartWalkThru",
  "name": "Crea ordine di vendita",
  "description": "Guida per la creazione di un ordine in VA01",
  "transaction": "VA01",
  "fioriApp": "SalesOrder-create",
  "language": "it",
  "tags": ["SD", "VA01"],
  "steps": [
    { "type": "popup", "title": "Benvenuto", "content": "Ti guideremo nella creazione...", "selector": "#shell-header", "position": "bottom" },
    { "type": "click", "title": "Apri l'app", "content": "Clicca sul tile Crea Ordine", "selector": ".sapUshellTile[title=\"Create Sales Order\"]" },
    { "type": "waitFor", "title": "Caricamento", "content": "Attendi...", "selector": ".sapUiCompFilterBar", "timeout": 15000 },
    { "type": "type", "title": "Cliente", "content": "Inserisci il codice cliente", "selector": "input[id*=\"customer\"]", "inputValue": "1000" },
    { "type": "click", "title": "Salva", "content": "Clicca Salva per confermare", "fioriElement": "save-btn" },
    { "type": "popup", "title": "Completato!", "content": "L'ordine è stato creato.", "selector": ".sapMMsgStrip" }
  ],
  "goals": [{ "name": "Ordine creato", "type": "custom" }]
}
```

### Tipi di step

| Tipo        | Uso                                | Campi richiesti               |
|-------------|-------------------------------------|-------------------------------|
| `popup`     | Balloon informativo su un elemento  | selector, title, content      |
| `click`     | Indica di cliccare un elemento      | selector, title, content      |
| `type`      | Inserimento testo in un campo       | selector, title, inputValue   |
| `select`    | Selezione da dropdown               | selector, title, selectValue  |
| `redirect`  | Navigazione a un URL                | url, title                    |
| `waitFor`   | Attesa di un elemento/condizione    | selector, timeout             |
| `splitStep` | Branch condizionale                 | condition, trueBranch, falseBranch |
| `autoStep`  | Azione automatica (no interazione)  | selector, action, value       |

### Regole per buoni Walk-Thru

1. **Primo step:** popup di benvenuto su `#shell-header` con posizione `bottom`
2. **Secondo step:** click sulla tile o redirect all'app Fiori
3. **Terzo step:** waitFor per il caricamento (filter-bar o smart-table)
4. **Step successivi** seguono il processo SAP reale
5. **Ultimo step:** popup di conferma che il processo è completato
6. **Ogni step deve avere un selettore valido** - mai lasciare vuoto
7. **Contenuto in italiano**, chiaro e diretto
8. **Titoli brevi** (max 40 caratteri)
9. **splitStep per scenari alternativi** (es. messaggio di errore)
10. **waitFor dopo azioni che causano caricamento** (save, submit, navigazione)

---

## 2. SmartTips

Tooltip che appaiono su elementi UI per spiegarne il significato. Non sono sequenziali - ogni tip è indipendente.

### Specifica

```json
{
  "contentType": "SmartTips",
  "name": "Tips per form Ordine Vendita",
  "description": "Spiegazioni sui campi principali del form VA01",
  "transaction": "VA01",
  "tags": ["SD", "onboarding"],
  "tips": [
    {
      "selector": "input[id*=\"customer\"]",
      "title": "Codice Cliente",
      "content": "Inserisci il codice SAP del cliente (es. 1000). Usa il Value Help per cercare.",
      "trigger": "focus",
      "icon": "info"
    },
    {
      "selector": "input[id*=\"material\"]",
      "title": "Materiale",
      "content": "Codice materiale da ordinare. Verifica la disponibilità prima di confermare.",
      "trigger": "focus",
      "icon": "info"
    },
    {
      "selector": ".sapMBarChild button[id*=\"Save\"]",
      "title": "Salva ordine",
      "content": "Attenzione: il salvataggio è definitivo. Verifica tutti i dati prima di procedere.",
      "trigger": "hover",
      "icon": "warning"
    }
  ]
}
```

### Proprietà SmartTip

| Campo     | Valori                                      | Default  |
|-----------|---------------------------------------------|----------|
| `trigger` | `hover`, `focus`, `click`, `always`         | `hover`  |
| `icon`    | `info`, `warning`, `error`, `success`, `question`, `none` | `info` |
| `position`| `auto`, `top`, `bottom`, `left`, `right`    | `auto`   |

### Quando usare SmartTips

- **Onboarding utenti** - spiega i campi di un form che usano per la prima volta
- **Campi complessi** - valori accettati, formati, regole di business
- **Avvisi specifici** - campo obbligatorio, dato sensibile, impatto di un'azione
- **Differenze** tra versione SAP GUI e Fiori

### Regole per buoni SmartTips

1. **Trigger `focus`** per campi input - appare quando l'utente clicca nel campo
2. **Trigger `hover`** per pulsanti e azioni - appare al passaggio del mouse
3. **Trigger `always`** solo per informazioni critiche che non devono essere perse
4. **Icona `warning`** per azioni irreversibili (salva, elimina, invia)
5. **Contenuto conciso** - max 2-3 frasi, vai dritto al punto
6. **Non duplicare** le label del form - aggiungi informazioni *aggiuntive*

---

## 3. Launcher

Pulsante/widget visibile nell'interfaccia che avvia un'azione.

### Specifica

```json
{
  "contentType": "Launcher",
  "name": "Avvia guida ordine",
  "description": "Pulsante per avviare il Walk-Thru di creazione ordine",
  "shape": "button",
  "icon": "play",
  "label": "Guida creazione ordine",
  "position": "bottom-right",
  "action": {
    "type": "startWalkThru",
    "target": "walkthru-id-123"
  }
}
```

### Proprietà

| Campo    | Valori | Note |
|----------|--------|------|
| `shape`  | `button`, `badge`, `hotspot`, `beacon` | `hotspot` e `beacon` richiedono `anchorSelector` |
| `icon`   | `play`, `help`, `info`, `arrow`, `custom` | |
| `position` | `bottom-right`, `bottom-left`, `top-right`, `top-left`, `custom` | Per `button` |
| `action.type` | `startWalkThru`, `openUrl`, `openResource`, `customJs` | |

### Quando usare i Launcher

- **`button`** - pulsante flottante sempre visibile (es. "Hai bisogno di aiuto?")
- **`hotspot`** - punto pulsante ancorato a un elemento specifico (es. su un campo complicato)
- **`beacon`** - animazione lampeggiante su un elemento per attirare l'attenzione
- **`badge`** - contatore/notifica su un elemento

---

## 4. ShoutOut

Banner o popup overlay per comunicazioni.

### Specifica

```json
{
  "contentType": "ShoutOut",
  "name": "Nuova versione Fiori",
  "title": "Novità: Fiori 3.0",
  "content": "<h3>Cosa cambia</h3><p>La nuova interfaccia Fiori include un layout aggiornato...</p>",
  "template": "dialog",
  "position": "center",
  "frequency": "once",
  "buttons": [
    { "label": "Scopri le novità", "action": "startWalkThru", "target": "walkthru-novita", "style": "primary" },
    { "label": "Chiudi", "action": "dismiss", "style": "secondary" }
  ],
  "media": { "type": "image", "url": "/assets/fiori3-preview.png" }
}
```

### Template disponibili

| Template       | Aspetto                                    |
|----------------|---------------------------------------------|
| `dialog`       | Popup centrato con overlay scuro            |
| `banner-top`   | Barra in alto nella pagina                  |
| `banner-bottom`| Barra in basso                              |
| `slide-in`     | Pannello che scorre dal lato                |
| `fullscreen`   | Overlay a schermo intero                    |
| `notification` | Toast/notifica piccola in un angolo         |

### Azioni pulsanti

| Azione          | Cosa fa                                  |
|-----------------|------------------------------------------|
| `dismiss`       | Chiude lo ShoutOut                       |
| `startWalkThru` | Avvia un Walk-Thru (target = ID)         |
| `openUrl`       | Apre un URL (target = URL)               |
| `nextShoutOut`  | Mostra un altro ShoutOut (target = ID)   |

### Quando usare ShoutOut

- **Onboarding** - primo accesso dell'utente alla piattaforma
- **Release notes** - comunicare nuove funzionalità
- **Avvisi** - manutenzione programmata, scadenze
- **Promozioni** - nuovi servizi, training disponibili

### Regole per buoni ShoutOut

1. **`frequency: "once"`** per annunci - non disturbare ripetutamente
2. **`template: "notification"`** per avvisi non critici
3. **`template: "dialog"`** per comunicazioni importanti che richiedono azione
4. **Sempre un pulsante `dismiss`** - non bloccare l'utente
5. **Contenuto HTML supportato** - usa headings, liste, grassetto per strutturare

---

## 5. Survey

Sondaggio in-app per raccogliere feedback.

### Specifica

```json
{
  "contentType": "Survey",
  "name": "Feedback creazione ordine",
  "title": "Com'è andata?",
  "frequency": "once",
  "thankYouMessage": "Grazie! Il tuo feedback ci aiuta a migliorare.",
  "questions": [
    {
      "questionText": "Quanto è stato facile creare l'ordine?",
      "type": "rating",
      "scaleMax": 5,
      "scaleLabels": { "min": "Molto difficile", "max": "Molto facile" }
    },
    {
      "questionText": "Consiglieresti questa piattaforma?",
      "type": "nps",
      "scaleMin": 0,
      "scaleMax": 10
    },
    {
      "questionText": "Quale area vorresti migliorare?",
      "type": "singleChoice",
      "options": ["Navigazione", "Form di inserimento", "Ricerca", "Performance", "Altro"]
    },
    {
      "questionText": "Hai suggerimenti specifici?",
      "type": "freeText",
      "required": false,
      "placeholder": "Scrivi qui i tuoi commenti..."
    }
  ]
}
```

### Tipi di domanda

| Tipo             | Aspetto                                     |
|------------------|----------------------------------------------|
| `rating`         | Stelle (1-5 default)                        |
| `nps`            | Net Promoter Score (scala 0-10)             |
| `singleChoice`   | Radio buttons con opzioni                   |
| `multipleChoice` | Checkbox con opzioni                        |
| `freeText`       | Campo di testo libero                       |
| `yesNo`          | Due pulsanti Si/No                          |
| `scale`          | Slider su scala numerica                    |

### Quando usare Survey

- **Post-completamento** - dopo un Walk-Thru per valutare l'esperienza
- **Periodico** - feedback trimestrale sulla piattaforma
- **A/B testing** - preferenze su layout o funzionalità
- **NPS** - misurare la soddisfazione generale

### Regole per buoni Survey

1. **Max 4-5 domande** - survey lunghi vengono abbandonati
2. **Prima domanda rating/nps** - immediata e motivante
3. **Ultima domanda freeText opzionale** - per chi vuole approfondire
4. **Rendi obbligatorie solo le domande chiave** (`required: true`)
5. **`frequency: "once"`** dopo un Walk-Thru, **`"weekly"`** per feedback ricorrente

---

## 6. Shuttle

Popup multi-pagina per spiegazioni strutturate (come una presentazione).

### Specifica

```json
{
  "contentType": "Shuttle",
  "name": "Guida al nuovo Launchpad",
  "title": "Scopri il nuovo Launchpad Fiori",
  "position": "center",
  "frequency": "once",
  "pages": [
    {
      "title": "Benvenuto nel nuovo Launchpad",
      "content": "<p>Il Launchpad è stato aggiornato con un nuovo layout più intuitivo.</p>",
      "media": { "type": "image", "url": "/assets/launchpad-overview.png" }
    },
    {
      "title": "Nuova navigazione",
      "content": "<p>Usa il menu laterale per navigare tra le applicazioni per modulo SAP.</p>"
    },
    {
      "title": "Personalizzazione",
      "content": "<p>Puoi personalizzare i tile trascinandoli nella posizione preferita.</p>",
      "buttons": [
        { "label": "Prova ora", "action": "startWalkThru", "target": "walkthru-personalizza" }
      ]
    }
  ]
}
```

### Quando usare Shuttle

- **Onboarding strutturato** - presentare una nuova app in 3-5 pagine
- **Changelog** - spiegare cosa è cambiato in un aggiornamento
- **Tutorial concettuale** - spiegare un concetto prima di un Walk-Thru pratico
- **FAQ visive** - risposte con screenshot/video

### Regole per buoni Shuttle

1. **Max 5 pagine** - mantieni l'attenzione
2. **Ogni pagina un concetto** - titolo chiaro + contenuto breve
3. **Media nella prima pagina** - cattura l'attenzione con un'immagine
4. **CTA nell'ultima pagina** - "Prova ora" con link a Walk-Thru
5. **Non usare per processi** - per quelli usa Smart Walk-Thru

---

## 7. Resource Menu

Menu di aiuto centralizzato accessibile da un'icona.

### Specifica

```json
{
  "contentType": "Resource",
  "name": "Help Center SAP",
  "title": "Centro Assistenza",
  "icon": "help",
  "position": "bottom-right",
  "searchEnabled": true,
  "items": [
    {
      "title": "Crea ordine di vendita",
      "description": "Guida passo-passo per VA01",
      "type": "walkthru",
      "target": "walkthru-va01",
      "category": "Ordini"
    },
    {
      "title": "Crea ordine d'acquisto",
      "description": "Guida passo-passo per ME21N",
      "type": "walkthru",
      "target": "walkthru-me21n",
      "category": "Acquisti"
    },
    {
      "title": "Video: Navigazione Fiori",
      "description": "Come navigare nel Launchpad",
      "type": "video",
      "target": "https://example.com/video-navigazione",
      "category": "Getting Started"
    },
    {
      "title": "FAQ",
      "description": "Domande frequenti",
      "type": "link",
      "target": "https://help.example.com/faq",
      "category": "Supporto"
    }
  ]
}
```

### Tipi di risorsa

| Tipo       | Cosa apre                           |
|------------|--------------------------------------|
| `walkthru` | Avvia un Smart Walk-Thru            |
| `article`  | Apre un articolo/pagina             |
| `video`    | Apre un video                       |
| `link`     | Apre un URL esterno                 |
| `shuttle`  | Avvia uno Shuttle                   |
| `survey`   | Avvia un Survey                     |

### Quando usare Resource

- **Help center unificato** - punto unico per tutte le guide
- **Organizzazione** per categoria (modulo SAP, livello utente, ecc.)
- **Ricerca** - l'utente trova la guida di cui ha bisogno
- **Combinare** tutti gli altri contenuti in un unico accesso

---

## Selettori CSS SAP Fiori / UI5

**Non inventare selettori** - usa quelli definiti in `src/templates/sap-fiori.js`:

**Shell e navigazione:**
- `#shell-header` - Header Fiori
- `#backBtn` - Pulsante indietro
- `#homeBtn` - Pulsante home
- `#meAreaHeaderButton` - Menu utente
- `#sf` - Ricerca
- `#NotificationsCountButton` - Notifiche

**Launchpad:**
- `.sapUshellTile[title="Nome App"]` - Tile specifica
- `.sapUshellTileContainer` - Container tile

**Form e input (UI5):**
- `input[id*="fieldId"]` - Input per ID parziale
- `[aria-label="Label"] input` - Input per aria-label
- `.sapUiCompFilterBar` - Smart Filter Bar
- `.sapUiCompSmartTable` - Smart Table

**Pulsanti toolbar:**
- `.sapMBarChild button[id*="Create"]` - Crea
- `.sapMBarChild button[id*="Save"]` - Salva
- `.sapMBarChild button[id*="Edit"]` - Modifica
- `.sapMBarChild button[id*="Delete"]` - Elimina
- `.sapMBarChild button[id*="Submit"]` - Invia
- `.sapMBarChild button[id*="btnGo"]` - Vai

**Dialog:**
- `.sapMDialog` - Dialog modale
- `.sapMDialogFooter .sapMBtnEmphasized` - Conferma dialog
- `.sapMDialogFooter .sapMBtnReject` - Annulla dialog

**Object Page:**
- `.sapUxAPObjectPageLayout` - Layout Object Page
- `.sapUxAPObjectPageSection` - Sezione
- `.sapUxAPAnchorBar` - Anchor bar

**Tabelle:**
- `.sapMList, .sapUiTable` - Tabella
- `.sapMLIB, .sapUiTableRow` - Riga tabella

### Shorthand per elementi Fiori (solo Smart Walk-Thru)

Usa `fioriElement` invece di `selector`:
`shell-header`, `back-button`, `home-button`, `user-menu`, `search`, `notifications`,
`tile-container`, `filter-bar`, `smart-table`, `toolbar`, `create-btn`, `edit-btn`,
`save-btn`, `delete-btn`, `cancel-btn`, `submit-btn`, `go-btn`, `dialog`,
`dialog-confirm`, `dialog-cancel`, `object-page`, `anchor-bar`

## Transazioni SAP supportate

- **SD:** VA01, VA02, VA03, VL01N, VF01, VF02
- **MM:** ME21N, ME22N, ME23N, ME51N, MIGO, MIRO, MM01, MM02
- **FI:** FB01, FB02, FB03, F110, FBL1N, FBL5N
- **CO:** KS01, KP06
- **PP:** CO01, CO02, MD04
- **HCM:** PA20, PA30
- **PM:** IW21, IW31
- **PS:** CJ20N
- **QM:** QA01
- **CA:** BP, NWBC

## Generatore universale

La funzione `generateFromSpec(spec)` in `generator.js` accetta qualsiasi tipo via il campo `contentType`:

```javascript
import { generateFromSpec, prepareFlowOutput } from './generator.js';

const spec = { contentType: 'SmartTips', name: '...', tips: [...] };
const result = generateFromSpec(spec);
const output = prepareFlowOutput(result, 'yaml');
```

Valori validi per `contentType`: `SmartWalkThru`, `SmartTips`, `Launcher`, `ShoutOut`, `Survey`, `Shuttle`, `Resource`

## Analisi PDF con Claude API

Il comando `pdf` invia il documento a Claude con un system prompt specializzato.
Il system prompt è in `src/commands/pdf.js` (costante `SYSTEM_PROMPT`).
La risposta JSON viene parsata e passata a `generateFlowFromSpec()`.

## API WalkMe

Client in `src/utils/walkme-api.js` con OAuth2 (client credentials).
Regioni: `us` (default), `eu`, `fedramp`, `canada`.
Configurazione in `~/.walkme-cli/config.json`.

## Convenzioni codice

- **ESM modules** (`import`/`export`, `"type": "module"`)
- **Nomi file:** kebab-case
- **Lingua codice:** inglese per variabili/funzioni, italiano per output utente
- **Nessun TypeScript** - JavaScript puro
- **Nessun test framework** configurato
- **Dipendenze:** commander, inquirer, js-yaml, @anthropic-ai/sdk, pdf-parse, chalk

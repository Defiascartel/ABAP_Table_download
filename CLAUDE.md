# WalkMe CLI - Istruzioni per Claude

## Panoramica progetto

CLI Node.js (ESM) per generare e gestire flussi **WalkMe Smart Walk-Thru** per SAP Fiori / BTP Work Zone.
Due modalità principali:
1. **Generazione locale** - da specifica JSON/YAML o interattiva (`generate`, `template`, `spec`)
2. **Generazione con Claude AI** - analisi PDF di documentazione SAP (`pdf`)
3. **Gestione remota** - API REST WalkMe con OAuth2 (`list`, `publish`, `goals`, `segments`)

## Struttura progetto

```
walkme-cli/
├── bin/walkme-cli.js          # Entry point CLI (Commander.js)
├── src/
│   ├── commands/              # Comandi CLI
│   │   ├── generate.js        # Generazione interattiva/da file
│   │   ├── pdf.js             # Analisi PDF con Claude API
│   │   ├── content.js         # Gestione contenuti WalkMe (list/publish/analytics)
│   │   ├── goals.js           # CRUD goals WalkMe
│   │   ├── segments.js        # CRUD segmenti WalkMe
│   │   ├── templates.js       # Template per transazioni SAP
│   │   ├── validate.js        # Validazione flussi
│   │   ├── convert.js         # Conversione JSON <-> YAML
│   │   ├── selectors.js       # Catalogo selettori CSS Fiori
│   │   ├── spec.js            # Generatore specifica vuota
│   │   └── config.js          # Gestione configurazione
│   ├── generator.js           # Core: converte specifica -> flusso WalkMe
│   ├── schema/
│   │   └── walkme-flow.js     # Schema e factory per step WalkMe
│   ├── templates/
│   │   └── sap-fiori.js       # Selettori CSS SAP Fiori/UI5 + mappa transazioni
│   └── utils/
│       ├── config.js          # Persistenza config (~/.walkme-cli/config.json)
│       └── walkme-api.js      # Client HTTP API WalkMe (OAuth2)
└── package.json
```

## Come generare un flusso WalkMe

### Formato specifica (input)

Ogni flusso parte da una **specifica** - un oggetto JSON con questa struttura:

```json
{
  "name": "Nome del flusso",
  "description": "Descrizione",
  "transaction": "VA01",
  "fioriApp": "SalesOrder-create",
  "language": "it",
  "tags": ["SD", "VA01", "SAP Fiori"],
  "steps": [
    {
      "type": "popup|click|type|select|waitFor|redirect|splitStep|autoStep",
      "title": "Titolo dello step",
      "content": "Testo che l'utente vede nel balloon",
      "selector": "selettore CSS per l'elemento target",
      "position": "auto|top|bottom|left|right",
      "inputValue": "valore per step type",
      "selectValue": "valore per step select"
    }
  ],
  "goals": [
    { "name": "Goal description", "type": "custom" }
  ]
}
```

### Tipi di step disponibili

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

### Selettori CSS SAP Fiori / UI5

Usa questi selettori standard per gli elementi SAP Fiori. **Non inventare selettori** - usa quelli definiti in `src/templates/sap-fiori.js`:

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

### Shorthand per elementi Fiori

Nello step puoi usare `fioriElement` invece di `selector` con questi shorthand:
`shell-header`, `back-button`, `home-button`, `user-menu`, `search`, `notifications`,
`tile-container`, `filter-bar`, `smart-table`, `toolbar`, `create-btn`, `edit-btn`,
`save-btn`, `delete-btn`, `cancel-btn`, `submit-btn`, `go-btn`, `dialog`,
`dialog-confirm`, `dialog-cancel`, `object-page`, `anchor-bar`

### Transazioni SAP supportate

Le transazioni mappate sono in `SAP_TRANSACTION_MAP` (sap-fiori.js):
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

## Regole per generare buoni flussi

1. **Primo step sempre un popup di benvenuto** ancorato a `#shell-header` con posizione `bottom`
2. **Secondo step: navigazione** - click sulla tile o redirect all'app Fiori
3. **Terzo step: waitFor** - attendi il caricamento della pagina (filter-bar o smart-table)
4. **Step successivi** seguono il processo SAP reale
5. **Ultimo step: popup di conferma** che il processo è completato
6. **Ogni step deve avere un selettore valido** - mai lasciare vuoto
7. **Il contenuto del balloon deve essere in italiano** e guidare l'utente passo-passo
8. **I titoli degli step devono essere brevi** (max 40 caratteri)
9. **Usa splitStep per gestire scenari alternativi** (es. messaggio di errore)
10. **Aggiungi waitFor dopo azioni che causano caricamento** (save, submit, navigazione)

## Struttura flusso generato (output)

Il generatore (`generator.js`) produce questa struttura:

```json
{
  "_meta": {
    "generator": "walkme-cli",
    "version": "1.0.0",
    "createdAt": "ISO date",
    "language": "it"
  },
  "flow": {
    "name": "...",
    "description": "...",
    "type": "SmartWalkThru",
    "sapContext": {
      "transaction": "VA01",
      "fioriApp": "SalesOrder-create",
      "targetUrl": null
    },
    "settings": {
      "autoStart": false,
      "segmentation": null,
      "frequency": "always",
      "balloonTheme": "default",
      "allowRestart": true
    },
    "tags": [],
    "goals": [],
    "steps": []
  }
}
```

## Analisi PDF con Claude API

Il comando `pdf` invia il documento a Claude con un system prompt che richiede:
- Identificazione di ogni step del processo dalle immagini e dal testo
- Determinazione del selettore CSS Fiori target per ogni step
- Generazione della specifica JSON completa

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

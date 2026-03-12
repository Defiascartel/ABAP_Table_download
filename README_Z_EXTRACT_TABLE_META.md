# Z_EXTRACT_TABLE_META — Estrattore Metadati Tabelle SAP per Claude Code

## Scopo
Report ABAP che estrae la struttura completa delle tabelle SAP in formato JSON, CSV o Markdown,
ottimizzato per essere dato in pasto a Claude Code come contesto per sviluppi ABAP.

## Cosa estrae per ogni tabella
- Nome, classe (TRANSP/CLUSTER/POOL/VIEW/INTTAB), delivery class, descrizione
- Per ogni campo:
  - Posizione, nome, flag chiave primaria
  - Data Element e relativa descrizione
  - Dominio e relativa descrizione  
  - Tipo ABAP (CHAR, NUMC, DEC, DATS...), lunghezza, decimali, tipo interno
  - Not null flag
  - Check table (foreign key)
  - Conversion exit
  - Valori fissi del dominio con descrizioni

## Setup in SAP

### 1. Creare il report
- SE38 → Crea programma `Z_EXTRACT_TABLE_META`
- Incolla il codice dal file `.abap`

### 2. Text Elements da creare (SE38 → Goto → Text Elements → Selection Texts)

| ID    | Testo                              |
|-------|-------------------------------------|
| B01   | Selezione Tabelle                  |
| B02   | Formato Output                     |
| B03   | Destinazione Output                |
| S_TABNM | Nome tabella                     |
| P_MAXFLD | Max campi (0=tutti)             |
| P_DOMVAL | Includi valori fissi dominio    |
| P_CHKTAB | Includi check tables            |
| P_DESC   | Includi descrizioni             |
| P_JSON   | JSON                             |
| P_CSV    | CSV (semicolon-separated)        |
| P_MD     | Markdown                          |
| P_GUI    | Visualizza a schermo             |
| P_DOWN   | Download su PC                   |
| P_CLIP   | Copia negli appunti              |
| P_SRVR   | Salva su application server      |
| P_FPATH  | Percorso file su app server      |

## Uso tipico per Claude Code

### Caso 1: Estrai poche tabelle specifiche
```
S_TABNM = VBAK, VBAP, VBEP, LIKP, LIPS
Formato: JSON
Output: Download su PC
```
Poi dai il JSON a Claude Code nel prompt:
```
Ecco la struttura delle tabelle coinvolte:
<table_metadata>
{contenuto del JSON}
</table_metadata>

Scrivi un report ABAP che...
```

### Caso 2: Estrai un intero dominio funzionale
```
S_TABNM = VBAK* to VBUK*   (ordini di vendita SD)
Formato: JSON
Output: Salva su application server → /tmp/sd_tables.json
```

### Caso 3: Quick reference in Markdown
```
S_TABNM = BKPF, BSEG
Formato: Markdown
Output: Copia negli appunti
```

## Formato JSON di output (esempio)
```json
{
  "_metadata": {
    "generated_at": "20260311-143025",
    "sap_system": "PRD",
    "client": "100",
    "language": "I",
    "total_tables": 1
  },
  "tables": [
    {
      "table_name": "VBAK",
      "description": "Testata documento di vendita",
      "table_class": "TRANSP",
      "table_class_text": "Transparent Table",
      "delivery_class": "A",
      "total_fields": 186,
      "total_keys": 2,
      "fields": [
        {
          "position": 1,
          "field_name": "MANDT",
          "is_key": true,
          "data_element": "MANDT",
          "domain": "MANDT",
          "abap_type": "CLNT",
          "length": 3,
          "decimals": 0,
          "internal_type": "C",
          "not_null": true,
          "field_description": "Mandante",
          "check_table": "T000",
          "domain_fixed_values": []
        }
      ]
    }
  ]
}
```

## Note
- Il programma usa solo FM standard SAP, nessuna dipendenza custom
- Compatibile con SAP_BASIS >= 740 (usa string templates e inline declarations)
- Per sistemi più vecchi, sostituire le inline declarations con dichiarazioni esplicite
- La serializzazione JSON è fatta manualmente (senza /UI2/CL_JSON) per massima compatibilità
- Se preferisci usare /UI2/CL_JSON o XCO_CP_JSON (S/4HANA), puoi sostituire la FORM format_json

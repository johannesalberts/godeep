<p align="center">
  <img src="css/godeep_logo.png" alt="GoDeep" width="320">
</p>

# GoDeep

GoDeep ist eine minimalistische Fokus-App für Deep-Work-Sessions, insbesondere beim wissenschaftlichen Arbeiten.

## Features

- Pomodoro-Timer mit Fokus-/Pause-/Lange-Pause-Phasen
- Arbeitsmodi mit eigenen Standarddauern (Schreiben, Recherche, Überarbeitung)
- Session-Wizard mit Ziel, Quellen, Modus und Dauer
- Session-Review mit Hinweis auf den letzten Anknuepfungspunkt
- Session-Historie mit Detailansicht, Export und Loeschen pro Session
- Statistik-Modal (Heute + Wochenansicht)
- Light-/Dark-Mode Toggle
- Timer-Sound-Auswahl (Standard / Easy)
- Lokale Persistenz via `localStorage` (keine Server-Abhaengigkeit)

## Projektstruktur

```text
GoDeep/
  index.html
  css/
    variables.css
    style.css
    godeep_logo.png
    godeep_logo.svg
    godeep_logo_dark.svg
    favicon.svg
  js/
    app.js
    storage.js
    timer.js
    workspace.js
    session-wizard.js
    history.js
    settings.js
    theme.js
    ...
  assets/
    timer-standard.mp3
    timer-easy.mp3
```

## Installation / Start

### Option A: Direkt im Browser

1. Repository klonen oder Ordner lokal bereitstellen.
2. `index.html` in einem modernen Browser öffnen.

### Option B: Lokaler Webserver (empfohlen)

1. Projekt in dein Webroot legen (z. B. XAMPP `htdocs`).
2. Im Browser aufrufen, z. B.:
   - `http://localhost/GoDeep/`

## Nutzung (Kurz)

1. Modus und Fokusdauer wählen (oder **Neue Session** starten).
2. Timer starten.
3. Nach Ablauf optional Review erfassen.
4. Historie fuer vergangene Sessions, Export und Loeschen nutzen.

## Daten & Persistenz

- Alle Daten werden im Browser in `localStorage` gespeichert.
- Einstellungen, Workspace-Inhalte, Timer-Zustand und Historie bleiben zwischen Browser-Neustarts erhalten.
- Beim Loeschen von Website-Daten im Browser werden gespeicherte Inhalte entfernt.

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz.  
Siehe Datei [`LICENSE`](./LICENSE).


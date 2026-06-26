# RRSB Snooker Scoreboard – Gebrauchsanleitung

**Version 0.0.33** · Stand: Juni 2026

---

## Inhaltsverzeichnis

1. [Überblick](#1-überblick)
2. [Erststart und Einstellungen](#2-erststart-und-einstellungen)
3. [Neues Spiel einrichten (Setup)](#3-neues-spiel-einrichten-setup)
4. [Hauptanzeige (Scoreboard)](#4-hauptanzeige-scoreboard)
5. [Punkte eintragen – Modus "Ganzes Break"](#5-punkte-eintragen--modus-ganzes-break)
6. [Punkte eintragen – Modus "Ball für Ball"](#6-punkte-eintragen--modus-ball-für-ball)
7. [Hauptmenü](#7-hauptmenü)
8. [Frame beenden](#8-frame-beenden)
9. [Match beenden](#9-match-beenden)
10. [Undo und Redo](#10-undo-und-redo)
11. [Remote-Scorer (Handy als Eingabe)](#11-remote-scorer-handy-als-eingabe)
12. [Breaks-Übersicht](#12-breaks-übersicht)
13. [Match-Statistik](#13-match-statistik)
14. [Solo-Training](#14-solo-training)
15. [Sondersituationen im Spiel](#15-sondersituationen-im-spiel)
16. [Spielerfarben](#16-spielerfarben)
17. [Datenspeicherung und Persistenz](#17-datenspeicherung-und-persistenz)
18. [Häufige Fragen / Fehlersituationen](#18-häufige-fragen--fehlersituationen)

---

## 1. Überblick

Das RRSB Scoreboard ist eine vollständige Snooker-Anzeigetafel für den Einsatz im Club. Es läuft im Browser (Vollbild empfohlen) und bietet:

- **Automatische Punkteführung** für Ligaspiele, Turniere und Trainingspartien
- **Zwei Eingabemodi**: Ganzes Break (einfache Zahleneingabe) oder Ball für Ball (detaillierte Ballverfolgung)
- **Handy-Remote**: Ein zweites Gerät (Spieler oder Scorer) tippt die Punkte per Smartphone ein
- **Solo-Training**: Eigene Übungsroutinen mit Statistik
- **Statistiken**: Breaks, Fouls, Frame-Dauer, Spielervergleich

---

## 2. Erststart und Einstellungen

### 2.1 Tischnummer und Clubname

Beim allerersten Start ist die Tischnummer noch nicht gesetzt. Um sie zu konfigurieren:

1. Auf dem Setup-Dialog (der beim Start erscheint) die Beschriftung **"Spieler 2"** **8-mal klicken**.  
   → Ein Passwort-Dialog erscheint.
2. Passwort eingeben (Standard: **1234**).
3. Im Einstellungs-Dialog:
   - **Tischnummer** eintragen (Zahl).
   - **Name des Clubs / Ortes** eintragen. Es werden bis zu 20 zuletzt verwendete Namen als Vorschläge gespeichert.
4. Auf **Speichern** klicken.

Die Einstellungen bleiben dauerhaft im Browser gespeichert.

---

## 3. Neues Spiel einrichten (Setup)

Der Setup-Dialog erscheint automatisch beim Start oder nach "Neues Spiel" im Menü.

### 3.1 Spieler auswählen

- Links: **Spieler 1** (wird links auf dem Scoreboard angezeigt)
- Rechts: **Spieler 2** (rechts)

Klick auf ein Spielerfeld öffnet den **Spieler-Picker**:
- Alphabetischer Index (A–Z) zum schnellen Navigieren
- Spielerliste mit Name, Nationalität und Club
- Klick auf einen Namen wählt den Spieler aus

Für Spieler 2 gibt es zusätzlich die Option **"SOLO TRAINING"** → damit wechselt die App in den Trainings-Modus (siehe Kapitel 14).

### 3.2 Spieltyp wählen

Dropdown mit folgenden Optionen:
| Spieltyp | Standard Best-of |
|---|---|
| Trainings-Spiel | 5 |
| Liga A-Match | 6 |
| Liga B/C-Match | 4 |
| Open-Turnier | — |
| QT | 3 |
| Swiss Snooker Cup | 3 |
| Wochenturnier | 1 |
| 6-Reds | 3 |
| Sonstiges Turnier | — |

Der Standard-Best-of wird automatisch gesetzt, kann aber manuell geändert werden.

### 3.3 Eingabemodus wählen

**Schalter: "Ganzes Break" / "Ball für Ball"**

- **Ganzes Break**: Der Scorer gibt am Ende eines Breaks die Gesamtpunktzahl über einen Taschenrechner ein. Einfach und schnell.
- **Ball für Ball**: Jeder einzelne Ball wird eingetragen (Rot, Farbe, Foul usw.). Liefert detailliertere Statistiken.

### 3.4 Best-of einstellen

- **± Buttons**: Jeweils um 1 erhöhen oder senken (Minimum: 1, Maximum: 99)
- **Direkte Eingabe**: Auf die Zahl klicken → Numpad erscheint

Hinweis:
- **Ungerade** Best-of (z. B. 5): Erster Spieler mit Mehrheit der Frames gewinnt. Das Match endet automatisch.
- **Gerade** Best-of (z. B. 6): Alle Frames werden ausgespielt.

### 3.5 Rote Bälle (nur Ball-für-Ball)

Auswahl: **1 · 3 · 6 · 10 · 15** rote Bälle zu Beginn des Spiels.

- 6-Reds, Swiss Snooker Cup und Wochenturnier: Standard automatisch **6 Rote**
- Sonst: Standard **15 Rote**

### 3.6 Automatische Zuweisung

Falls vom zentralen System eine Zuweisung aussteht (Spieler und Best-of wurden vorkonfiguriert), erscheint oben ein **Zuweisungs-Banner** mit den Spielernamen. Klick auf dieses Banner startet das Spiel sofort mit den vorgeschlagenen Werten.

### 3.7 Spiel starten

Klick auf **"Spiel starten"** (oder entsprechenden Button) → der Setup-Dialog schließt sich, die Hauptanzeige erscheint.

---

## 4. Hauptanzeige (Scoreboard)

### 4.1 Aufbau

```
┌─────────────────────────────────────────────────────┐
│              SPIELTYP-BANNER (oben)                 │
├──────────────────┬──────────────┬───────────────────┤
│  SPIELER 1       │    MITTE     │       SPIELER 2   │
│  Name + Club     │  Tischnr.   │  Name + Club      │
│  Frames          │  Clubname   │  Frames           │
│  Score           │  Spielzeit  │  Score            │
│  Top-Breaks      │  Frames     │  Top-Breaks       │
├──────────────────┴──────────────┴───────────────────┤
│              VERLAUF-LEISTE (unten)                 │
└─────────────────────────────────────────────────────┘
```

### 4.2 Spielerbereich (links / rechts)

Jede Seite zeigt (von oben nach unten):
1. **Spielername + Club** (großer Text, farbig hinterlegt)
   - Klick auf den Namen → Punkte eintragen (Break-Rechner oder Ball-für-Ball-Dialog)
2. **Frames gewonnen** (mittelgroß)
3. **Aktuelle Punktzahl** im laufenden Frame (sehr groß, animiert bei Änderung)
4. **Top-Breaks** (>7 Punkte) des aktuellen Matchs als Liste
   - Klick auf einen Break-Wert → öffnet die Breaks-Übersicht (Kapitel 12)
5. **QR-Code-Button** (kleines Symbol) → Remote-Scorer für diesen Spieler (Kapitel 11)

Der **aktive Spieler** (am Tisch) hat einen pulsierenden gelben Punkt neben seinem Namen.

### 4.3 Mittelbereich

- **Tischnummer** (oben)
- **Clubname** (darunter)
- **Spielzeit** (MM:SS animiert, läuft während des Matchs)
- **Frames-Anzeige** (z. B. "2 – 1")
- **Gewinner-Anzeige**: Bei beendetem Match erscheint ein Pokal-Symbol und der Name des Gewinners

### 4.4 Spieltyp-Banner (oben)

Zeigt den gewählten Spieltyp (z. B. "Liga A-Match") über die gesamte Breite.

### 4.5 Verlauf-Leiste (unten)

Scrollbarer Protokollstreifen mit dem gesamten Spielverlauf:
- Breaks mit Punktzahl (wichtige Breaks farblich hervorgehoben)
- Fouls
- Handicap-Punkte
- Re-Racks
- Frame-Trennlinien

### 4.6 Menü-Button

Kleines Symbol (oben oder seitlich) → öffnet das Hauptmenü (Kapitel 7).

### 4.7 Match-Statistik aufrufen

Klick in den **Mittelbereich** (wenn bereits Spielverlauf vorhanden) → öffnet die Match-Statistik (Kapitel 13).

---

## 5. Punkte eintragen – Modus "Ganzes Break"

### 5.1 Break eintragen

1. Klick auf den **Spielernamen** des Spielers, der gerade gespielt hat.
2. Der **Taschenrechner-Dialog** öffnet sich.
3. Punktzahl mit dem Numpad eingeben (max. 155).
4. **OK** klicken → Punkte werden gutgeschrieben, Dialog schließt sich.

### 5.2 Foul eintragen

1. Klick auf den Spielernamen des Spielers, der gefoulet hat.
2. Im Taschenrechner-Dialog den **"Foul"-Schalter** aktivieren.
3. Foul-Punkte eingeben (4–7 je nach Ball).
4. **OK** klicken → Punkte gehen an den **Gegner**.

### 5.3 Handicap eintragen

Falls das Spiel Handicap-Regelungen hat:
1. Klick auf den begünstigten Spielernamen.
2. **"Handicap"-Schalter** aktivieren.
3. Punkte eingeben.
4. **OK** klicken.

### 5.4 Taschenrechner-Dialog – Übersicht

| Element | Funktion |
|---|---|
| Zifferntasten 0–9 | Punktzahl eingeben |
| Anzeige-Feld | Zeigt aktuell eingegebene Zahl |
| C (Clear) | Eingabe löschen |
| Foul-Schalter | Punkte gehen an Gegner |
| Handicap-Schalter | Handicap-Modus |
| OK | Bestätigen und schließen |
| X / Schließen | Abbrechen ohne Eintrag |

---

## 6. Punkte eintragen – Modus "Ball für Ball"

### 6.1 Dialog öffnen

Klick auf den **Spielernamen** des aktiven Spielers → **Ball-für-Ball-Dialog** öffnet sich.

### 6.2 Aufbau des Dialogs

```
┌─────────────────────────────────────────────┐
│  Frame X  |  Gegner: [Name]  |  Scores      │
│  Phase: "Rot wählen" / "Farbe wählen" ...   │
│  Rote übrig: [Zahl]  |  Freeball: [Ja/Nein] │
├─────────────────────────────────────────────┤
│  Break gesamt: [Punkte]                     │
│  Break-Bälle: R Y G Br Bl P Bk ...          │
├─────────────────────────────────────────────┤
│  [ROT] [GELB] [GRÜN] [BRAUN] [BLAU]        │
│  [PINK] [SCHWARZ] [FREE BALL]              │
├─────────────────────────────────────────────┤
│  [FOUL] [MISS] [UNDO] [REDO]               │
└─────────────────────────────────────────────┘
```

### 6.3 Normaler Spielablauf

**Phase "Rot wählen":**
- Klick auf **ROT** → 1 Punkt, Phase wechselt zu "Farbe wählen"

**Phase "Farbe wählen":**
- Klick auf eine Farbe (GELB=2, GRÜN=3, BRAUN=4, BLAU=5, PINK=6, SCHWARZ=7)
- Phase wechselt zurück zu "Rot wählen" (wenn noch Rote übrig)
- Wenn keine Roten mehr: Phase wechselt zu "Farben der Reihe nach"

**Phase "Farben der Reihe nach":**
- GELB → GRÜN → BRAUN → BLAU → PINK → SCHWARZ
- Die App zeigt immer die nächste fällige Farbe als aktiv an

### 6.4 Free Ball

Wenn der Schiedsrichter einen Free Ball zugesprochen hat:
1. **FREE BALL** Button klicken.
2. Danach den Ball wählen, der als Free Ball gespielt wurde.
3. Die App zählt den Free Ball korrekt (1 Punkt wenn als Rot gespielt, Farbwert wenn als Farbe).

### 6.5 Miss eintragen

Klick auf **MISS** → Break endet, der Gegner ist am Zug.

Sonderfall: Wenn nur noch der Schwarze übrig ist und der Punktabstand > 7 beträgt, beendet ein Miss automatisch den Frame (der führende Spieler gewinnt).

### 6.6 Foul eintragen

1. Klick auf **FOUL**.
2. Wähle den Ball, der gefoulet wurde (z. B. falscher Ball getroffen).
3. App berechnet Foul-Punkte (mind. 4, sonst Wert des betroffenen Balls).
4. Punkte gehen an den Gegner, der Gegner ist am Zug.

### 6.7 Respotted Black (Wiedereinsetzter Schwarzer)

Wenn der Schwarze gefoulet wird und die Punktzahl exakt gleich ist:
- App setzt automatisch den Schwarzen zurück auf den Spot
- Banner "⚫ RE-SPOTTED BLACK" erscheint
- Break wird zurückgesetzt
- Nächster Spieler bricht auf (darf den Schwarzen nicht direkt spielen)
- Dieser Vorgang passiert **einmal pro Frame**

### 6.8 Rote korrigieren

Falls die Anzahl der roten Bälle falsch ist (z. B. Ball übersehen):
1. Klick auf die **"Rote übrig"-Anzeige** im Dialog.
2. Stepper erscheint → korrekte Anzahl einstellen (1–15).
3. Bestätigen → Korrektur wird protokolliert.

### 6.9 Letztes Break bearbeiten

Falls ein Fehler beim Ball-Eintragen passiert ist:
1. Klick auf **"Letztes Break bearbeiten"** (Edit-Symbol).
2. Die einzelnen Bälle des letzten Breaks werden angezeigt.
3. Letzten Ball entfernen: X-Symbol neben dem Ball.
4. Ganzes Break löschen: "Break löschen" (Bestätigung erforderlich).
5. Bearbeitung abschließen oder abbrechen.

### 6.10 Undo / Redo im Ball-für-Ball-Dialog

- **UNDO**: Letzten einzelnen Ball rückgängig machen
- **REDO**: Rückgängig gemachten Ball wiederherstellen

### 6.11 Handicap im Ball-für-Ball-Modus

**HANDICAP**-Button (falls sichtbar):
1. Wähle den Spieler, der Handicap-Punkte erhält.
2. Stepper zum Einstellen der Punkte.
3. Bestätigen.

---

## 7. Hauptmenü

Das Hauptmenü wird über den Menü-Button auf der Hauptanzeige geöffnet.

| Menüpunkt | Wann verfügbar | Funktion |
|---|---|---|
| **Neues Spiel** | Immer | Startet Setup von vorne. Wenn bereits Einträge vorhanden: Bestätigung erforderlich. |
| **Re-rack** | Immer | Setzt alle Bälle zurück (Neuer Break-Start im Frame), Punkte bleiben. Bestätigung. |
| **Frame-Ende** | Wenn Frame nicht unentschieden + nicht am Frame-Anfang | Beendet aktuellen Frame manuell (Kapitel 8). |
| **Match-Ende** | Nach dem 1. Frame, am Frame-Anfang | Beendet Match vorzeitig (Kapitel 9). Bestätigung. |
| **Undo** | Wenn Einträge vorhanden | Macht letzte Aktion rückgängig (Kapitel 10). |
| **Redo** | Wenn Undo-Stapel vorhanden | Stellt letzte rückgängig gemachte Aktion wieder her. |
| **Best-of ändern** | Am Frame-Anfang oder bei beendetem Match | Ändert die Best-of-Zahl nachträglich (z. B. um ein beendetes Match wieder zu öffnen). |

---

## 8. Frame beenden

### 8.1 Manuell (über Menü)

1. Menü öffnen → **"Frame-Ende"** wählen.
2. Der Frame-Gewinner wird angezeigt (wer mehr Punkte hat).
3. Bestätigen.
4. Frame-Zähler wird aktualisiert, neuer Frame beginnt.

### 8.2 Automatisch (Ball-für-Ball)

Im Ball-für-Ball-Modus endet ein Frame automatisch, wenn:
- Nur noch der Schwarze übrig ist **und** der Punktabstand > 7 ist **und** ein Miss eingetragen wird.

### 8.3 Frame-Stand-Anzeige

Nach jedem Frame-Ende wird kurz der Gewinner angezeigt. Der Frame-Zähler in der Mitte der Hauptanzeige aktualisiert sich.

---

## 9. Match beenden

### 9.1 Automatisch

Bei ungeradem Best-of endet das Match automatisch, wenn ein Spieler die nötige Anzahl Frames gewonnen hat.

### 9.2 Manuell (vorzeitig)

1. Menü öffnen → **"Match-Ende"**.
2. Bestätigung → Match wird als beendet markiert.
3. Pokal-Symbol erscheint auf der Hauptanzeige beim Gewinner.

### 9.3 Beendetes Match

- Klick auf einen Spielernamen zeigt einen Hinweis: "Menü → Neues Spiel oder Best-of anpassen".
- Alle Statistiken sind noch aufrufbar (Klick Mittelbereich → Match-Statistik).

### 9.4 Best-of nachträglich ändern

Um ein beendetes Match wieder zu öffnen (z. B. Fehler beim Best-of):
1. Menü → **"Best-of ändern"**.
2. Neuen Best-of-Wert einstellen.
3. Bestätigen → Match-Status aktualisiert sich.

---

## 10. Undo und Redo

### 10.1 Undo

**Wo verfügbar:**
- Hauptmenü → "Undo"
- Ball-für-Ball-Dialog → UNDO-Button (macht einzelnen Ball rückgängig)

**Verhalten:**
- Macht die **letzte Aktionsgruppe** rückgängig (z. B. ein ganzes Break, ein Foul, ein Frame-Ende)
- Der rückgängig gemachte Schritt landet auf dem Redo-Stapel
- Undo-/Redo-Stände überleben ein **Neuladen der Seite** (im Session-Speicher)

### 10.2 Redo

- Stellt den zuletzt rückgängig gemachten Schritt wieder her
- Nach einer neuen Aktion wird der Redo-Stapel geleert

---

## 11. Remote-Scorer (Handy als Eingabe)

### 11.1 Verbinden

1. Auf dem Scoreboard beim Spielernamen den **QR-Code-Button** klicken.
2. Ein QR-Code erscheint.
3. Mit dem Smartphone die Kamera auf den QR-Code richten (oder Link öffnen).
4. Die Remote-Eingabe-Seite öffnet sich im Browser des Handys.
5. Verbindungsanzeige: grüner Punkt = verbunden ("live"), orange = verbinde ("connecting"), rot = getrennt ("reconnecting").

### 11.2 Remote-Anzeige auf dem Handy

**Kopfbereich:**
- Verbindungsstatus (live / connecting / reconnecting / kicked / invalid)
- Spieltyp und Frame-Nummer

**Spieler-Karten:**
- Beide Spielernamen mit aktuellen Punkten und Frames
- Klick auf eine Karte: wechselt den aktiven Spieler (falls Match nicht beendet)
- Flash-Animation bei Klick

**Eingabe-Bereich (abhängig vom Modus):**

**Modus "Ganzes Break" (Break-Pad):**
- Anzeige: aktiver Spieler, aktueller Modus (Break/Foul/Handicap)
- Zifferntasten 0–9
- C (Clear), OK
- Foul-Schalter, Handicap-Schalter

**Modus "Ball für Ball" (Ball-für-Ball-Pad):**
- Alle Ball-Buttons (Rot, Farben, Free Ball)
- Foul-Picker (Modal)
- Rote-Editor (Stepper)
- Miss-Button
- Undo/Redo-Buttons

**Fußzeile:**
- Anzeige, welchen Spieler dieses Handy steuert
- **Trennen-Button** (mit Bestätigung)

### 11.3 Zwei Handys gleichzeitig

- Für jeden Spieler kann ein eigenes Handy verbunden werden (je eigener QR-Code).
- Beide Handys steuern das gleiche Spiel; die App synchronisiert automatisch.

---

## 12. Breaks-Übersicht

### 12.1 Aufrufen

Klick auf einen der angezeigten **Break-Werte** (>7) unter der Punktzahl eines Spielers.

### 12.2 Inhalt

- Liste der Top-Breaks des Spielers im aktuellen Match (absteigend sortiert)
- Pro Break: Rang, Punktzahl, Frame-Nummer

### 12.3 Break markieren / ignorieren

Falls ein Break falsch eingetragen wurde und nicht in die Statistik soll:
1. Klick auf den Break-Eintrag → **Markierungs-Symbol**.
2. Der Break wird mit Durchstreichung und rotem X angezeigt.
3. Er zählt nicht mehr in der offiziellen Statistik.
4. Erneuter Klick hebt die Markierung auf.

---

## 13. Match-Statistik

### 13.1 Aufrufen

Klick in den **Mittelbereich** der Hauptanzeige (wenn Spielverlauf vorhanden).

### 13.2 Frame-Karten

Für jeden gespielten Frame:
| Information | Beschreibung |
|---|---|
| Frame-Nummer | Frame 1, 2, 3 ... |
| Endstand | Punkte beider Spieler |
| Breaks >7 | Liste der Breaks je Spieler |
| Fouls | Anzahl und Gesamtpunkte |
| Handicap | Vergabene Handicap-Punkte |
| Re-Racks | Anzahl der Re-Racks |
| Korrekturen | Anzahl der Rot-Korrekturen |
| Frame-Dauer | HH:MM:SS |

### 13.3 Match-Gesamtstatistik

Unten in der Statistik-Ansicht:
| Information | Beschreibung |
|---|---|
| Anzahl Frames | Gespielte Frames |
| Breaks >7 | Anzahl je Spieler |
| Durchschnitts-Break | Je Spieler |
| Highest Break | Je Spieler |
| Fouls gesamt | Anzahl und Punkte je Spieler |
| Match-Dauer | Gesamtspielzeit |
| Gewinner | Hervorgehoben |

Die Spieler-Nationalitäten werden als Länderflaggen angezeigt.

---

## 14. Solo-Training

### 14.1 Training starten

Im Setup-Dialog bei "Spieler 2" die Option **"SOLO TRAINING"** wählen → Spieler 1 wählen → Spiel starten.

### 14.2 Routine auswählen (Routine-Picker)

Es erscheint eine Auswahl von Übungsroutinen in drei Kategorien:

**Break-Routinen** (Break-Aufbau üben):
| Routine | Beschreibung |
|---|---|
| Line-Up | 15 Rote aufgereiht |
| T-Line | T-förmige Anordnung |
| Offener Tisch | Normales Spiel, 15 Rote |
| 15/21-Ball | 15 oder 21 Bälle |
| Farben endlos | Nur Farben, immer wieder |
| Zig-Zak | 5, 10 oder 15 Rote in Zig-Zag |

**Serien-Routinen** (Spot-Shots):
| Routine |
|---|
| Gelb vom Spot |
| Grün vom Spot |
| Braun vom Spot |
| Blau vom Spot |
| Pink vom Spot |
| Schwarz vom Spot |

**Hit/Miss-Routinen** (Treffer zählen):
- Verschiedene Übungen, bei denen nur Treffer und Fehlversuche gezählt werden

Pro Routine:
- Farbige Hervorhebung
- Kurzbeschreibung + ausführliche Erklärung
- Auswahl der Roten (wenn anwendbar)
- Auswahl der Ballanzahl (z. B. 15/21-Ball)

### 14.3 Break-Routinen: Eingabe

Die Eingabe-Seite (**Multi-Entry-Dialog**) zeigt:
- Routine-Name, Spielername, Anzahl Rote
- Liste der eingetragenen Versuche (scrollbar)

**Eintragen:**
- **"Missed"** → Fehlversuch (kein Break)
- **"Break eintragen"** → Break-Punkte eingeben (Kapitel 14.4)

**Session-Statistik (laufend):**
- Versuche gesamt
- Breaks gelandet
- Misses
- Bestes Break
- Durchschnitt

**Aktionen:**
| Button | Funktion |
|---|---|
| Commit | Speichert alle Einträge, Routine endet |
| Save & New Session | Speichert und startet neue leere Session |
| New Session | Startet neue Session ohne Speichern |

### 14.4 Break eintragen (Break-Eingabe-Dialog)

1. Punktzahl eingeben (max. = Rote × 8 + 27).
2. Falls ungültig: Fehlermeldung mit Maximalwert.
3. **Optionale Break-Details**:
   - Miss-Typ: Lang, Einfach, Schwierig, Position, Foul
   - Foul-Typ: Ball vom Tisch, Queue-Foul, Falscher Ball, Kein Ball, Kleidung, Weiße eingelocht
   - Eingelochter Ball: Rot, Gelb, Grün, Braun, Blau, Pink, Schwarz
   - Tasche: Ecke/Mitte, Gelb-/Grün-Seite, Schwarz-Spot-Varianten
4. OK → Eintrag zur Liste hinzugefügt.

### 14.5 Hit/Miss-Routinen: Eingabe

Bei Hit/Miss-Routinen erscheint eine vereinfachte Ansicht (**Solo-Session**):
- Großer grüner Button: **TREFFER**
- Großer roter Button: **FEHLER**
- Trefferquote, aktueller und bester Streak werden live angezeigt
- UNDO-Button für letzten Eintrag
- Scrollbarer Verlauf (grün/rot)

### 14.6 Trainings-Menü

Menü-Button während des Trainings öffnet:

| Option | Funktion |
|---|---|
| Undo | Letzten Eintrag rückgängig |
| Session zurücksetzen | Alle Einträge löschen, gleiche Routine neu (Bestätigung) |
| Routine wechseln | Zurück zur Routine-Auswahl |
| Training beenden | Zurück zum Start (Bestätigung, zeigt Session-Zusammenfassung) |

---

## 15. Sondersituationen im Spiel

### 15.1 Re-Rack

Wird gebraucht, wenn alle Bälle neu aufgebaut werden müssen (z. B. Snooker nicht möglich mit verfügbaren Bällen).

1. Menü → **"Re-rack"**.
2. Bestätigung → Punkte des aktuellen Frames bleiben erhalten, Bälle werden neu aufgebaut (Eintrag im Verlauf).

### 15.2 Respotted Black (Wiedereinsetzter Schwarzer)

Wird ausgelöst wenn: Foul auf den Schwarzen + beide Spieler punktgleich.
- Geschieht automatisch im Ball-für-Ball-Modus.
- Banner erscheint: "⚫ RE-SPOTTED BLACK"
- Foul-Punkte (7) gehen an den Gegner
- Schwarzer wird auf Spot gesetzt
- Passiert nur **einmal pro Frame**

### 15.3 Beendetes Match – Spielernamen-Klick

Wenn das Match beendet ist und man auf einen Spielernamen klickt:
- Es erscheint ein Hinweis-Overlay
- Empfehlung: Menü öffnen → Neues Spiel oder Best-of ändern

### 15.4 Seite neu laden

- **Match-Verlauf, Undo/Redo-Stapel und Remote-Verbindung überleben ein Neuladen** der Seite.
- Einstellungen (Tischnummer, Clubname) bleiben dauerhaft erhalten.

---

## 16. Spielerfarben

Jeder Spieler hat eine zugewiesene Farbe, die die gesamte linke bzw. rechte Seite des Scoreboards einfärbt.

**Farbpalette (8 Farben, je hell und dunkel verfügbar):**
- Blau, Orange, Grün, Rot, Lila, Türkis, Rosa, Gelb

**Farbe ändern:**
1. Am Frame-Anfang erscheint beim Spielernamen ein **Farb-Auswahl-Button**.
2. Klick → Farbpalette erscheint.
3. Neue Farbe wählen.

**Automatische Regeln:**
- Beide Spieler bekommen nie die gleiche Farbe.
- Die App passt die Helligkeit an, um guten Kontrast zu gewährleisten.
- Die Mittelbereich-Farbe wird automatisch so gewählt, dass sie sich von beiden Spielerfarben unterscheidet.

---

## 17. Datenspeicherung und Persistenz

### 17.1 Session-Speicher (bleibt bis Browser-Tab geschlossen)

| Inhalt | Beschreibung |
|---|---|
| matchState | Aktueller Spielstand |
| matchHistory | Gesamter Spielverlauf |
| matchRedoStack | Redo-Stapel |
| soloSession | Laufende Trainingssession |
| multiDailyAttempts | Break-Einträge der aktuellen Multi-Session |
| remoteRoom | Remote-Scorer-Verbindungsidentität |

### 17.2 Lokaler Speicher (dauerhaft, auch nach Neustart)

| Inhalt | Beschreibung |
|---|---|
| deviceId | Eindeutige Geräte-ID |
| tableNumber | Tischnummer |
| scoreboardLocationName | Clubname |
| lastBestOf | Zuletzt verwendetes Best-of |
| lastInputMode | Zuletzt verwendeter Eingabemodus |
| lastMatchType | Zuletzt gewählter Spieltyp |
| centerName | Aktueller Clubname |
| centerNames | Verlauf der Clubnamen (Autocomplete, max. 20) |
| namesList_[id] | Gecachte Spielerlisten |

### 17.3 Server (API)

Alle Spielereignisse werden zusätzlich an den Server gesendet:
- Match erstellen, Ereignisse protokollieren, Status aktualisieren
- Trainingssessions speichern
- Tischnummer synchronisieren

---

## 18. Häufige Fragen / Fehlersituationen

**F: Ich habe versehentlich zu viele Punkte eingetragen.**
→ Menü öffnen → **Undo** wählen. Die letzte Aktion (Break, Foul etc.) wird rückgängig gemacht.

**F: Ich habe den falschen Spieler angeklickt und Punkte beim Falschen eingetragen.**
→ Sofort Menü → **Undo**. Dann beim richtigen Spieler neu eintragen.

**F: Das Spiel ist fertig, aber ich möchte noch einen Frame spielen.**
→ Menü → **"Best-of ändern"** → Zahl erhöhen → Match ist wieder offen.

**F: Der Remote-Scorer auf dem Handy zeigt "kicked" oder "invalid".**
→ QR-Code neu anzeigen (auf dem Scoreboard) und erneut scannen.

**F: Die Seite wurde versehentlich neu geladen – ist das Spiel weg?**
→ Nein. Der gesamte Spielverlauf inklusive Undo-Stapel bleibt erhalten.

**F: Die Tischnummer ist falsch.**
→ Auf dem Setup-Dialog "Spieler 2"-Beschriftung 8× klicken → Passwort → Einstellungen → Tischnummer korrigieren.

**F: Ich möchte die Anzahl der roten Bälle im laufenden Frame korrigieren.**
→ Ball-für-Ball-Dialog öffnen → Klick auf "Rote übrig"-Anzeige → Korrekten Wert einstellen.

**F: Ein Break wurde falsch eingetragen und soll nicht in die Statistik.**
→ Klick auf den Break-Wert unter der Punktzahl → Breaks-Übersicht → Break mit X markieren → zählt nicht mehr.

**F: Wie erkenne ich, wer gerade am Tisch ist?**
→ Der aktive Spieler hat einen **pulsierenden gelben Punkt** neben seinem Namen.

**F: Ich möchte das Match früher beenden als geplant.**
→ Menü → **"Match-Ende"** → Bestätigen.

---

*RRSB Snooker Scoreboard · Version 0.0.33 · rrsb-mono*

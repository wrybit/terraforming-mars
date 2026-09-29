# Terraforming Mars – UI-Überarbeitung

> **Dies ist ein Fork** von [terraforming-mars/terraforming-mars](https://github.com/terraforming-mars/terraforming-mars).
> Spiellogik und Karten stammen unverändert aus dem Original. Der Fork überarbeitet nur die **Oberfläche der Spieleransicht**,
> damit Design, Anordnung und Bedienung übersichtlicher werden.

### Was dieser Fork an der Oberfläche ändert

- **Zwei Spalten** ab 1400 px Fensterbreite: links das Spielgeschehen, rechts Mars, Meilensteine, Auszeichnungen und Log. Der Mars bleibt beim Scrollen sichtbar. Die Spaltenbreite lässt sich mit einem Griff verstellen.
- **Spielerliste als Tabelle:** Vorrat groß, Produktion daneben, Stahl- und Titanwert als Badge. Tags und Wertung stehen als kleinere Zähler dahinter.
- **Startauswahl** mit Konzern, Präludien und Kartenkauf als nebeneinander vergleichbare Spalten. Eine Bilanz-Leiste zeigt Start-M€, Kaufkosten und Rest. Der Spielplan lässt sich einklappen.
- **Handkarten** per Drag & Drop sortierbar. Die Reihenfolge gilt auch im Bauen- und Verkaufen-Dialog. Aktive Aktionskarten stehen als eigener Block darüber.
- **Plättchen platzieren:** Ein Button vergrößert den Mars. Nach dem Platzieren wird er per Animation wieder klein.
- **Aktionen als Tabs** mit einheitlichen Buttons. Hinweise zeigen z. B. die Temperatur vorher und nachher sowie die Anzahl der Ozeane.
- **Spielende** als Meldung über dem Mars, danach geht es automatisch zur Ergebnisseite.

## Screenshots

Alle Aufnahmen in 1920 px Breite, außer wo anders angegeben.

**Startauswahl mit Präludien:** Konzern, Präludien und Kartenkauf als Spalten, unten die Bilanz-Leiste.

![Startauswahl mit Konzern-, Präludium- und Kartenkauf-Spalte, Bilanz-Leiste mit Beginne-Button](docs/screenshots/startauswahl.jpg)

**Spielansicht:** Spielertabelle, Aktionen als Tabs, Handkarten mit aktiven Aktionskarten darüber. Rechts Mars, Meilensteine, Auszeichnungen und Log.

![Spielansicht mitten im Spiel](docs/screenshots/spielansicht.jpg)

**Plättchen platzieren:** Der Button nennt das Plättchen und was als Nächstes passiert.

![Tab „Plättchen platzieren“ mit Button „Stadt platzieren“](docs/screenshots/plaettchen-platzieren.jpg)

**Grünfläche platzieren:** Tab und Box in Grün.

![Tab „Grünfläche platzieren“ in Grün](docs/screenshots/gruenflaeche.jpg)

**Ozean platzieren:** Der Hinweis zeigt, wie viele Ozeane schon liegen.

![Ozean platzieren mit Hinweis „Bereits 4 von 9 Ozeanen auf dem Mars“](docs/screenshots/ozean.jpg)

**Großer Mars:** Ein Klick vergrößert den Mars. Ein gewähltes Feld wird vor dem Setzen bestätigt.

![Vergrößerter Mars mit Bestätigungsfrage am gewählten Feld](docs/screenshots/mars-gross.jpg)

**Gespielte Karten eines Spielers:** Ein Klick auf seine Zeile öffnet sie als Overlay über der rechten Spalte.

![Overlay mit den gespielten Karten des Gegners](docs/screenshots/karten-overlay.jpg)

**Log:** Beim Hovern über einen Kartennamen erscheint die Karte daneben.

![Kartenvorschau beim Hovern im Log](docs/screenshots/log-hover.jpg)

**3000 px breit:** Die Spielertabelle zeigt zusätzlich alle Tags.

![Spielansicht in 3000 px Breite](docs/screenshots/breit-3000.jpg)

**Spielende:** Die Meldung schwebt über dem Mars, danach geht es automatisch zur Ergebnisseite.

![Meldung „Das Spiel ist zu Ende!“ über dem Mars](docs/screenshots/spielende.jpg)

![Ergebnisseite mit Siegpunkten, finalem Spielbrett und Verlauf](docs/screenshots/ergebnis.jpg)

---

## Original und Rechtliches

- Spiellogik, Karten, Community und Anleitung zum Spielen: siehe das Original [terraforming-mars/terraforming-mars](https://github.com/terraforming-mars/terraforming-mars) bzw. [dessen Wiki](https://github.com/terraforming-mars/terraforming-mars/wiki).
- Nicht verbunden mit FryxGames, Asmodee Digital oder Steam. Das Brettspiel lohnt sich – bitte kaufen.

## Lokal starten

```bash
npm install
npm run build
npm start
```

## Lizenz

GPLv3, wie das Original (siehe [LICENSE](LICENSE)).

Schriften und Icons aus dem Original:

- Russian Prototype font: https://fonts-online.ru/fonts/prototype-rus-daymarius (copyright 2001, free for personal use)
- Polish Prototype font: https://www.gry-planszowe.pl/viewtopic.php?p=1489006#p1489006 (copyright 2001, free for personal use)
- Board Game Icons: http://www.kenney.nl/ (Creative Commons Zero, CC0)

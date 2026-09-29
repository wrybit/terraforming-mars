# Terraforming Mars – UI-Überarbeitung

> **Dies ist ein Fork** von [terraforming-mars/terraforming-mars](https://github.com/terraforming-mars/terraforming-mars).
> Spiellogik und Karten stammen unverändert aus dem Original. Der Fork überarbeitet nur die **Oberfläche der Spieleransicht**,
> damit Design, Anordnung und Bedienung übersichtlicher werden.

### Was dieser Fork an der Oberfläche ändert

- **Zwei Spalten** ab 1400 px Fensterbreite: links das Spielgeschehen, rechts Mars, Meilensteine, Auszeichnungen und Log. Der Mars bleibt beim Scrollen sichtbar. Die Spaltenbreite lässt sich mit einem Griff verstellen.
- **Spielerliste als Tabelle:** Vorrat groß, Produktion daneben, Stahl- und Titanwert als Badge. Tags und Wertung stehen als kleinere Zähler dahinter.
- **Startauswahl** mit Konzern und Kartenkauf als nebeneinander vergleichbare Spalten. Eine Bilanz-Leiste zeigt Start-M€, Kaufkosten und Rest. Der Spielplan lässt sich einklappen.
- **Handkarten** per Drag & Drop sortierbar. Die Reihenfolge gilt auch im Bauen- und Verkaufen-Dialog. Aktive Aktionskarten stehen als eigener Block darüber.
- **Plättchen platzieren:** Ein Button vergrößert den Mars. Nach dem Platzieren wird er per Animation wieder klein.
- **Aktionen als Tabs** mit einheitlichen Buttons. Hinweise zeigen z. B. die Temperatur vorher und nachher sowie die Anzahl der Ozeane.
- **Spielende** als Meldung über dem Mars, danach geht es automatisch zur Ergebnisseite.

**Startauswahl**

![Startauswahl: Konzern und Kartenkauf als Spalten, Bilanz-Leiste, Mars rechts](docs/screenshots/startauswahl.jpg)

**Spielansicht**

![Spielansicht: Spielertabelle, Aktions-Tabs, rechts Mars, Meilenstein-Tabelle und Log](docs/screenshots/spielansicht.jpg)

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

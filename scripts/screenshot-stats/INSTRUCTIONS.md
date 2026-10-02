# Auswertung von Ergebnis-Screenshots (Terraforming Mars)

Jeder Screenshot zeigt die Ergebnisseite einer Partie ("Terraforming Mars - Spiel beendet!", meist deutsch,
manchmal englisch). Lies ALLES Textliche ab und schreibe pro Screenshot genau eine JSON-Datei `extracted/<screenshotId>.json`
(screenshotId = Dateiname ohne .jpg). Die Diagramme NICHT ablesen – das macht `charts.py`.

Kleine Schrift: Ausschnitte 2–3fach vergrößert speichern und diese lesen (jeder Durchlauf mit eigenem
Hilfsskript, nicht gemeinsam genutzt). Genauigkeit geht vor Tempo.

## JSON-Format

```json
{
  "screenshotId": "1187895540952862800",
  "generations": 11,                      // aus "Siegpunkteaufschlüsselung nach N Generationen"
  "gameId": "g6d1300d1444d",              // aus der Log-Zeile "Die Spiel-ID war …", sonst null
  "board": "tharsis",                     // tharsis | hellas | elysium | null (Tharsis: Beschriftungen Tharsis Tholus, Ascraeus Mons, Pavonis Mons, Arsia Mons, Noctis City)
  "venus": false,                         // true, wenn ein Venus-Diagramm/Venus-Spalte zu sehen ist
  "notes": "",                            // Auffälligkeiten, Unsicherheiten
  "players": [
    {
      "name": "Daniel",
      "color": "red",                     // Farbe der Tabellenzeile: red | green | blue | yellow | black | purple | orange | pink
      "corporation": "Tharsis Republik",  // wie angezeigt (Zeile unter dem Namen); mehrere mit " / "
      "points": {                         // Spalten der Siegpunkte-Tabelle in Reihenfolge der Symbole
        "terraformRating": 45,            // orangenes TR-Symbol
        "milestones": 10,                 // "M"
        "awards": 2,                      // "A"
        "greenery": 11,                   // grünes Plättchen
        "city": 23,                       // Stadt-Plättchen
        "cards": 8,                       // "SP"-Münze = Siegpunkte aus Karten
        "other": {},                      // weitere Spalten (z. B. Venus, Mond, Fluchtgeschwindigkeit) als {"<Bezeichnung>": Zahl}
        "total": 99                       // "Gesamt"
      },
      "megaCredits": 81,                  // gelbes M€-Symbol (graue Zahl rechts)
      "time": "35:08",                    // Uhr-Symbol
      "actions": 73,                      // Pfeil-Symbol
      "cards": [                          // Kartenliste unter dem Spielernamen (Kasten in Spielerfarbe): Punkte + Name, GENAU wie geschrieben
        {"name": "Kallisto Strafmine", "points": 2},
        {"name": "Biomasse-Brennkammer", "points": -1}
      ],
      "milestones": ["Bürgermeister", "Gärtner"],   // aus "X-Meilenstein beansprucht" (nur der Name ohne "-Meilenstein")
      "awards": [                                   // aus "1. Platz für X (finanziert durch Y)" / "2nd place for X award (funded by Y)"
        {"name": "Bergmann", "place": 2, "funder": "Jens"}
      ]
    }
  ]
}
```

## Regeln
- Spielerreihenfolge wie in der Tabelle (Sieger oben).
- Kartennamen exakt übernehmen (Umlaute, Bindestriche); über zwei Zeilen umbrochene Namen zusammenfügen
  ("Fortgeschrittenes" + "Ökosystem" → "Fortgeschrittenes Ökosystem").
- Meilenstein-/Auszeichnungszeilen stehen am Ende der Kartenliste (nach einer Leerzeile); sie gehören NICHT in "cards".
- Auszeichnungen: Name ohne "award"; Platz 1 = 5 Punkte, Platz 2 = 2 Punkte.
- Prüfe selbst: Summe der Spalten = Gesamt; Summe der Kartenpunkte = "cards"-Spalte; 5 × Meilensteine = "milestones";
  Auszeichnungspunkte = "awards". Wenn etwas nicht aufgeht, nochmal vergrößert lesen; bleibt es so, in "notes" vermerken.
- Weicht ein Screenshot ab (andere Oberfläche, z. B. Steam-Version, fehlende Teile), trage ein, was sichtbar ist,
  setze Unbekanntes auf null und beschreibe es in "notes".
- Antworte am Ende nur mit einer kurzen Liste: Datei → OK oder Problem (eine Zeile je Screenshot).

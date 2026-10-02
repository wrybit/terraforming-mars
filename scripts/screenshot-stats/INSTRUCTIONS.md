# Evaluating result screenshots (Terraforming Mars)

Each screenshot shows the results page of a game ("Terraforming Mars - Spiel beendet!", usually German,
sometimes English). Read ALL the text and write exactly one JSON file `extracted/<screenshotId>.json` per screenshot
(screenshotId = file name without .jpg). Do NOT read the charts – `charts.py` does that.

Small text: save crops enlarged 2–3x and read those (each run with its own
helper script, not shared). Accuracy before speed.

## JSON format

```json
{
  "screenshotId": "1187895540952862800",
  "generations": 11,                      // from "Siegpunkteaufschlüsselung nach N Generationen"
  "gameId": "g6d1300d1444d",              // from the log line "Die Spiel-ID war …", otherwise null
  "board": "tharsis",                     // tharsis | hellas | elysium | null (Tharsis: labels Tharsis Tholus, Ascraeus Mons, Pavonis Mons, Arsia Mons, Noctis City)
  "venus": false,                         // true if a Venus chart/Venus column is visible
  "notes": "",                            // anomalies, uncertainties
  "players": [
    {
      "name": "Daniel",
      "color": "red",                     // color of the table row: red | green | blue | yellow | black | purple | orange | pink
      "corporation": "Tharsis Republik",  // as displayed (line under the name); several joined with " / "
      "points": {                         // columns of the victory point table in the order of the icons
        "terraformRating": 45,            // orange TR icon
        "milestones": 10,                 // "M"
        "awards": 2,                      // "A"
        "greenery": 11,                   // green tile
        "city": 23,                       // city tile
        "cards": 8,                       // "SP" coin = victory points from cards
        "other": {},                      // further columns (e.g. Venus, Moon, escape velocity) as {"<label>": number}
        "total": 99                       // "Gesamt" (total)
      },
      "megaCredits": 81,                  // yellow M€ icon (gray number on the right)
      "time": "35:08",                    // clock icon
      "actions": 73,                      // arrow icon
      "cards": [                          // card list under the player name (box in player color): points + name, EXACTLY as written
        {"name": "Kallisto Strafmine", "points": 2},
        {"name": "Biomasse-Brennkammer", "points": -1}
      ],
      "milestones": ["Bürgermeister", "Gärtner"],   // from "X-Meilenstein beansprucht" (only the name without "-Meilenstein")
      "awards": [                                   // from "1. Platz für X (finanziert durch Y)" / "2nd place for X award (funded by Y)"
        {"name": "Bergmann", "place": 2, "funder": "Jens"}
      ]
    }
  ]
}
```

## Rules
- Player order as in the table (winner on top).
- Copy card names exactly (umlauts, hyphens); join names wrapped over two lines
  ("Fortgeschrittenes" + "Ökosystem" → "Fortgeschrittenes Ökosystem").
- Milestone/award lines are at the end of the card list (after a blank line); they do NOT belong in "cards".
- Awards: name without "award"; place 1 = 5 points, place 2 = 2 points.
- Check yourself: sum of columns = total; sum of card points = "cards" column; 5 × milestones = "milestones";
  award points = "awards". If something doesn't add up, read it again enlarged; if it stays that way, note it in "notes".
- If a screenshot differs (different UI, e.g. Steam version, missing parts), enter what is visible,
  set unknowns to null and describe it in "notes".
- At the end, reply only with a short list: file → OK or problem (one line per screenshot).

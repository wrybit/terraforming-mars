# Screenshot-Auswertung für die Statistik

Partien, von denen nur ein Screenshot der Ergebnisseite existiert (aus Discord importiert), liefern so trotzdem
Punkteaufschlüsselung, Siegpunkt-Karten, Meilensteine, Auszeichnungen, Punkte je Generation und den Verlauf der
globalen Parameter für `/stats`.

1. Screenshots und `imported-games.json` vom Server holen (`db/imported/screenshots/`, `db/imported-games.json`).
2. Text ablesen: je Screenshot eine `extracted/<id>.json` nach `INSTRUCTIONS.md` (Claude mit Bildansicht).
3. Zusammenführen, Namen ins Englische übersetzen, Diagramme pixelgenau auslesen:
   `python3 convert.py --screenshots <ordner> --extracted extracted --out screenshot-details`
   (braucht `opencv-python` und `numpy`; vorher `npm run make:json` für `assets/locales/de.json`).
4. `screenshot-details/*.json` nach `db/imported/screenshot-details/` auf den Server kopieren.

`charts.py` findet die Diagramme über ihre Gitterlinien, liest die Linien an den Generationen über ihre Farbe und
eicht die Siegpunkte an den Endständen aus der Tabelle. Weicht der letzte Wert um mehr als 3 Punkte ab, wird der
Verlauf verworfen.

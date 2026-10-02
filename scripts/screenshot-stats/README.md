# Screenshot analysis for the statistics

Games for which only a screenshot of the results page exists (imported from Discord) still provide
points breakdown, VP cards, milestones, awards, points per generation and the history of the
global parameters for `/stats` this way.

1. Fetch the screenshots and `imported-games.json` from the server (`db/imported/screenshots/`, `db/imported-games.json`).
2. Read off the text: one `extracted/<id>.json` per screenshot following `INSTRUCTIONS.md` (Claude with image view).
3. Merge, translate names into English, read the charts pixel-accurately:
   `python3 convert.py --screenshots <folder> --extracted extracted --out screenshot-details`
   (needs `opencv-python` and `numpy`; run `npm run make:json` first for `assets/locales/de.json`).
4. Copy `screenshot-details/*.json` to `db/imported/screenshot-details/` on the server.

`charts.py` finds the charts via their grid lines, reads the lines at the generations by their color and
calibrates the victory points against the final scores from the table. If the last value deviates by more than 3 points, the
history is discarded.

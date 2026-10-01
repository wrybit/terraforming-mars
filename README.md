# Terraforming Mars – UI Redesign

A fork of [terraforming-mars/terraforming-mars](https://github.com/terraforming-mars/terraforming-mars) that reworks only the **player view UI**. Game logic and cards are unchanged.

**[Live demo](https://tm.baiz.org/demo/)** – screenshots of every view on desktop, tablet and phone.

Changes from the original are merged regularly. Afterwards the affected screenshots on the demo page are updated automatically.

### What changes

- **Two columns** from 1400 px: actions left; Mars, milestones, awards and log right.
- **Mobile view** on touch devices and narrow windows: one task at a time, bottom navigation, turn drawer.
- **Create game** and **game created** pages with compact cards and one link per player.
- **Player table:** stock large, production next to it, tags and scores as small counters.
- **Initial selection:** corporation, preludes and cards side by side with a cost summary.
- **Hand cards** sortable by drag and drop; active action cards in their own block.
- **Actions as tabs** with consistent buttons and hints (e.g. temperature before/after).
- **Game end** as a notice over Mars, then redirect to the results.

## Screenshots

English UI. Desktop at 1920 px width, mobile on a 390 px phone.

<table>
<tr><th>View</th><th>Desktop</th><th>Mobile</th></tr>
<tr>
<td><b>Create game</b><br>Settings as compact cards, players in their own column on the right. On phones the players come first and the create button sticks to the bottom.</td>
<td><img src="docs/screenshots/create-desktop.webp" width="560" alt="Create game on desktop"></td>
<td><img src="docs/screenshots/create-phone.webp" width="180" alt="Create game on a phone"></td>
</tr>
<tr>
<td><b>Game created</b><br>One link per player in their colour with copy and play buttons, game settings next to them.</td>
<td><img src="docs/screenshots/game-home-desktop.webp" width="560" alt="Game created on desktop"></td>
<td><img src="docs/screenshots/game-home-phone.webp" width="180" alt="Game created on a phone"></td>
</tr>
<tr>
<td><b>Initial selection</b><br>Corporation, preludes and card purchase side by side, with a summary bar and the start button.</td>
<td><img src="docs/screenshots/setup-selected-desktop.webp" width="560" alt="Initial selection on desktop"></td>
<td><img src="docs/screenshots/setup-selected-phone.webp" width="180" alt="Initial selection on a phone"></td>
</tr>
<tr>
<td><b>Mars</b><br>Desktop: two columns with Mars on the right. Phone: Mars without the ring; temperature, oxygen and oceans as bars below.</td>
<td><img src="docs/screenshots/mars-desktop.webp" width="560" alt="Mars on desktop"></td>
<td><img src="docs/screenshots/mars-phone.webp" width="180" alt="Mars on a phone"></td>
</tr>
<tr>
<td><b>Hand</b><br>Active action cards above the hand. Cards can be sorted by drag and drop.</td>
<td><img src="docs/screenshots/hand-desktop.webp" width="560" alt="Hand on desktop"></td>
<td><img src="docs/screenshots/hand-phone.webp" width="180" alt="Hand on a phone"></td>
</tr>
<tr>
<td><b>Players</b><br>Player table with stock and production. On phones in its own tab.</td>
<td><img src="docs/screenshots/players-2-desktop.webp" width="560" alt="Players on desktop"></td>
<td><img src="docs/screenshots/players-2-phone.webp" width="180" alt="Players on a phone"></td>
</tr>
<tr>
<td><b>Playing a card</b><br>Card chosen, payment with M€, steel and titanium. On phones the cards are a carousel and the payment sits in the footer.</td>
<td><img src="docs/screenshots/build-1-desktop.webp" width="560" alt="Playing a card on desktop"></td>
<td><img src="docs/screenshots/build-1-phone.webp" width="180" alt="Playing a card on a phone"></td>
</tr>
<tr>
<td><b>Placing a tile</b><br>Mars enlarged, a chosen space is confirmed before placing.</td>
<td><img src="docs/screenshots/place-zoom-desktop.webp" width="560" alt="Placing a tile on desktop"></td>
<td><img src="docs/screenshots/place-zoom-phone.webp" width="180" alt="Placing a tile on a phone"></td>
</tr>
<tr>
<td><b>Log</b><br>Cards named in the log open in a large view; on phones as a carousel to swipe through.</td>
<td><img src="docs/screenshots/log-cards-desktop.webp" width="560" alt="Log on desktop"></td>
<td><img src="docs/screenshots/log-cards-phone.webp" width="180" alt="Log on a phone"></td>
</tr>
<tr>
<td><b>Results</b><br>Victory points, final board and point history.</td>
<td><img src="docs/screenshots/results-multi-desktop.webp" width="560" alt="Results on desktop"></td>
<td><img src="docs/screenshots/results-multi-phone.webp" width="180" alt="Results on a phone"></td>
</tr>
</table>

---

## Original and legal

- Game rules, cards, community and how to play: see the original [terraforming-mars/terraforming-mars](https://github.com/terraforming-mars/terraforming-mars) and [its wiki](https://github.com/terraforming-mars/terraforming-mars/wiki).
- Not affiliated with FryxGames, Asmodee Digital or Steam. The board game is great – please buy it.

## Running locally

Requirements: Git and [Node.js](https://nodejs.org/) 24 (see `.nvmrc`; 22 works too). No database server needed – games are stored in `db/game.db` (SQLite).

```bash
git clone https://github.com/wrybit/terraforming-mars.git
cd terraforming-mars
npm ci             # install dependencies
npm run build      # takes a few minutes
npm start
```

Open <http://localhost:8080>, click **New game**, create the game and open the player links. Other devices in your network can join via `http://<your-IP>:8080`.

- **Settings:** `cp .env.sample .env`, e.g. `PORT` or `LOCAL_FS_DB` (JSON files instead of SQLite). See [`.env.sample`](.env.sample).
- **Development:** after one `npm run build`, `npm run dev` rebuilds on every change. Checks: `npm run lint`, `npm run test`.
- **Docker** (no Node.js needed): `docker compose up -d --build`, then <http://localhost:8080>.
- **`npm ci` fails at `better-sqlite3`:** check the Node version; if needed install build tools (macOS `xcode-select --install`, Debian/Ubuntu `sudo apt install python3 make g++`).

## License

GPLv3, like the original (see [LICENSE](LICENSE)).

Fonts and icons from the original:

- Russian Prototype font: https://fonts-online.ru/fonts/prototype-rus-daymarius (copyright 2001, free for personal use)
- Polish Prototype font: https://www.gry-planszowe.pl/viewtopic.php?p=1489006#p1489006 (copyright 2001, free for personal use)
- Board Game Icons: http://www.kenney.nl/ (Creative Commons Zero, CC0)

# Terraforming Mars – UI Redesign

> **This is a fork** of [terraforming-mars/terraforming-mars](https://github.com/terraforming-mars/terraforming-mars).
> Game logic and cards are unchanged from the original. The fork only reworks the **player view UI**
> to make its design, layout and interaction clearer.

### What this fork changes in the UI

- **Two columns** from a window width of 1400 px: game actions on the left; Mars, milestones, awards and log on the right. Mars stays visible while scrolling. A drag handle adjusts the column widths.
- **Mobile view** on touch devices and below 1400 px: one task at a time with a bottom navigation and a turn drawer that slides up. Mars without the ring, global parameters as bars. Phones in landscape show a hint to rotate the device.
- **Create game** with the settings as compact cards and the players in their own column. Only options that apply are shown (e.g. expansion options only for active expansions).
- **Game created** page with one link per player in their colour, copy and play buttons, and the game settings next to them.
- **Player list as a table:** current stock large, production next to it, steel and titanium value as a badge. Tags and scores follow as smaller counters.
- **Initial selection** with corporation, preludes and card purchase as side-by-side columns you can compare. A summary bar shows starting M€, purchase cost and what remains.
- **Hand cards** can be sorted by drag and drop. The order also applies in the build and sell dialogs. Active action cards get their own block above the hand.
- **Placing tiles:** a button enlarges Mars. After placing, it shrinks back with an animation.
- **Actions as tabs** with consistent buttons. Hints show e.g. the temperature before and after, or the number of oceans already placed. Attacks on players show tiles in the target player's colour.
- **Spectator view** in the same layout as the player view.
- **Game end** as a notice floating over Mars, followed by an automatic redirect to the results page.

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

```bash
npm install
npm run build
npm start
```

## License

GPLv3, like the original (see [LICENSE](LICENSE)).

Fonts and icons from the original:

- Russian Prototype font: https://fonts-online.ru/fonts/prototype-rus-daymarius (copyright 2001, free for personal use)
- Polish Prototype font: https://www.gry-planszowe.pl/viewtopic.php?p=1489006#p1489006 (copyright 2001, free for personal use)
- Board Game Icons: http://www.kenney.nl/ (Creative Commons Zero, CC0)

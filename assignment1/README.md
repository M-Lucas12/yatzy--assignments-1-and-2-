# 🎲 Assignment 1 – Yatzy (Continuation of Lab 6)

This project continues **Lab 6** (modular JS design) and **activates** the UI from **Lab 5**:
- Same layout (left dice panel, right scoreboard, blue/white theme).
- Same modules: `dice.js`, `yatzyEngine.js`, `yatzyGame.js`.
- New features: roll/hold/re-roll (3 per turn), clickable categories, running total, end game & new game.

## Modules (from Lab 6)
- `dice.js` – encapsulates dice values and **hold** state with `roll()`, `toggleHold()`, `releaseAll()`.
- `yatzyEngine.js` – encapsulates rules and **scoring** for all categories.
- `yatzyGame.js` – encapsulates **game state** and now wires the UI (turns, rolls left, scoring, total).

## How to Play
1. **Roll (3)** to start a turn (up to 3 rolls).
2. Click any die to **hold** it before re-rolling.
3. Click a **category** in the scoreboard to record points for this turn.
4. After all 13 categories are used, the game ends and shows your **final score**.
5. Use **New Game** to reset.

## Files
- `index.html` – Lab-5 layout, now wired to modules.
- `styles.css` – blue/white theme; hover/hold styles added.
- `dice.js` / `yatzyEngine.js` / `yatzyGame.js` – Lab-6 modules with Assignment-1 logic connected.

## Notes
- ES modules (`type="module"`) – no libraries required.
- Responsive layout (panels stack on small screens).
// ============================================================
// 🎮 Yatzy Game Module – Assignment 1 (complete flow)
// - 5 dice per requirements
// - Roll / Hold / Score by clicking category
// - Lock categories, track total, end game
// ============================================================

import { Dice } from "./dice.js";
import { YatzyEngine } from "./yatzyEngine.js";

export class YatzyGame {
    constructor() {
        // === GAME STATE ===
        this.round = 1;
        this.rollsLeft = 3;
        this.totalScore = 0;
        this.turnScored = false; // true after user picks a category this turn

        // 5 dice required by assignment
        this.dice = new Dice(5);
        this.engine = new YatzyEngine();

        // UI refs filled by attachUI()
        this.ui = null;
    }

    // Attach DOM references from index.html
    attachUI(ui) {
        this.ui = ui;

        // --- Dice buttons: ensure exactly 5 are usable ---
        let btns = this.ui.diceButtons;
        if (btns.length < this.dice.numDice) {
            // Create missing buttons if fewer exist
            for (let i = btns.length; i < this.dice.numDice; i++) {
                const b = document.createElement("button");
                b.className = "die";
                b.dataset.index = i;
                this.ui.diceRow.appendChild(b);
            }
            btns = this.ui.diceRow.querySelectorAll(".die");
        } else if (btns.length > this.dice.numDice) {
            // Hide extras if more buttons exist
            btns.forEach((b, i) => {
                if (i >= this.dice.numDice) b.style.display = "none";
            });
        }
        this.ui.diceButtons = [...this.ui.diceRow.querySelectorAll(".die")].slice(0, this.dice.numDice);

        // Ensure each die has pip spans and wire hold toggle
        this.ui.diceButtons.forEach((btn, i) => {
            this.#ensurePips(btn);
            btn.dataset.index = i;
            btn.addEventListener("click", () => this.toggleHold(i));
        });

        // --- Buttons ---
        this.ui.rollBtn.addEventListener("click", () => this.rollDice());
        this.ui.endTurnBtn.addEventListener("click", () => this.forceEndTurn());
        this.ui.newGameBtn.addEventListener("click", () => this.startNewGame());

        // --- Scoreboard rows: clicking a row scores the turn for that category ---
        this.ui.scoreRows.querySelectorAll("tr").forEach((row) => {
            row.addEventListener("click", () => this.handleCategoryClick(row));
        });

        // Start fresh
        this.startNewGame();
    }

    // ============================================================
    // 🚀 Game lifecycle
    // ============================================================
    startNewGame() {
        this.round = 1;
        this.rollsLeft = 3;
        this.totalScore = 0;
        this.turnScored = false;

        // Reset scoreboard rows
        this.ui.scoreRows.querySelectorAll("tr").forEach((row) => {
            row.classList.remove("scored");
            row.dataset.scored = "0";
            const pts = row.querySelector(".pts");
            if (pts) pts.textContent = "–";
        });
        this.ui.totalScore.textContent = "0";

        // Clear holds and render initial faces (1..5 to showcase pips)
        this.dice.releaseAll();
        for (let i = 0; i < this.dice.numDice; i++) this.dice.values[i] = i + 1;

        this.renderDice(true);
        this.setStatus("New game started! Click Roll to begin.");
        this.updateButtons();
    }

    endGame() {
        this.ui.rollBtn.disabled = true;
        this.ui.endTurnBtn.disabled = true;
        this.setStatus(`🎉 Game Over! Final Score: ${this.totalScore}`);
        alert(`Game Over! Final Score: ${this.totalScore}`);
    }

    // ============================================================
    // 🎲 Turn actions
    // ============================================================
    rollDice() {
        if (this.rollsLeft <= 0) return;
        this.dice.roll();
        this.rollsLeft--;
        this.turnScored = false;
        this.renderDice();
        this.setStatus(`You rolled: ${this.dice.values.join(", ")} — Rolls left: ${this.rollsLeft}`);
        this.updateButtons();
    }

    toggleHold(index) {
        // Must have rolled at least once to hold
        if (this.rollsLeft === 3) {
            this.setStatus("Roll first, then click dice to hold.");
            return;
        }
        this.dice.toggleHold(index);
        this.renderDice();
    }

    // End turn without choosing a category yet:
    // we freeze rolling and ask the user to pick a category row.
    forceEndTurn() {
        if (this.rollsLeft === 3) {
            this.setStatus("You need to roll before ending the turn.");
            return;
        }
        if (this.turnScored) {
            this.setStatus("This turn is already scored. Start the next one.");
            return;
        }
        this.rollsLeft = 0;
        this.setStatus("Select a category on the scoreboard to score this turn.");
        this.updateButtons();
    }

    // User clicks a scoreboard row to score the current turn
    handleCategoryClick(row) {
        if (row.dataset.scored === "1") {
            this.setStatus("That category is already filled. Choose a different one.");
            return;
        }
        // Must have rolled at least once
        if (this.rollsLeft === 3) {
            this.setStatus("Roll the dice first, then choose a category.");
            return;
        }

        const category = row.getAttribute("data-cat");
        const points = this.engine.score(category, this.dice.values);

        // Fill row
        const ptsCell = row.querySelector(".pts");
        if (ptsCell) ptsCell.textContent = String(points);
        row.classList.add("scored");
        row.dataset.scored = "1";

        // Update total & status
        this.totalScore += points;
        this.ui.totalScore.textContent = String(this.totalScore);
        this.setStatus(`Scored ${points} points for ${category}. Total: ${this.totalScore}`);

        // Prepare next turn
        this.turnScored = true;
        this.round++;
        this.rollsLeft = 3;
        this.dice.releaseAll();
        // Show neutral faces to make the reset obvious
        for (let i = 0; i < this.dice.numDice; i++) this.dice.values[i] = i + 1;
        this.renderDice(true);
        this.updateButtons();

        // Check end-of-game: all categories scored?
        const remaining = [...this.ui.scoreRows.querySelectorAll("tr")].some(
            (r) => r.dataset.scored !== "1"
        );
        if (!remaining) this.endGame();
    }

    // ============================================================
    // 🖥️ UI helpers
    // ============================================================
    renderDice(reset = false) {
        this.ui.diceButtons.forEach((btn, i) => {
            btn.setAttribute("data-face", this.dice.values[i]);
            btn.setAttribute("aria-pressed", reset ? "false" : String(this.dice.held[i]));
        });
    }

    updateButtons() {
        // Roll available if rollsLeft > 0
        this.ui.rollBtn.disabled = this.rollsLeft <= 0;
        // End turn available only after at least one roll and before scoring
        this.ui.endTurnBtn.disabled = (this.rollsLeft === 3) || this.turnScored;
    }

    setStatus(msg) {
        this.ui.status.textContent = msg;
    }

    // Ensure a die button has the 9 pip spans (done once)
    #ensurePips(btn) {
        if (btn.dataset.pipsInit === "1") return;
        btn.innerHTML = `
      <span class="pip p1"></span><span class="pip p2"></span><span class="pip p3"></span>
      <span class="pip p4"></span><span class="pip p5"></span><span class="pip p6"></span>
      <span class="pip p7"></span><span class="pip p8"></span><span class="pip p9"></span>
    `;
        btn.dataset.pipsInit = "1";
    }
}
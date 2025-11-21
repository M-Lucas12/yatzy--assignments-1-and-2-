// assignment2/main.js
// Client-side Yatzy UI that talks to the Node/Express server via Fetch API.

const API_BASE =
    location.hostname === "localhost" || location.hostname === "127.0.0.1"
        ? "http://localhost:3000"
        : ""; // if later served by Express itself

let currentGameId = null;

// ---------- DOM helpers ----------
function createDiceButtons(rowEl, count = 5) {
    if (!rowEl) return;
    rowEl.innerHTML = "";

    for (let i = 0; i < count; i++) {
        const btn = document.createElement("button");
        btn.className = "die";
        btn.dataset.index = i;
        btn.dataset.face = "1";
        btn.setAttribute("aria-pressed", "false");
        btn.title = "Toggle hold";

        for (let p = 1; p <= 9; p++) {
            const s = document.createElement("span");
            s.className = `pip p${p}`;
            btn.appendChild(s);
        }

        rowEl.appendChild(btn);
    }
}

function setStatus(text, isError = false) {
    const el = document.getElementById("status");
    if (!el) return;
    el.textContent = text;
    el.style.color = isError ? "#b01515" : "#004B87";
}

function createOptions(method = "GET", bodyObj) {
    const opts = {
        method,
        headers: {
            "Content-Type": "application/json"
        }
    };
    if (bodyObj) {
        opts.body = JSON.stringify(bodyObj);
    }
    return opts;
}

async function api(path, method = "GET", bodyObj) {
    const res = await fetch(`${API_BASE}${path}`, createOptions(method, bodyObj));
    if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
    }
    return res.json();
}

// ---------- Rendering ----------
function renderGame(game) {
    if (!game) return;

    const rollBtn = document.getElementById("rollBtn");
    const endTurnBtn = document.getElementById("endTurnBtn");
    const newGameBtn = document.getElementById("newGameBtn");
    const diceButtons = [...document.querySelectorAll(".die")];

    // Dice faces & holds
    diceButtons.forEach((btn, i) => {
        const value = game.dice[i] ?? 1;
        const held = game.held[i];

        btn.dataset.face = String(value);
        btn.setAttribute("aria-pressed", held ? "true" : "false");
    });

    // Scoreboard
    const rows = document.querySelectorAll("#scoreRows tr[data-cat]");
    rows.forEach((row) => {
        const cat = row.dataset.cat;
        const ptsCell = row.querySelector(".pts");
        const scoredValue = game.scores[cat];

        if (typeof scoredValue === "number") {
            ptsCell.textContent = scoredValue;
            row.classList.add("scored");
        } else {
            ptsCell.textContent = "–";
            row.classList.remove("scored");
        }
    });

    // Total
    const totalEl = document.getElementById("totalScore");
    if (totalEl) {
        totalEl.textContent = String(game.total ?? 0);
    }

    // Buttons enabled/disabled
    if (rollBtn) {
        rollBtn.disabled = game.finished || game.rollsLeft <= 0;
        rollBtn.textContent = `Roll (${game.rollsLeft})`;
    }
    if (endTurnBtn) {
        // End turn here is just a visual reset (we’ll roll again on server).
        endTurnBtn.disabled = game.finished;
    }
    if (newGameBtn) {
        newGameBtn.disabled = false;
    }

    if (game.finished) {
        setStatus(`Game over! Final score: ${game.total}`);
    } else {
        setStatus(`Rolls left this turn: ${game.rollsLeft}`);
    }
}

// ---------- Game actions ----------
async function createGame() {
    setStatus("Creating new game…");

    try {
        const data = await api("/api/games", "POST");
        currentGameId = data.game.id;
        renderGame(data.game);
        setStatus(data.message);
    } catch (err) {
        console.error(err);
        setStatus(`Error creating game: ${err.message}`, true);
    }
}

async function rollDice() {
    if (!currentGameId) return;

    try {
        const data = await api(`/api/games/${currentGameId}/roll`, "POST");
        renderGame(data.game);
        setStatus(data.message);
    } catch (err) {
        console.error(err);
        setStatus(`Roll failed: ${err.message}`, true);
    }
}

async function toggleHold(index) {
    if (!currentGameId) return;

    try {
        const data = await api(`/api/games/${currentGameId}/hold`, "POST", { index });
        renderGame(data.game);
        setStatus(data.message);
    } catch (err) {
        console.error(err);
        setStatus(`Hold failed: ${err.message}`, true);
    }
}

async function scoreCategory(cat) {
    if (!currentGameId) return;

    try {
        const data = await api(`/api/games/${currentGameId}/score`, "POST", { category: cat });
        renderGame(data.game);
        setStatus(data.message);
    } catch (err) {
        console.error(err);
        setStatus(`Score failed: ${err.message}`, true);
    }
}

// ---------- Setup ----------
document.addEventListener("DOMContentLoaded", () => {
    const diceRow = document.getElementById("dice-row");
    createDiceButtons(diceRow);

    const rollBtn = document.getElementById("rollBtn");
    const endTurnBtn = document.getElementById("endTurnBtn");
    const newGameBtn = document.getElementById("newGameBtn");

    const diceButtons = [...document.querySelectorAll(".die")];
    diceButtons.forEach((btn, i) => {
        btn.addEventListener("click", () => toggleHold(i));
    });

    if (rollBtn) {
        rollBtn.addEventListener("click", () => rollDice());
    }

    if (endTurnBtn) {
        // End turn here just re-rolls (fresh turn) – server enforces rules
        endTurnBtn.addEventListener("click", () => rollDice());
    }

    if (newGameBtn) {
        newGameBtn.addEventListener("click", () => createGame());
    }

    // Scoreboard rows
    const rows = document.querySelectorAll("#scoreRows tr[data-cat]");
    rows.forEach((row) => {
        row.addEventListener("click", () => {
            const cat = row.dataset.cat;
            scoreCategory(cat);
        });
    });

    // Start immediately
    createGame();
});
// assignment2/server.js
// Node + Express Yatzy server (Assignment 2)
// Game state is stored on the server in memory.

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors());           // allow WebStorm dev server etc.
app.use(express.json());   // parse JSON bodies

// Optional: serve the client files if you want to run everything from Node
// app.use(express.static(path.join(__dirname)));

// ---- In-memory game storage ----
const games = {};
let nextId = 1;

// Helper functions
function createNewGame() {
    const id = String(nextId++);
    const dice = [1, 2, 3, 4, 5];
    const held = [false, false, false, false, false];

    const scores = {
        "Ones": null,
        "Twos": null,
        "Threes": null,
        "Fours": null,
        "Fives": null,
        "Sixes": null,
        "Three of a Kind": null,
        "Four of a Kind": null,
        "Full House": null,
        "Small Straight": null,
        "Large Straight": null,
        "Chance": null,
        "Yatzy": null
    };

    const game = {
        id,
        dice,
        held,
        rollsLeft: 3,
        scores,
        total: 0,
        finished: false
    };

    games[id] = game;
    return game;
}

function randomDie() {
    return Math.floor(Math.random() * 6) + 1;
}

function sum(values) {
    return values.reduce((a, b) => a + b, 0);
}

function countFaces(values) {
    const counts = {};
    for (const v of values) {
        counts[v] = (counts[v] || 0) + 1;
    }
    return counts;
}

function computeScore(category, dice) {
    const counts = countFaces(dice);
    const total = sum(dice);
    const byCount = Object.values(counts).sort((a, b) => b - a);
    const uniqueVals = Object.keys(counts).map(Number);

    switch (category) {
        case "Ones":
        case "Twos":
        case "Threes":
        case "Fours":
        case "Fives":
        case "Sixes": {
            const faces = ["Ones","Twos","Threes","Fours","Fives","Sixes"];
            const face = faces.indexOf(category) + 1;
            return (counts[face] || 0) * face;
        }
        case "Three of a Kind":
            return byCount[0] >= 3 ? total : 0;
        case "Four of a Kind":
            return byCount[0] >= 4 ? total : 0;
        case "Full House":
            return byCount[0] === 3 && byCount[1] === 2 ? 25 : 0;
        case "Small Straight": {
            const s = new Set(dice);
            if (
                [1,2,3,4].every(n => s.has(n)) ||
                [2,3,4,5].every(n => s.has(n)) ||
                [3,4,5,6].every(n => s.has(n))
            ) return 30;
            return 0;
        }
        case "Large Straight": {
            const sorted = [...new Set(dice)].sort((a,b)=>a-b).join("");
            return (sorted === "12345" || sorted === "23456") ? 40 : 0;
        }
        case "Chance":
            return total;
        case "Yatzy":
            return uniqueVals.length === 1 ? 50 : 0;
        default:
            return 0;
    }
}

function getGame(req, res) {
    const id = req.params.id;
    const game = games[id];
    if (!game) {
        return res.status(404).json({ error: "Game not found" });
    }
    return game;
}

// ---- API routes ----

// health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", games: Object.keys(games).length });
});

// Create a new game
app.post("/api/games", (req, res) => {
    const game = createNewGame();
    res.status(201).json({
        message: "New game created",
        game
    });
});

// Get current state for a game
app.get("/api/games/:id", (req, res) => {
    const game = getGame(req, res);
    if (!game) return;
    res.json({ game });
});

// Toggle hold on a die
app.post("/api/games/:id/hold", (req, res) => {
    const game = getGame(req, res);
    if (!game) return;

    const { index } = req.body;
    if (typeof index !== "number" || index < 0 || index > 4) {
        return res.status(400).json({ error: "Invalid index" });
    }

    game.held[index] = !game.held[index];

    res.json({
        message: `Die ${index + 1} ${game.held[index] ? "held" : "released"}.`,
        game
    });
});

// Roll dice
app.post("/api/games/:id/roll", (req, res) => {
    const game = getGame(req, res);
    if (!game) return;

    if (game.finished) {
        return res.status(400).json({ error: "Game already finished" });
    }
    if (game.rollsLeft <= 0) {
        return res.status(400).json({ error: "No rolls left this turn" });
    }

    for (let i = 0; i < game.dice.length; i++) {
        if (!game.held[i]) {
            game.dice[i] = randomDie();
        }
    }
    game.rollsLeft--;

    const msg = game.rollsLeft > 0
        ? `Rolled dice. Rolls left: ${game.rollsLeft}.`
        : "Rolled dice. No rolls left, please choose a category.";

    res.json({ message: msg, game });
});

// Score a category
app.post("/api/games/:id/score", (req, res) => {
    const game = getGame(req, res);
    if (!game) return;

    const { category } = req.body;
    if (!category || !(category in game.scores)) {
        return res.status(400).json({ error: "Invalid category" });
    }
    if (game.scores[category] !== null) {
        return res.status(400).json({ error: "Category already scored" });
    }

    const points = computeScore(category, game.dice);
    game.scores[category] = points;

    // recompute total
    game.total = Object.values(game.scores)
        .filter(v => typeof v === "number")
        .reduce((a, b) => a + b, 0);

    // start next turn
    game.rollsLeft = 3;
    game.dice = [1, 2, 3, 4, 5];
    game.held = [false, false, false, false, false];

    // check finished (no null scores)
    game.finished = Object.values(game.scores).every(v => v !== null);

    const msg = game.finished
        ? `Game over! Final score: ${game.total}`
        : `Scored ${points} points in ${category}. New turn started.`;

    res.json({ message: msg, game });
});

// Delete/reset a game
app.delete("/api/games/:id", (req, res) => {
    const id = req.params.id;
    if (games[id]) {
        delete games[id];
    }
    res.json({ message: "Game deleted" });
});

// ---- Start server ----
app.listen(PORT, () => {
    console.log(`✅ Yatzy server running at http://localhost:${PORT}`);
});
import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.sqlite");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    balance REAL DEFAULT 0,
    ff_id TEXT,
    role TEXT DEFAULT 'player'
  );

  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    tag TEXT,
    leader_id INTEGER,
    logo_url TEXT,
    FOREIGN KEY(leader_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    entry_fee REAL,
    prize_pool REAL,
    start_time TEXT,
    map TEXT,
    mode TEXT,
    status TEXT DEFAULT 'upcoming',
    max_players INTEGER,
    current_players INTEGER DEFAULT 0,
    description TEXT,
    rules TEXT,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER,
    user_id INTEGER,
    team_id INTEGER,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(team_id) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS match_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER,
    user_id INTEGER,
    rank INTEGER,
    kills INTEGER,
    earnings REAL,
    FOREIGN KEY(tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed initial data
const tournamentCount = db.prepare("SELECT COUNT(*) as count FROM tournaments").get() as { count: number };
if (tournamentCount.count === 0) {
  const insertT = db.prepare("INSERT INTO tournaments (title, entry_fee, prize_pool, start_time, map, mode, max_players, description, rules, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insertT.run("FF World Series Qualifier", 50, 5000, "2026-03-10 20:00", "Bermuda", "Squad", 12, "The official qualifier for the upcoming World Series. Only top teams will advance.", "1. No Emulators\n2. Level 50+ Required\n3. Fair Play Only", "https://picsum.photos/seed/ffws/800/400");
  insertT.run("Asia Invitational", 20, 2000, "2026-03-15 18:00", "Purgatory", "Duo", 24, "International duo tournament featuring top players from across Asia.", "Standard international rules apply.", "https://picsum.photos/seed/asia/800/400");

  const insertN = db.prepare("INSERT INTO news (title, content, image_url) VALUES (?, ?, ?)");
  insertN.run("New Season Starts!", "Get ready for the most competitive season yet with over $10k in prizes.", "https://picsum.photos/seed/news1/800/400");
  insertN.run("Update v2.4 Patch Notes", "Check out the latest changes to the tournament platform and scoring system.", "https://picsum.photos/seed/news2/800/400");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/tournaments", (req, res) => {
    const tournaments = db.prepare("SELECT * FROM tournaments ORDER BY start_time ASC").all();
    res.json(tournaments);
  });

  app.get("/api/news", (req, res) => {
    const news = db.prepare("SELECT * FROM news ORDER BY created_at DESC").all();
    res.json(news);
  });

  app.get("/api/leaderboard", (req, res) => {
    const leaderboard = db.prepare(`
      SELECT u.username, SUM(m.kills) as total_kills, SUM(m.earnings) as total_earnings 
      FROM users u
      JOIN match_results m ON u.id = m.user_id
      GROUP BY u.id
      ORDER BY total_earnings DESC
      LIMIT 10
    `).all();
    res.json(leaderboard);
  });

  app.get("/api/teams", (req, res) => {
    const teams = db.prepare("SELECT * FROM teams").all();
    res.json(teams);
  });

  app.get("/api/user/:id/team", (req, res) => {
    const team = db.prepare("SELECT * FROM teams WHERE leader_id = ?").get(req.params.id);
    res.json(team || null);
  });

  app.post("/api/teams", (req, res) => {
    const { name, tag, leader_id, logo_url } = req.body;
    try {
      const info = db.prepare("INSERT INTO teams (name, tag, leader_id, logo_url) VALUES (?, ?, ?, ?)").run(name, tag, leader_id, logo_url);
      res.json({ id: info.lastInsertRowid, name, tag, leader_id, logo_url });
    } catch (e) {
      res.status(400).json({ error: "Team name already exists" });
    }
  });

  app.get("/api/tournaments/:id", (req, res) => {
    const tournament = db.prepare("SELECT * FROM tournaments WHERE id = ?").get(req.params.id);
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });
    res.json(tournament);
  });

  app.post("/api/register", (req, res) => {
    const { username, email, password, ff_id } = req.body;
    try {
      const info = db.prepare("INSERT INTO users (username, email, password, ff_id, balance) VALUES (?, ?, ?, ?, ?)").run(username, email, password, ff_id, 50); // Give 50 bonus
      res.json({ id: info.lastInsertRowid, username, balance: 50 });
    } catch (e) {
      res.status(400).json({ error: "Username or Email already exists" });
    }
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/join-tournament", (req, res) => {
    const { userId, tournamentId } = req.body;
    
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    const tournament = db.prepare("SELECT * FROM tournaments WHERE id = ?").get(tournamentId) as any;

    if (!user || !tournament) return res.status(404).json({ error: "User or Tournament not found" });
    if (user.balance < tournament.entry_fee) return res.status(400).json({ error: "Insufficient balance" });
    if (tournament.current_players >= tournament.max_players) return res.status(400).json({ error: "Tournament full" });

    const alreadyJoined = db.prepare("SELECT * FROM participants WHERE user_id = ? AND tournament_id = ?").get(userId, tournamentId);
    if (alreadyJoined) return res.status(400).json({ error: "Already joined" });

    const transaction = db.transaction(() => {
      db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(tournament.entry_fee, userId);
      db.prepare("UPDATE tournaments SET current_players = current_players + 1 WHERE id = ?").run(tournamentId);
      db.prepare("INSERT INTO participants (tournament_id, user_id) VALUES (?, ?)").run(tournamentId, userId);
    });

    transaction();
    res.json({ success: true, newBalance: user.balance - tournament.entry_fee });
  });

  app.get("/api/user/:id/tournaments", (req, res) => {
    const tournaments = db.prepare(`
      SELECT t.* FROM tournaments t
      JOIN participants p ON t.id = p.tournament_id
      WHERE p.user_id = ?
    `).all(req.params.id);
    res.json(tournaments);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

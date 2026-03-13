use rusqlite::{Connection, Result};

pub fn init_db(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        PRAGMA journal_mode=WAL;

        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            puuid TEXT NOT NULL UNIQUE,
            summoner_name TEXT NOT NULL,
            region TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS match_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            match_id TEXT NOT NULL,
            champion_id INTEGER NOT NULL,
            mastery_gained INTEGER NOT NULL DEFAULT 0,
            result TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            game_data TEXT,
            FOREIGN KEY (account_id) REFERENCES accounts(id)
        );

        CREATE TABLE IF NOT EXISTS mastery_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            champion_id INTEGER NOT NULL,
            mastery_level INTEGER NOT NULL,
            mastery_points INTEGER NOT NULL,
            snapshot_date TEXT NOT NULL,
            FOREIGN KEY (account_id) REFERENCES accounts(id)
        );

        CREATE TABLE IF NOT EXISTS daily_mastery (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            total_gained INTEGER NOT NULL DEFAULT 0,
            details TEXT,
            FOREIGN KEY (account_id) REFERENCES accounts(id)
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS teams (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            region TEXT NOT NULL,
            members TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL
        );
        ",
    )?;
    Ok(())
}

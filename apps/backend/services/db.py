import sqlite3
import os
from datetime import datetime
from pathlib import Path

DB_PATH = Path(os.path.dirname(__file__)) / ".." / "repoforge.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stats (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            repos INTEGER DEFAULT 0,
            commits INTEGER DEFAULT 0,
            prs INTEGER DEFAULT 0
        )
    ''')
    
    # Initialize stats if empty
    cursor.execute('SELECT COUNT(*) FROM stats')
    if cursor.fetchone()[0] == 0:
        cursor.execute('INSERT INTO stats (id, repos, commits, prs) VALUES (1, 0, 0, 0)')
        
    conn.commit()
    conn.close()

def add_log(action: str, message: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute('INSERT INTO logs (action, message, timestamp) VALUES (?, ?, ?)', (action, message, now))
    
    # Update simple stats based on action
    if action == "create_repo":
        cursor.execute('UPDATE stats SET repos = repos + 1 WHERE id = 1')
    elif action == "delete_repo":
        cursor.execute('UPDATE stats SET repos = MAX(0, repos - 1) WHERE id = 1')
    elif action == "push":
        cursor.execute('UPDATE stats SET commits = commits + 1 WHERE id = 1')
        
    conn.commit()
    conn.close()

def get_logs(limit: int = 20) -> list:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT timestamp, message FROM logs ORDER BY id DESC LIMIT ?', (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [f"[{row[0]}] {row[1]}" for row in rows]

def get_stats() -> dict:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT repos, commits, prs FROM stats WHERE id = 1')
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"repos": row[0], "commits": row[1], "prs": row[2]}
    return {"repos": 0, "commits": 0, "prs": 0}

# Initialize DB when this module is imported
init_db()

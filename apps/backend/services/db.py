import sqlite3
import os
from datetime import datetime
from pathlib import Path

DB_PATH = Path(os.path.dirname(__file__)) / ".." / "repoforge.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Enhanced logs table with user identity and source tracking
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            source TEXT DEFAULT 'cli',
            github_user TEXT DEFAULT 'unknown',
            status TEXT DEFAULT 'success',
            duration_ms INTEGER DEFAULT 0
        )
    ''')
    
    # Add missing columns if upgrading from old schema
    try:
        cursor.execute("ALTER TABLE logs ADD COLUMN source TEXT DEFAULT 'cli'")
    except: pass
    try:
        cursor.execute("ALTER TABLE logs ADD COLUMN github_user TEXT DEFAULT 'unknown'")
    except: pass
    try:
        cursor.execute("ALTER TABLE logs ADD COLUMN status TEXT DEFAULT 'success'")
    except: pass
    try:
        cursor.execute("ALTER TABLE logs ADD COLUMN duration_ms INTEGER DEFAULT 0")
    except: pass

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stats (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            repos INTEGER DEFAULT 0,
            commits INTEGER DEFAULT 0,
            prs INTEGER DEFAULT 0
        )
    ''')
    
    # Sessions table - tracks authenticated users
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            github_user TEXT NOT NULL,
            github_token_hint TEXT,
            login_time TEXT NOT NULL,
            source TEXT DEFAULT 'cli',
            ip_address TEXT DEFAULT 'localhost'
        )
    ''')
    
    # Initialize stats if empty
    cursor.execute('SELECT COUNT(*) FROM stats')
    if cursor.fetchone()[0] == 0:
        cursor.execute('INSERT INTO stats (id, repos, commits, prs) VALUES (1, 0, 0, 0)')
        
    conn.commit()
    conn.close()

def record_session(github_user: str, token: str, source: str = "cli", ip: str = "localhost"):
    """Record when a user authenticates"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    # Only store last 4 chars of token for audit trail, never the full token
    token_hint = f"...{token[-4:]}" if token and len(token) > 4 else "****"
    cursor.execute(
        'INSERT INTO sessions (github_user, github_token_hint, login_time, source, ip_address) VALUES (?, ?, ?, ?, ?)',
        (github_user, token_hint, now, source, ip)
    )
    conn.commit()
    conn.close()

def add_log(action: str, message: str, source: str = "cli", github_user: str = "unknown", 
            status: str = "success", duration_ms: int = 0):
    """Add an audit log entry"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        'INSERT INTO logs (action, message, timestamp, source, github_user, status, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?)',
        (action, message, now, source, github_user, status, duration_ms)
    )
    
    # Update stats based on action
    if action == "create_repo":
        cursor.execute('UPDATE stats SET repos = repos + 1 WHERE id = 1')
    elif action == "delete_repo":
        cursor.execute('UPDATE stats SET repos = MAX(0, repos - 1) WHERE id = 1')
    elif action in ("push", "git_commit"):
        cursor.execute('UPDATE stats SET commits = commits + 1 WHERE id = 1')
    elif action == "pr_create":
        cursor.execute('UPDATE stats SET prs = prs + 1 WHERE id = 1')
        
    conn.commit()
    conn.close()

def get_logs(limit: int = 50) -> list:
    """Get logs as structured dicts for rich display"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        'SELECT id, timestamp, action, message, source, github_user, status FROM logs ORDER BY id DESC LIMIT ?', 
        (limit,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": row[0],
            "timestamp": row[1],
            "action": row[2],
            "message": row[3],
            "source": row[4] or "cli",
            "github_user": row[5] or "unknown",
            "status": row[6] or "success"
        } 
        for row in rows
    ]

def get_stats() -> dict:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT repos, commits, prs FROM stats WHERE id = 1')
    row = cursor.fetchone()
    
    # Also get total log count
    cursor.execute('SELECT COUNT(*) FROM logs')
    total_actions = cursor.fetchone()[0]
    
    conn.close()
    if row:
        return {"repos": row[0], "commits": row[1], "prs": row[2], "total_actions": total_actions}
    return {"repos": 0, "commits": 0, "prs": 0, "total_actions": 0}

# Initialize DB when this module is imported
init_db()

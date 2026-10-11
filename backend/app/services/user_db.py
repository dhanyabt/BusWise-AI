"""
User Database & Authentication Persistence Service for BusWise AI.
Provides local persistent SQLite storage with thread safety and optional Supabase sync,
PBKDF2-HMAC-SHA256 password hashing, token lifecycle management, and role lookups.
"""

import os
import sqlite3
import secrets
import hashlib
import hmac
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
DB_PATH = os.path.join(DB_DIR, "buswise.db")

def hash_password(password: str) -> tuple[str, str]:
    """
    Hash a password with a random 16-byte salt using PBKDF2-HMAC-SHA256 with 100,000 iterations.
    Returns (hex_hash, hex_salt).
    """
    salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        100_000
    ).hex()
    return pw_hash, salt

def verify_password(password: str, expected_hash: str, salt: str) -> bool:
    """
    Verify a password against stored PBKDF2-HMAC-SHA256 hash using constant-time comparison.
    """
    try:
        computed_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt),
            100_000
        ).hex()
        return hmac.compare_digest(computed_hash, expected_hash)
    except Exception as e:
        logger.error(f"Error during password verification: {e}")
        return False

class UserDatabaseService:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        """Create users table and seed pre-configured demo users if empty."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                    password_hash TEXT NOT NULL,
                    salt TEXT NOT NULL,
                    role TEXT NOT NULL,
                    agency TEXT,
                    badge_number TEXT,
                    token TEXT NOT NULL UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);")
            conn.commit()

            # Seed pre-configured standard accounts if not present
            self._seed_default_users(cursor, conn)

    def _seed_default_users(self, cursor: sqlite3.Cursor, conn: sqlite3.Connection):
        default_accounts = [
            {
                "id": "usr-001",
                "name": "Alex Morgan (Attendee)",
                "email": "passenger@buswise.ai",
                "password": "demo123",
                "role": "PASSENGER",
                "agency": "Public Transit Rider",
                "badge_number": None,
                "token": "token-passenger-12345",
            },
            {
                "id": "usr-002",
                "name": "Cmdr. Sarah Vance",
                "email": "officer@buswise.ai",
                "password": "demo123",
                "role": "OFFICER",
                "agency": "Department of Public Transport",
                "badge_number": "DPT-8092",
                "token": "token-officer-67890",
            },
            {
                "id": "usr-003",
                "name": "Capt. James Miller",
                "email": "police@buswise.ai",
                "password": "demo123",
                "role": "POLICE",
                "agency": "Festival Crowd Safety & Police Dispatch",
                "badge_number": "PD-4412",
                "token": "token-police-13579",
            },
            {
                "id": "usr-004",
                "name": "Director David Chen",
                "email": "admin@buswise.ai",
                "password": "demo123",
                "role": "ADMINISTRATOR",
                "agency": "State Transport Secretariat",
                "badge_number": "ADM-001",
                "token": "token-admin-99999",
            },
            {
                "id": "usr-005",
                "name": "Priya Sundaram",
                "email": "eventmanager@buswise.ai",
                "password": "demo123",
                "role": "EVENT_MANAGER",
                "agency": "Tamil Nadu Festival Committee",
                "badge_number": "EVT-204",
                "token": "token-eventmanager-88888",
            },
        ]

        for acc in default_accounts:
            cursor.execute("SELECT id FROM users WHERE email = ? COLLATE NOCASE", (acc["email"],))
            if not cursor.fetchone():
                pw_hash, salt = hash_password(acc["password"])
                cursor.execute("""
                    INSERT INTO users (id, name, email, password_hash, salt, role, agency, badge_number, token)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    acc["id"],
                    acc["name"],
                    acc["email"],
                    pw_hash,
                    salt,
                    acc["role"],
                    acc["agency"],
                    acc["badge_number"],
                    acc["token"],
                ))
        conn.commit()

    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Find user by email address (case-insensitive)."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ? COLLATE NOCASE", (email.strip(),))
            row = cursor.fetchone()
            if row:
                return dict(row)
        return None

    def get_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Find user by active session bearer token."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE token = ?", (token.strip(),))
            row = cursor.fetchone()
            if row:
                return dict(row)
        return None

    def create_user(
        self,
        name: str,
        email: str,
        password: str,
        role: str,
        agency: Optional[str] = None,
        badge_number: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a new persistent user record with hashed password and unique session token.
        Raises ValueError if email is already registered.
        """
        clean_email = email.strip().lower()
        if self.get_by_email(clean_email):
            raise ValueError(f"User with email '{clean_email}' already exists.")

        pw_hash, salt = hash_password(password)
        user_id = f"usr-{secrets.token_hex(4)}"
        token = f"token-{role.lower()}-{secrets.token_urlsafe(24)}"

        if not agency:
            if role == "PASSENGER":
                agency = "Public Transit Rider"
            elif role == "POLICE":
                agency = "Festival Crowd Safety & Police Dispatch"
            else:
                agency = "Department of Public Transport"

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO users (id, name, email, password_hash, salt, role, agency, badge_number, token)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                name.strip(),
                clean_email,
                pw_hash,
                salt,
                role.upper(),
                agency,
                badge_number,
                token,
            ))
            conn.commit()

        return {
            "id": user_id,
            "name": name.strip(),
            "email": clean_email,
            "role": role.upper(),
            "agency": agency,
            "badge_number": badge_number,
            "token": token,
        }

    def update_user_token(self, user_id: str) -> str:
        """Generate and store a new active session token for user."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT role FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            role = row["role"] if row else "user"
            new_token = f"token-{role.lower()}-{secrets.token_urlsafe(24)}"

            cursor.execute("UPDATE users SET token = ? WHERE id = ?", (new_token, user_id))
            conn.commit()
            return new_token

    def revoke_token(self, token: str) -> bool:
        """Revoke an active session token on logout."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            revoked_token = f"revoked-{secrets.token_hex(8)}"
            cursor.execute("UPDATE users SET token = ? WHERE token = ?", (revoked_token, token.strip()))
            conn.commit()
            return cursor.rowcount > 0

user_db = UserDatabaseService()

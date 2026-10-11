"""
BusWise AI - Centralized Persistence Service (SQLite + Supabase fallback)
Provides persistent storage for dynamic fleet records, bus stands, event dataset records,
occurrence passenger counts, and optimization run audit trails.
"""

import os
import sqlite3
import logging
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from backend.app.config import settings
from backend.app.demo_data import (
    DEMO_STOPS,
    DEMO_BUSES,
    DEMO_TRAVEL_TIMES,
    DEMO_FORECAST_ARRIVALS,
    DEMO_SCENARIOS,
)

logger = logging.getLogger(__name__)

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
DB_PATH = os.path.join(DB_DIR, "buswise.db")

class DatabaseService:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        self.is_connected = False
        self.client = None

        if self.supabase_url and self.supabase_key and "your-project" not in self.supabase_url:
            try:
                from supabase import create_client
                self.client = create_client(self.supabase_url, self.supabase_key)
                self.is_connected = True
                logger.info("Connected to Supabase PostgreSQL Database.")
            except Exception as e:
                logger.warning(f"Supabase connection warning: {e}. Operating with local SQLite database.")
                self.is_connected = False

        self._init_sqlite_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite_db(self):
        """Initialize SQLite tables for dynamic fleet, stops, events, and allocations."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # 1. Buses Table (Dynamic Fleet Management)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS buses (
                    id TEXT PRIMARY KEY,
                    bus_number TEXT NOT NULL UNIQUE,
                    capacity INTEGER NOT NULL DEFAULT 60,
                    status TEXT NOT NULL DEFAULT 'AVAILABLE',
                    initial_stop_id TEXT,
                    current_stop_id TEXT,
                    destination_stop_id TEXT,
                    route_id TEXT,
                    assigned_service TEXT,
                    eta_minutes INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # Migrations for existing DB if columns are missing
            for col, col_type in [("destination_stop_id", "TEXT"), ("assigned_service", "TEXT"), ("eta_minutes", "INTEGER")]:
                try:
                    cursor.execute(f"ALTER TABLE buses ADD COLUMN {col} {col_type}")
                except Exception:
                    pass

            # 2. Stops / Bus Stands Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS stops (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    location_lat REAL NOT NULL,
                    location_lng REAL NOT NULL,
                    capacity INTEGER NOT NULL DEFAULT 400,
                    minimum_service_level INTEGER NOT NULL DEFAULT 1,
                    description TEXT,
                    initial_queue INTEGER NOT NULL DEFAULT 0,
                    district TEXT,
                    city_or_town TEXT
                );
            """)

            # 3. Events Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS events (
                    id TEXT PRIMARY KEY,
                    event_name TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    district TEXT,
                    city_or_town TEXT,
                    provenance TEXT DEFAULT 'Dataset-provided — provenance unverified',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # 4. Event Occurrences Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS event_occurrences (
                    id TEXT PRIMARY KEY,
                    event_id TEXT NOT NULL,
                    event_name TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    district TEXT,
                    city_or_town TEXT,
                    event_date TEXT NOT NULL,
                    day_of_week TEXT,
                    event_start_time TEXT,
                    event_end_time TEXT,
                    is_public_holiday INTEGER DEFAULT 0,
                    is_weekend INTEGER DEFAULT 0,
                    expected_attendance INTEGER DEFAULT 0,
                    actual_attendance INTEGER DEFAULT 0,
                    user_observed_attendance INTEGER,
                    event_duration_hours REAL DEFAULT 0,
                    provenance TEXT DEFAULT 'Dataset-provided — provenance unverified',
                    bus_stands_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(event_id) REFERENCES events(id)
                );
            """)

            # 5. Occurrence Bus Stand Linking Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS occurrence_bus_stands (
                    id TEXT PRIMARY KEY,
                    event_occurrence_id TEXT NOT NULL,
                    bus_stand_id TEXT NOT NULL,
                    bus_stand_name TEXT NOT NULL,
                    bus_stand_passenger_count INTEGER DEFAULT 0,
                    FOREIGN KEY(event_occurrence_id) REFERENCES event_occurrences(id),
                    FOREIGN KEY(bus_stand_id) REFERENCES stops(id)
                );
            """)

            # 6. Allocations & Optimization Audit Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS allocations (
                    id TEXT PRIMARY KEY,
                    run_id TEXT,
                    scenario_name TEXT NOT NULL,
                    origin_stop_id TEXT NOT NULL,
                    origin_stop_name TEXT NOT NULL,
                    destination_stop_id TEXT NOT NULL,
                    destination_stop_name TEXT NOT NULL,
                    bus_count INTEGER NOT NULL,
                    dispatch_interval INTEGER NOT NULL,
                    dispatch_time_label TEXT,
                    approval_status TEXT DEFAULT 'PENDING',
                    approved_by TEXT,
                    approved_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # 7. Dataset Metadata Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS dataset_metadata (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    filename TEXT NOT NULL,
                    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    total_rows INTEGER NOT NULL,
                    unique_events INTEGER NOT NULL,
                    unique_occurrences INTEGER NOT NULL,
                    unique_bus_stands INTEGER NOT NULL,
                    provenance TEXT NOT NULL
                );
            """)

            # 8. Manual Crowd Observations Table (Event Manager ground reporting)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS manual_crowd_observations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_id TEXT NOT NULL,
                    occurrence_id TEXT,
                    location TEXT NOT NULL,
                    observed_count INTEGER NOT NULL,
                    observed_at TEXT NOT NULL,
                    reported_by TEXT NOT NULL,
                    notes TEXT,
                    source TEXT DEFAULT 'Ground Observation',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    edited_by TEXT,
                    edited_at TIMESTAMP,
                    audit_trail TEXT,
                    FOREIGN KEY(event_id) REFERENCES events(id)
                );
            """)

            conn.commit()
            
            # Seed initial buses and stops if tables are empty
            self._seed_initial_data(cursor, conn)

    def _seed_initial_data(self, cursor: sqlite3.Cursor, conn: sqlite3.Connection):
        """Seed initial stops and 16 default demo buses into SQLite if empty."""
        cursor.execute("SELECT COUNT(*) FROM stops")
        if cursor.fetchone()[0] == 0:
            for s in DEMO_STOPS:
                cursor.execute("""
                    INSERT INTO stops (id, name, location_lat, location_lng, capacity, minimum_service_level, description, initial_queue, district, city_or_town)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    s["id"], s["name"], s["location_lat"], s["location_lng"],
                    s["capacity"], s["minimum_service_level"], s["description"],
                    s["initial_queue"], "Chennai", "Chennai"
                ))

        cursor.execute("SELECT COUNT(*) FROM buses")
        if cursor.fetchone()[0] == 0:
            for b in DEMO_BUSES:
                cursor.execute("""
                    INSERT INTO buses (id, bus_number, capacity, status, initial_stop_id, current_stop_id, destination_stop_id, route_id, assigned_service, eta_minutes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    b["id"], b["bus_number"], b["capacity"], b["status"],
                    b.get("initial_stop_id"), b.get("current_stop_id"),
                    b.get("destination_stop_id"), b.get("route_id"),
                    b.get("assigned_service"), b.get("eta_minutes")
                ))
        conn.commit()

    def reset_demo_fleet(self) -> List[Dict[str, Any]]:
        """Reset fleet to initial 16 demo buses distribution (4 CMBT, 2 Mylapore, 3 Central, 7 T. Nagar)."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM buses")
            for b in DEMO_BUSES:
                cursor.execute("""
                    INSERT INTO buses (id, bus_number, capacity, status, initial_stop_id, current_stop_id, destination_stop_id, route_id, assigned_service, eta_minutes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    b["id"], b["bus_number"], b["capacity"], b["status"],
                    b.get("initial_stop_id"), b.get("current_stop_id"),
                    b.get("destination_stop_id"), b.get("route_id"),
                    b.get("assigned_service"), b.get("eta_minutes")
                ))
            cursor.execute("DELETE FROM allocations")
            conn.commit()
        return self.get_buses()

    # ------------------ STOPS ------------------
    def get_stops(self) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM stops ORDER BY id")
            rows = cursor.fetchall()
            if rows:
                return [dict(r) for r in rows]
        return DEMO_STOPS

    # ------------------ DYNAMIC FLEET MANAGEMENT ------------------
    def get_buses(self, include_deactivated: bool = True) -> List[Dict[str, Any]]:
        """Retrieve registered fleet records from SQLite persistent store."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if include_deactivated:
                cursor.execute("SELECT * FROM buses ORDER BY id")
            else:
                cursor.execute("SELECT * FROM buses WHERE status != 'DEACTIVATED' ORDER BY id")
            rows = cursor.fetchall()
            if rows:
                return [dict(r) for r in rows]
        return DEMO_BUSES

    def get_bus_by_id(self, bus_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM buses WHERE id = ? OR bus_number = ?", (bus_id, bus_id))
            row = cursor.fetchone()
            if row:
                return dict(row)
        return None

    def add_bus(
        self,
        bus_number: str,
        capacity: int = 60,
        status: str = "AVAILABLE",
        initial_stop_id: Optional[str] = "STOP-001",
        route_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Add a new bus to the registered fleet in SQLite."""
        clean_num = bus_number.strip().upper()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM buses WHERE bus_number = ?", (clean_num,))
            if cursor.fetchone():
                raise ValueError(f"Bus with registration '{clean_num}' already exists.")

            # Generate next bus_id
            cursor.execute("SELECT COUNT(*) FROM buses")
            count = cursor.fetchone()[0] + 1
            new_id = f"BUS-{count:03d}"
            # Ensure uniqueness
            while True:
                cursor.execute("SELECT id FROM buses WHERE id = ?", (new_id,))
                if not cursor.fetchone():
                    break
                count += 1
                new_id = f"BUS-{count:03d}"

            now = datetime.now(timezone.utc).isoformat()
            cursor.execute("""
                INSERT INTO buses (id, bus_number, capacity, status, initial_stop_id, current_stop_id, route_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (new_id, clean_num, capacity, status.upper(), initial_stop_id, initial_stop_id, route_id, now, now))
            conn.commit()

        return self.get_bus_by_id(new_id)

    def update_bus(
        self,
        bus_id: str,
        bus_number: Optional[str] = None,
        capacity: Optional[int] = None,
        status: Optional[str] = None,
        current_stop_id: Optional[str] = None,
        destination_stop_id: Optional[str] = None,
        route_id: Optional[str] = None,
        assigned_service: Optional[str] = None,
        eta_minutes: Optional[int] = None
    ) -> Dict[str, Any]:
        """Update existing registered bus record."""
        existing = self.get_bus_by_id(bus_id)
        if not existing:
            raise ValueError(f"Bus '{bus_id}' not found.")

        updates = []
        params = []
        if bus_number:
            updates.append("bus_number = ?")
            params.append(bus_number.strip().upper())
        if capacity is not None:
            updates.append("capacity = ?")
            params.append(capacity)
        if status:
            updates.append("status = ?")
            params.append(status.upper())
        if current_stop_id is not None:
            updates.append("current_stop_id = ?")
            params.append(current_stop_id if current_stop_id != "" else None)
        if destination_stop_id is not None:
            updates.append("destination_stop_id = ?")
            params.append(destination_stop_id if destination_stop_id != "" else None)
        if route_id is not None:
            updates.append("route_id = ?")
            params.append(route_id if route_id != "" else None)
        if assigned_service is not None:
            updates.append("assigned_service = ?")
            params.append(assigned_service if assigned_service != "" else None)
        if eta_minutes is not None:
            updates.append("eta_minutes = ?")
            params.append(eta_minutes)

        updates.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(existing["id"])

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"UPDATE buses SET {', '.join(updates)} WHERE id = ?", params)
            conn.commit()

        return self.get_bus_by_id(existing["id"])

    def set_bus_active_status(self, bus_id: str, active: bool) -> Dict[str, Any]:
        """Deactivate or reactivate a bus while preserving historical audit record."""
        status = "AVAILABLE" if active else "DEACTIVATED"
        return self.update_bus(bus_id, status=status)

    # ------------------ TRAVEL TIMES & MATRIX ------------------
    def get_travel_times(self) -> Dict[tuple, Dict[str, int]]:
        return DEMO_TRAVEL_TIMES

    # ------------------ ALLOCATIONS & OPTIMIZATION AUDIT ------------------
    def save_optimization_run(self, run_data: Dict[str, Any], transfers: List[Dict[str, Any]]) -> bool:
        run_id = run_data.get("run_id") or f"run-{int(datetime.now(timezone.utc).timestamp())}"
        scenario = run_data.get("scenario_name", "custom")
        now = datetime.now(timezone.utc).isoformat()

        with self._get_connection() as conn:
            cursor = conn.cursor()
            for idx, t in enumerate(transfers):
                alloc_id = f"alloc-{run_id}-{idx+1}"
                cursor.execute("""
                    INSERT INTO allocations (id, run_id, scenario_name, origin_stop_id, origin_stop_name, destination_stop_id, destination_stop_name, bus_count, dispatch_interval, dispatch_time_label, approval_status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    alloc_id,
                    run_id,
                    scenario,
                    t["origin_stop_id"],
                    t.get("origin_stop_name", t["origin_stop_id"]),
                    t["destination_stop_id"],
                    t.get("destination_stop_name", t["destination_stop_id"]),
                    t["bus_count"],
                    t.get("dispatch_interval", 0),
                    t.get("dispatch_time_label", "T0"),
                    "PROPOSED",
                    now
                ))
            conn.commit()
        return True

    def get_allocations(self) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM allocations ORDER BY created_at DESC LIMIT 100")
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    # ------------------ MANUAL CROWD OBSERVATIONS ------------------
    def add_crowd_observation(
        self,
        event_id: str,
        location: str,
        observed_count: int,
        observed_at: str,
        reported_by: str,
        occurrence_id: Optional[str] = None,
        notes: Optional[str] = None,
        source: Optional[str] = "Ground Observation"
    ) -> Dict[str, Any]:
        if observed_count < 0:
            raise ValueError("Observed crowd count cannot be negative.")
        if not event_id or not location or not reported_by:
            raise ValueError("event_id, location, and reported_by are required.")

        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO manual_crowd_observations (
                    event_id, occurrence_id, location, observed_count, observed_at, reported_by, notes, source, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (event_id, occurrence_id, location, observed_count, observed_at, reported_by, notes, source, now))
            conn.commit()
            obs_id = cursor.lastrowid
            
            # Also update user_observed_attendance on occurrence if occurrence_id provided
            if occurrence_id:
                cursor.execute("""
                    UPDATE event_occurrences SET user_observed_attendance = ? WHERE id = ?
                """, (observed_count, occurrence_id))
                conn.commit()

        return self.get_crowd_observation_by_id(obs_id)

    def get_crowd_observations(self, event_id: Optional[str] = None, location: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            query = "SELECT * FROM manual_crowd_observations"
            params = []
            conditions = []
            if event_id:
                conditions.append("event_id = ?")
                params.append(event_id)
            if location:
                conditions.append("location = ?")
                params.append(location)
            if conditions:
                query += " WHERE " + " AND ".join(conditions)
            query += " ORDER BY observed_at DESC, id DESC LIMIT ?"
            params.append(limit)
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            res = []
            for r in rows:
                item = dict(r)
                if item.get("audit_trail"):
                    try:
                        item["audit_trail"] = json.loads(item["audit_trail"])
                    except Exception:
                        pass
                res.append(item)
            return res

    def get_crowd_observation_by_id(self, obs_id: int) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM manual_crowd_observations WHERE id = ?", (obs_id,))
            row = cursor.fetchone()
            if row:
                item = dict(row)
                if item.get("audit_trail"):
                    try:
                        item["audit_trail"] = json.loads(item["audit_trail"])
                    except Exception:
                        pass
                return item
        return None

    def update_crowd_observation(
        self,
        obs_id: int,
        observed_count: Optional[int] = None,
        location: Optional[str] = None,
        observed_at: Optional[str] = None,
        notes: Optional[str] = None,
        source: Optional[str] = None,
        edited_by: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        existing = self.get_crowd_observation_by_id(obs_id)
        if not existing:
            return None

        if observed_count is not None and observed_count < 0:
            raise ValueError("Observed crowd count cannot be negative.")

        now = datetime.now(timezone.utc).isoformat()
        
        # Build audit trail entry
        prev_audit = existing.get("audit_trail") or []
        if isinstance(prev_audit, str):
            try:
                prev_audit = json.loads(prev_audit)
            except Exception:
                prev_audit = []

        audit_entry = {
            "edited_at": now,
            "edited_by": edited_by or "system",
            "previous_values": {
                "observed_count": existing["observed_count"],
                "location": existing["location"],
                "observed_at": existing["observed_at"],
                "notes": existing.get("notes"),
                "source": existing.get("source")
            }
        }
        updated_audit = prev_audit + [audit_entry]

        new_count = observed_count if observed_count is not None else existing["observed_count"]
        new_loc = location if location is not None else existing["location"]
        new_at = observed_at if observed_at is not None else existing["observed_at"]
        new_notes = notes if notes is not None else existing.get("notes")
        new_source = source if source is not None else existing.get("source")

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE manual_crowd_observations
                SET observed_count = ?, location = ?, observed_at = ?, notes = ?, source = ?, edited_by = ?, edited_at = ?, audit_trail = ?
                WHERE id = ?
            """, (new_count, new_loc, new_at, new_notes, new_source, edited_by, now, json.dumps(updated_audit), obs_id))
            conn.commit()

        return self.get_crowd_observation_by_id(obs_id)

    def delete_crowd_observation(self, obs_id: int) -> bool:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM manual_crowd_observations WHERE id = ?", (obs_id,))
            conn.commit()
            return cursor.rowcount > 0

    def get_latest_crowd_observation(self, event_id: Optional[str] = None, location: Optional[str] = None) -> Optional[Dict[str, Any]]:
        obs = self.get_crowd_observations(event_id=event_id, location=location, limit=1)
        if obs:
            return obs[0]
        return None

db_service = DatabaseService()

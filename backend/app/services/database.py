"""
Supabase Database Service Layer
Supports live Supabase client operations when credentials are present in environment variables.
Provides local in-memory fallback for seamless local development and demo execution.
"""

import os
import logging
from typing import Dict, List, Any, Optional
from backend.app.config import settings
from backend.app.demo_data import (
    DEMO_STOPS,
    DEMO_BUSES,
    DEMO_TRAVEL_TIMES,
    DEMO_FORECAST_ARRIVALS,
    DEMO_SCENARIOS,
)

logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        self.is_connected = False
        self.client = None

        if self.supabase_url and self.supabase_key and "your-project" not in self.supabase_url:
            try:
                # Optional supabase library import
                from supabase import create_client
                self.client = create_client(self.supabase_url, self.supabase_key)
                self.is_connected = True
                logger.info("Successfully connected to Supabase PostgreSQL Database.")
            except Exception as e:
                logger.warning(f"Could not connect to Supabase: {e}. Falling back to in-memory demo data.")
                self.is_connected = False

    def get_stops(self) -> List[Dict[str, Any]]:
        if self.is_connected and self.client:
            try:
                res = self.client.table("stops").select("*").execute()
                if res.data:
                    return res.data
            except Exception as e:
                logger.error(f"Error fetching stops from Supabase: {e}")
        return DEMO_STOPS

    def get_buses(self) -> List[Dict[str, Any]]:
        if self.is_connected and self.client:
            try:
                res = self.client.table("buses").select("*").execute()
                if res.data:
                    return res.data
            except Exception as e:
                logger.error(f"Error fetching buses from Supabase: {e}")
        return DEMO_BUSES

    def get_travel_times(self) -> Dict[tuple, Dict[str, int]]:
        if self.is_connected and self.client:
            try:
                res = self.client.table("travel_times").select("*").execute()
                if res.data:
                    matrix = {}
                    for row in res.data:
                        matrix[(row["origin_stop_id"], row["destination_stop_id"])] = {
                            "minutes": row["travel_time_minutes"],
                            "intervals": row["interval_duration"]
                        }
                    return matrix
            except Exception as e:
                logger.error(f"Error fetching travel times from Supabase: {e}")
        return DEMO_TRAVEL_TIMES

    def save_optimization_run(self, run_data: Dict[str, Any], transfers: List[Dict[str, Any]]) -> bool:
        if self.is_connected and self.client:
            try:
                run_res = self.client.table("optimization_runs").insert(run_data).execute()
                if run_res.data and len(run_res.data) > 0:
                    run_id = run_res.data[0]["id"]
                    for t in transfers:
                        t["run_id"] = run_id
                    self.client.table("optimization_transfers").insert(transfers).execute()
                    return True
            except Exception as e:
                logger.error(f"Error persisting optimization run to Supabase: {e}")
        return False

db_service = DatabaseService()

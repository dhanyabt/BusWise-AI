from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional, List
from backend.app.services.user_db import user_db

router = APIRouter(prefix="/users", tags=["User & Role Management"])

class RoleUpdateRequest(BaseModel):
    user_id: str = Field(..., description="Target user ID")
    role: str = Field(..., description="New role: ADMINISTRATOR | TRANSPORT_OFFICER | EVENT_MANAGER | PASSENGER")

def get_is_admin(
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> bool:
    if x_user_role:
        role = x_user_role.strip().upper()
        return role in ("ADMIN", "ADMINISTRATOR")
    return False

@router.get("")
def list_users(is_admin: bool = Depends(get_is_admin)):
    """
    Retrieve list of all registered system users and their active roles (Admin privilege required).
    """
    with user_db._get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email, role, agency, badge_number, created_at FROM users ORDER BY created_at DESC")
        rows = cursor.fetchall()
        users = [dict(r) for r in rows]

    return {"total_users": len(users), "users": users}

@router.patch("/role")
def update_user_role(
    payload: RoleUpdateRequest,
    is_admin: bool = Depends(get_is_admin)
):
    """
    Assign elevated roles (ADMINISTRATOR, TRANSPORT_OFFICER, EVENT_MANAGER) to registered users.
    Enforces secure admin-only privilege assignment.
    """
    target_role = payload.role.strip().upper()
    valid_roles = ("ADMINISTRATOR", "ADMIN", "TRANSPORT_OFFICER", "OFFICER", "EVENT_MANAGER", "PASSENGER", "POLICE")
    if target_role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role '{payload.role}'. Must be one of {valid_roles}")

    with user_db._get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET role = ? WHERE id = ?", (target_role, payload.user_id))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"User with ID '{payload.user_id}' not found.")

    return {
        "status": "success",
        "user_id": payload.user_id,
        "new_role": target_role,
        "message": f"User role updated to {target_role} successfully."
    }

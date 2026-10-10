from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_login_officer():
    response = client.post("/api/auth/login", json={"email": "officer@buswise.ai", "password": "demo123", "role": "OFFICER"})
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "OFFICER"
    assert data["email"] == "officer@buswise.ai"
    assert data["badge_number"] == "DPT-8092"
    assert "token" in data

def test_login_passenger():
    response = client.post("/api/auth/login", json={"email": "passenger@buswise.ai", "password": "demo123", "role": "PASSENGER"})
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "PASSENGER"
    assert data["badge_number"] is None

def test_login_police():
    response = client.post("/api/auth/login", json={"email": "police@buswise.ai", "password": "demo123", "role": "POLICE"})
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "POLICE"
    assert data["agency"] == "Festival Crowd Safety & Police Dispatch"

def test_login_invalid_password():
    response = client.post("/api/auth/login", json={"email": "officer@buswise.ai", "password": "wrongpassword123"})
    assert response.status_code == 401
    assert "invalid email or password" in response.json()["detail"].lower()

def test_login_nonexistent_user():
    response = client.post("/api/auth/login", json={"email": "doesnotexist@example.com", "password": "demo123"})
    assert response.status_code == 401
    assert "invalid email or password" in response.json()["detail"].lower()

def test_login_mismatched_role():
    # Attempting to log in as OFFICER with a PASSENGER account
    response = client.post("/api/auth/login", json={"email": "passenger@buswise.ai", "password": "demo123", "role": "OFFICER"})
    assert response.status_code == 403
    assert "cannot log in as" in response.json()["detail"].lower()

def test_register_new_account_and_login():
    import uuid
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    
    # 1. Register new user
    reg_response = client.post("/api/auth/register", json={
        "name": "Priya Sharma",
        "email": unique_email,
        "password": "SecurePassword99!",
        "role": "PASSENGER"
    })
    assert reg_response.status_code == 200
    reg_data = reg_response.json()
    assert reg_data["name"] == "Priya Sharma"
    assert reg_data["email"] == unique_email
    assert reg_data["role"] == "PASSENGER"
    assert "password" not in reg_data
    assert "password_hash" not in reg_data
    assert "token" in reg_data
    token = reg_data["token"]

    # 2. Check /api/auth/me with the issued token
    me_response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == unique_email

    # 3. Log in with the newly registered credentials
    login_response = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "SecurePassword99!",
        "role": "PASSENGER"
    })
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert login_data["email"] == unique_email

def test_register_duplicate_email():
    # Attempting to register an already existing email
    response = client.post("/api/auth/register", json={
        "name": "Duplicate Sarah",
        "email": "officer@buswise.ai",
        "password": "anotherpassword",
        "role": "OFFICER"
    })
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"].lower()

def test_register_invalid_email():
    response = client.post("/api/auth/register", json={
        "name": "Invalid Email User",
        "email": "notanemail",
        "password": "validpassword",
        "role": "PASSENGER"
    })
    assert response.status_code == 400
    assert "invalid email format" in response.json()["detail"].lower()

def test_passenger_forbidden_from_optimization():
    response = client.post(
        "/api/optimize",
        json={"scenario_name": "baseline", "demand_multiplier": 1.0},
        headers={"Authorization": "Bearer token-passenger-12345"}
    )
    assert response.status_code == 403
    assert "not authorized" in response.json()["detail"].lower()

def test_officer_allowed_optimization():
    response = client.post(
        "/api/optimize",
        json={"scenario_name": "baseline", "demand_multiplier": 1.0},
        headers={"Authorization": "Bearer token-officer-67890"}
    )
    assert response.status_code == 200

def test_logout():
    response = client.post(
        "/api/auth/logout",
        headers={"Authorization": "Bearer token-officer-67890"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "success"

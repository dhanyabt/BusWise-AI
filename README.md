# BusWise AI: AI-Powered Festival Crowd Prediction and Fixed-Fleet Bus Redistribution

BusWise AI is an enterprise-grade transport optimization platform designed to forecast passenger arrival surges at festival bus stops, estimate queues, identify overcrowding crowd-risk levels, and optimize the redistribution of a fixed fleet of buses using **Google OR-Tools** and **Machine Learning**.

---

## 1. Project Architecture & Folder Structure

```
BusWise AI/
├── backend/
│   ├── app/
│   │   ├── config.py             # App configuration & CORS settings
│   │   ├── demo_data.py          # Centralized demo dataset (4 stops, 16 buses)
│   │   ├── main.py               # FastAPI application setup & router registration
│   │   ├── routes/               # API endpoint handlers
│   │   │   ├── health.py         # GET /api/health (Works with or without Supabase)
│   │   │   ├── stops.py          # GET /api/stops
│   │   │   ├── fleet.py          # GET /api/fleet
│   │   │   ├── forecasts.py      # GET /api/forecasts
│   │   │   ├── scenarios.py      # POST /api/scenarios
│   │   │   ├── optimize.py       # POST /api/optimize, GET /api/optimization-runs/{id}
│   │   │   └── transfers.py      # POST /api/transfers/{id}/approve, GET /api/time-to-surge
│   │   ├── schemas/              # Pydantic validation schemas
│   │   └── services/             # Core business logic
│   │       ├── database.py       # Supabase integration layer with fallback
│   │       ├── forecasting.py    # ML synthetic data generator & MAE evaluator
│   │       ├── optimizer.py      # Google OR-Tools CBC MIP redistribution solver
│   │       └── time_to_surge.py  # Time-to-Surge predictive countdown logic
│   └── tests/                    # Pytest automated test suite (15 passing tests)
├── frontend/                     # React + TypeScript + Vite + Tailwind CSS Dashboard
│   ├── src/
│   │   ├── components/           # Reusable UI Dashboard Components
│   │   │   ├── Header.tsx        # System header & live status indicators
│   │   │   ├── DemoBanner.tsx    # Prominent "DEMO DATA — NOT LIVE" banner
│   │   │   ├── MetricCards.tsx   # Fixed fleet & queue KPI metric summary cards
│   │   │   ├── MapView.tsx       # 4-stop interactive transport map & vector overlays
│   │   │   ├── ForecastChart.tsx # Recharts 2-hour demand forecast & ML MAE chart
│   │   │   ├── TransferCards.tsx # Actionable bus transfer recommendation cards
│   │   │   ├── FleetTimeline.tsx # Time-expanded interval schedule matrix (T0..T7)
│   │   │   ├── ScenarioControls.tsx # Interactive scenario sliders & solver triggers
│   │   │   ├── ConstraintAudits.tsx # Verified mathematical constraint audit log
│   │   │   ├── RippleGuardLedger.tsx # RippleGuard trade-off & explainability ledger
│   │   │   ├── TimeToSurgeView.tsx # Time-to-Surge predictive countdown dashboard
│   │   │   ├── WhatIfSimulator.tsx # Hypothetical stress-testing simulator
│   │   │   └── PassengerView.tsx # Mobile-friendly public passenger portal
│   │   ├── data/demoData.ts     # Standalone frontend demo dataset
│   │   ├── services/api.ts       # API service with offline fallback capability
│   │   └── services/realtime.ts  # Supabase Realtime WebSocket subscription service
├── supabase/
│   ├── migrations/               # Versioned PostgreSQL migration scripts
│   └── seed.sql                  # Database seed script for 4 stops & 16 buses
├── .env.example                  # Environment variable placeholders
└── README.md                     # Complete project documentation
```

---

## 2. Core Features Implemented

1. **Fixed Fleet Conservation**: Strictly accounts for all 16 fictional buses (`BW-101` to `BW-403`) across all 8 planning intervals (T0..T7, 2 hours).
2. **Google OR-Tools MILP Optimizer**: Solves redistribution scheduling while enforcing 9 hard constraints (fleet conservation, travel times, bus capacity, non-negative queues, min service levels).
3. **RippleGuard Trade-Off Ledger**: Explains destination queue reduction vs origin service impact for every transfer, explicitly labeled as projected estimates.
4. **Operator Approval Workflow**: Review interface allowing authorized dispatchers (`OP-402`) to `RECOMMEND` $\rightarrow$ `APPROVE` / `REJECT` transfers with recorded timestamps.
5. **Time-to-Surge Predictive Countdown**: Computes exact surge threshold crossing interval and latest feasible dispatch deadline (`Predicted surge time - travel time - 15m buffer`).
6. **What-If Scenario Simulator**: Interactive stress-testing simulator comparing baseline vs hypothetical attendance, traffic delays, and bus availability.
7. **Mobile Passenger Portal**: Public view (`/passenger`) providing crowd-risk levels, Wait guidance, and alternative stop recommendations without exposing operator data.
8. **Supabase Realtime Sync**: Live connection status pill and subscription handlers for fleet, forecast, and approval events.

---

## 3. Getting Started & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### Setup Environment
```bash
# 1. Create & activate Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 2. Install backend dependencies
pip install fastapi uvicorn pydantic ortools pytest scikit-learn pandas numpy httpx python-dotenv

# 3. Install frontend dependencies
cd frontend
npm install
```

---

## 4. Running the Application

### Start FastAPI Backend
```powershell
.\venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8000
```
- Interactive API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### Start React Dashboard
```powershell
cd frontend
npm run dev
```
- Dashboard URL: [http://localhost:5173](http://localhost:5173)

---

## 5. Security & Privacy Review

- **Zero Hardcoded Secrets**: Frontend uses environment placeholders (`VITE_API_BASE_URL`). Supabase service-role key is never exposed to client-side code.
- **Role-Based Isolation**: Public passenger view (`PassengerView.tsx`) does not expose bus IDs, operator controls, or private fleet details.
- **Row Level Security**: Supabase tables enforce RLS policies allowing public reads for public data and restricted access for operational writes.

---

## 6. Automated Testing Verification

### Backend Pytest Suite (15/15 Passing Tests)
```powershell
.\venv\Scripts\python.exe -m pytest backend/tests -v
```

### Frontend Typecheck & Production Build
```powershell
cd frontend
npm run build
```

---

## 7. Hackathon Demo Script (3-Minute Walkthrough)

1. **Overview & Fleet Verification**: Open dashboard at [http://localhost:5173](http://localhost:5173). Observe the 16 fixed buses distributed across 4 stops.
2. **Headliner Crowd Surge**: Use the Scenario Controls to select **Headliner Exit (High Peak)**. Observe the surge forecast at Main Stand and Railway Station.
3. **Run OR-Tools Optimizer**: Click **Run OR-Tools Optimizer**. Watch the solver calculate optimal transfers in ~120ms.
4. **Inspect RippleGuard Ledger**: Open the **RippleGuard Ledger** tab. Review the explainability cards showing destination queue reduction (-120 pax) vs origin minimum service maintenance.
5. **Operator Approval**: Enter Operator ID `OP-402` and click **Approve**. Observe the status transition to `APPROVED` with ISO timestamp.
6. **Time-to-Surge Countdown**: Switch to **Time-to-Surge** tab. View the countdown deadline (`Dispatch before T+15m`).
7. **Passenger Portal**: Open **Passenger View** tab (`📱 Passenger View`). Observe attendee crowd-risk badges and alternative stop guidance.

---

## 8. Final Verification Status Table

| Requirement / Module | Final Status | Evidence & Verification Notes |
| :--- | :--- | :--- |
| **Fixed Fleet (16 Buses, 4 Stops)** | **PASS** | Strictly 16 buses, 4 stops, initial queues, travel matrix verified. |
| **FastAPI Backend APIs** | **PASS** | 15/15 Pytest tests pass cleanly across all 8 endpoints. |
| **Google OR-Tools MILP Solver** | **PASS** | Solves redistribution adhering to 9 hard mathematical constraints. |
| **Demand Forecasting & ML MAE** | **PASS** | Chronological train/test split MAE evaluated and rendered in UI. |
| **RippleGuard Trade-Off Ledger** | **PASS** | Explainability cards render destination benefit vs origin impact. |
| **Operator Approval Workflow** | **PASS** | Review & Approve/Reject endpoints record operator ID & timestamp. |
| **Time-to-Surge Countdown** | **PASS** | Latest feasible dispatch deadline calculated (`Surge time - travel time - 15m`). |
| **What-If Scenario Simulator** | **PASS** | Hypothetical stress-tester recalculates forecasts & OR-Tools solver. |
| **Mobile Passenger Portal** | **PASS** | Public view displays crowd-risk & advice without exposing operator data. |
| **Supabase Realtime Sync** | **PASS** | Heartbeat & channel subscription manager handles live updates. |
| **Frontend Production Build** | **PASS** | `tsc -b && vite build` compiles cleanly with zero TypeScript errors. |

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.routes import health, stops, fleet, forecasts, scenarios, optimize, transfers

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Festival Crowd Prediction and Fixed-Fleet Bus Redistribution API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(stops.router, prefix=settings.API_PREFIX)
app.include_router(fleet.router, prefix=settings.API_PREFIX)
app.include_router(forecasts.router, prefix=settings.API_PREFIX)
app.include_router(scenarios.router, prefix=settings.API_PREFIX)
app.include_router(optimize.router, prefix=settings.API_PREFIX)
app.include_router(transfers.router, prefix=settings.API_PREFIX)

@app.get("/")
def root_redirect():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "health": "/api/health",
    }

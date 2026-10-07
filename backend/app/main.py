import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.app.api.asset_routes import router as asset_router
    from backend.app.api.portfolio_routes import router as portfolio_router
    from backend.app.api.market_routes import router as market_router
    from backend.app.api.trading_routes import router as trading_router
    from backend.app.config import settings
except ImportError as e:
    import traceback
    traceback.print_exc()
    from app.api.asset_routes import router as asset_router
    from app.api.portfolio_routes import router as portfolio_router
    from app.api.market_routes import router as market_router
    from app.api.trading_routes import router as trading_router
    from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("simpleinvest")

app = FastAPI(
    title="SimpleInvest Core Engine API",
    description=(
        "Zero-cost financial analytics platform translating complex stock and portfolio metrics "
        "into plain-English, jargon-free explanations using Groq (Llama 3.1) and real-time yfinance market data."
    ),
    version="1.0.0",
)

# Enable CORS for frontend origins (* for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(asset_router)
app.include_router(portfolio_router)
app.include_router(market_router)
app.include_router(trading_router)


@app.get("/", tags=["Health"])
async def root():
    """
    Root endpoint returning service identity and status.
    """
    return {
        "service": "SimpleInvest Core Engine",
        "status": "online",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "healthy"}

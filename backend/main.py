from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from api.limiter import limiter
from api.routes import auth, leaderboard, rooms, users
from config import get_settings
from models.schemas import HealthResponse
from storage.factory import get_storage_provider
from utils.logging import setup_logging
from websocket.handler import handle_websocket


settings = get_settings()
setup_logging(settings.debug) # Local 
app = FastAPI(title=settings.app_name, version="1.0.0", docs_url="/api/v1/docs", openapi_url="/api/v1/openapi.json")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(leaderboard.router, prefix="/api/v1")
app.include_router(rooms.router, prefix="/api/v1")


@app.get("/api/v1/health", response_model=HealthResponse)
def health():
    storage = get_storage_provider()
    return HealthResponse(status="ok", storage_backend=storage.backend_name)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # #region agent log
    print("=" * 60)
    print("STEP 0: ENTER websocket_endpoint")
    print("STEP 1: CALLING handle_websocket")
    await handle_websocket(websocket)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=settings.debug)

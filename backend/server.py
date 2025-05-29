from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import httpx
import json
import uuid
import asyncio
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SYNC Cross-Chain API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.sync_db

# WebSocket manager for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# Pydantic models
class Token(BaseModel):
    symbol: str
    name: str
    address: str
    decimals: int
    chain_id: str
    logo_url: Optional[str] = None
    price_usd: Optional[float] = None

class Chain(BaseModel):
    id: str
    name: str
    rpc_url: str
    chain_id: int
    currency_symbol: str
    explorer_url: str
    logo_url: Optional[str] = None

class SwapQuote(BaseModel):
    from_token: Token
    to_token: Token
    from_amount: str
    to_amount: str
    route: List[Dict[str, Any]]
    estimated_gas: str
    slippage: float
    price_impact: float
    execution_time: int
    bridge_fees: Optional[str] = None

class SwapRequest(BaseModel):
    from_chain: str
    to_chain: str
    from_token: str
    to_token: str
    amount: str
    slippage: float = 0.5
    user_address: str

class Portfolio(BaseModel):
    user_address: str
    chains: Dict[str, Dict[str, Any]]
    total_usd: float
    last_updated: datetime

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_address: str
    from_chain: str
    to_chain: str
    from_token: str
    to_token: str
    from_amount: str
    to_amount: str
    status: str  # pending, completed, failed
    tx_hash: Optional[str] = None
    bridge_tx_hash: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

# Supported chains configuration
SUPPORTED_CHAINS = {
    "ethereum": Chain(
        id="ethereum",
        name="Ethereum",
        rpc_url="https://mainnet.infura.io/v3/",
        chain_id=1,
        currency_symbol="ETH",
        explorer_url="https://etherscan.io",
        logo_url="https://cryptologos.cc/logos/ethereum-eth-logo.png"
    ),
    "polygon": Chain(
        id="polygon",
        name="Polygon",
        rpc_url="https://polygon-rpc.com/",
        chain_id=137,
        currency_symbol="MATIC",
        explorer_url="https://polygonscan.com",
        logo_url="https://cryptologos.cc/logos/polygon-matic-logo.png"
    ),
    "arbitrum": Chain(
        id="arbitrum",
        name="Arbitrum",
        rpc_url="https://arb1.arbitrum.io/rpc",
        chain_id=42161,
        currency_symbol="ETH",
        explorer_url="https://arbiscan.io",
        logo_url="https://cryptologos.cc/logos/arbitrum-arb-logo.png"
    ),
    "optimism": Chain(
        id="optimism",
        name="Optimism",
        rpc_url="https://mainnet.optimism.io",
        chain_id=10,
        currency_symbol="ETH",
        explorer_url="https://optimistic.etherscan.io",
        logo_url="https://cryptologos.cc/logos/optimism-ethereum-op-logo.png"
    ),
    "bsc": Chain(
        id="bsc",
        name="BNB Smart Chain",
        rpc_url="https://bsc-dataseed.binance.org/",
        chain_id=56,
        currency_symbol="BNB",
        explorer_url="https://bscscan.com",
        logo_url="https://cryptologos.cc/logos/bnb-bnb-logo.png"
    ),
    "fantom": Chain(
        id="fantom",
        name="Fantom",
        rpc_url="https://rpc.ftm.tools/",
        chain_id=250,
        currency_symbol="FTM",
        explorer_url="https://ftmscan.com",
        logo_url="https://cryptologos.cc/logos/fantom-ftm-logo.png"
    ),
    "avalanche": Chain(
        id="avalanche",
        name="Avalanche",
        rpc_url="https://api.avax.network/ext/bc/C/rpc",
        chain_id=43114,
        currency_symbol="AVAX",
        explorer_url="https://snowtrace.io",
        logo_url="https://cryptologos.cc/logos/avalanche-avax-logo.png"
    ),
    "solana": Chain(
        id="solana",
        name="Solana",
        rpc_url="https://api.mainnet-beta.solana.com",
        chain_id=101,
        currency_symbol="SOL",
        explorer_url="https://explorer.solana.com",
        logo_url="https://cryptologos.cc/logos/solana-sol-logo.png"
    )
}

# Sample popular tokens
POPULAR_TOKENS = {
    "ethereum": [
        Token(symbol="ETH", name="Ethereum", address="0x0000000000000000000000000000000000000000", decimals=18, chain_id="ethereum", price_usd=3000.0),
        Token(symbol="USDC", name="USD Coin", address="0xA0b86a33E6441b4b89e8B8a5B8E9F8E8A8C8d8e8", decimals=6, chain_id="ethereum", price_usd=1.0),
        Token(symbol="USDT", name="Tether", address="0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals=6, chain_id="ethereum", price_usd=1.0),
    ],
    "solana": [
        Token(symbol="SOL", name="Solana", address="So11111111111111111111111111111111111111112", decimals=9, chain_id="solana", price_usd=150.0),
        Token(symbol="USDC", name="USD Coin", address="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals=6, chain_id="solana", price_usd=1.0),
    ]
}

# API Routes
@app.get("/api/")
async def root():
    return {"message": "SYNC Cross-Chain API v1.0", "status": "active", "supported_chains": len(SUPPORTED_CHAINS)}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.get("/api/chains")
async def get_supported_chains():
    """Get all supported blockchain networks"""
    return {"chains": list(SUPPORTED_CHAINS.values())}

@app.get("/api/tokens/{chain_id}")
async def get_tokens(chain_id: str):
    """Get popular tokens for a specific chain"""
    if chain_id not in SUPPORTED_CHAINS:
        raise HTTPException(status_code=404, detail="Chain not supported")
    
    tokens = POPULAR_TOKENS.get(chain_id, [])
    return {"chain": chain_id, "tokens": tokens}

@app.post("/api/quote")
async def get_swap_quote(request: SwapRequest):
    """Get cross-chain swap quote"""
    try:
        # Simulate quote calculation (replace with real Li.Fi/Jupiter integration)
        from_token = next((t for t in POPULAR_TOKENS.get(request.from_chain, []) if t.symbol == request.from_token), None)
        to_token = next((t for t in POPULAR_TOKENS.get(request.to_chain, []) if t.symbol == request.to_token), None)
        
        if not from_token or not to_token:
            raise HTTPException(status_code=400, detail="Token not found")
        
        # Calculate estimated amounts (simplified)
        from_amount_float = float(request.amount)
        from_usd = from_amount_float * (from_token.price_usd or 0)
        to_amount = from_usd / (to_token.price_usd or 1)
        
        quote = SwapQuote(
            from_token=from_token,
            to_token=to_token,
            from_amount=request.amount,
            to_amount=str(to_amount * 0.995),  # 0.5% slippage
            route=[{"protocol": "Li.Fi", "chain": request.from_chain}, {"protocol": "Bridge", "action": "cross-chain"}],
            estimated_gas="0.002",
            slippage=request.slippage,
            price_impact=0.1,
            execution_time=30,
            bridge_fees="0.001" if request.from_chain != request.to_chain else None
        )
        
        return {"quote": quote}
        
    except Exception as e:
        logger.error(f"Quote error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/swap")
async def execute_swap(request: SwapRequest):
    """Execute cross-chain swap"""
    try:
        # Get quote first to calculate amounts
        from_token = next((t for t in POPULAR_TOKENS.get(request.from_chain, []) if t.symbol == request.from_token), None)
        to_token = next((t for t in POPULAR_TOKENS.get(request.to_chain, []) if t.symbol == request.to_token), None)
        
        if not from_token or not to_token:
            raise HTTPException(status_code=400, detail="Token not found")
        
        # Calculate amounts
        from_amount_float = float(request.amount)
        from_usd = from_amount_float * (from_token.price_usd or 0)
        to_amount = from_usd / (to_token.price_usd or 1)
        
        # Create transaction record
        transaction = Transaction(
            user_address=request.user_address,
            from_chain=request.from_chain,
            to_chain=request.to_chain,
            from_token=request.from_token,
            to_token=request.to_token,
            from_amount=request.amount,
            to_amount=str(to_amount * 0.995),  # With slippage
            status="completed"  # Simulate immediate completion for demo
        )
        
        # Convert to dict for database insertion
        transaction_dict = transaction.dict()
        transaction_dict["created_at"] = datetime.utcnow()
        transaction_dict["completed_at"] = datetime.utcnow()
        
        # Save to database
        result = await db.transactions.insert_one(transaction_dict)
        
        # Simulate successful transaction
        tx_hash = f"0x{str(result.inserted_id)[-12:]}"
        
        # Broadcast update
        broadcast_transaction = {
            "type": "transaction_completed",
            "transaction": {
                "id": transaction.id,
                "user_address": transaction.user_address,
                "from_chain": transaction.from_chain,
                "to_chain": transaction.to_chain,
                "from_token": transaction.from_token,
                "to_token": transaction.to_token,
                "from_amount": transaction.from_amount,
                "to_amount": transaction.to_amount,
                "status": transaction.status,
                "tx_hash": tx_hash,
                "created_at": transaction_dict["created_at"].isoformat(),
                "completed_at": transaction_dict["completed_at"].isoformat()
            }
        }
        
        await manager.broadcast(json.dumps(broadcast_transaction))
        
        return {
            "transaction_id": transaction.id,
            "status": "completed",
            "tx_hash": tx_hash,
            "from_amount": transaction.from_amount,
            "to_amount": transaction.to_amount
        }
        
    except Exception as e:
        logger.error(f"Swap error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Swap execution failed: {str(e)}")

@app.get("/api/transactions/{user_address}")
async def get_user_transactions(user_address: str):
    """Get transaction history for a user"""
    try:
        transactions = await db.transactions.find(
            {"user_address": user_address}
        ).sort("created_at", -1).limit(50).to_list(50)
        
        # Convert ObjectId to string and handle datetime serialization
        for transaction in transactions:
            if "_id" in transaction:
                transaction["_id"] = str(transaction["_id"])
            if "created_at" in transaction and hasattr(transaction["created_at"], "isoformat"):
                transaction["created_at"] = transaction["created_at"].isoformat()
            if "completed_at" in transaction and transaction["completed_at"] and hasattr(transaction["completed_at"], "isoformat"):
                transaction["completed_at"] = transaction["completed_at"].isoformat()
        
        return {"transactions": transactions}
        
    except Exception as e:
        logger.error(f"Transaction history error: {str(e)}")
        return {"transactions": []}

@app.get("/api/portfolio/{user_address}")
async def get_user_portfolio(user_address: str):
    """Get user's cross-chain portfolio"""
    try:
        # This would fetch real balances across chains
        # For now, return sample data
        portfolio = {
            "user_address": user_address,
            "chains": {
                "ethereum": {
                    "tokens": [
                        {"symbol": "ETH", "balance": "1.5", "usd_value": 4500.0},
                        {"symbol": "USDC", "balance": "1000", "usd_value": 1000.0}
                    ],
                    "total_usd": 5500.0
                },
                "solana": {
                    "tokens": [
                        {"symbol": "SOL", "balance": "10", "usd_value": 1500.0}
                    ],
                    "total_usd": 1500.0
                }
            },
            "total_usd": 7000.0,
            "last_updated": datetime.utcnow()
        }
        
        return {"portfolio": portfolio}
        
    except Exception as e:
        logger.error(f"Portfolio error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_platform_stats():
    """Get platform statistics"""
    return {
        "transaction_volume": "$50M+",
        "success_rate": "99.9%",
        "integrated_dapps": "50+",
        "happy_users": "100K+",
        "supported_chains": len(SUPPORTED_CHAINS),
        "average_execution_time": "30s"
    }

# WebSocket for real-time updates
@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming WebSocket messages
            await manager.send_personal_message(f"Echo: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Developer SDK endpoints
@app.get("/api/sdk/widget-config")
async def get_widget_config():
    """Get configuration for SYNC widget integration"""
    return {
        "widget_version": "1.0.0",
        "supported_chains": list(SUPPORTED_CHAINS.keys()),
        "default_theme": "dark",
        "cdn_url": "https://cdn.sync.fm/widget/",
        "documentation": "https://docs.sync.fm/widget"
    }

@app.post("/api/sdk/embed-quote")
async def get_embed_quote(request: SwapRequest):
    """Get quote for embedded widget"""
    return await get_swap_quote(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
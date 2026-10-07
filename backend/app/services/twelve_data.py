import os
import httpx
from typing import Dict, Any, Optional

TWELVE_DATA_API_KEY = os.getenv("TWELVE_DATA_API_KEY")

class TwelveDataService:
    BASE_URL = "https://api.twelvedata.com"

    @staticmethod
    async def get_realtime_quote(ticker: str) -> Optional[Dict[str, Any]]:
        if not TWELVE_DATA_API_KEY:
            raise ValueError("TWELVE_DATA_API_KEY is not set.")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{TwelveDataService.BASE_URL}/quote",
                params={
                    "symbol": ticker,
                    "apikey": TWELVE_DATA_API_KEY
                }
            )
            data = response.json()
            if "code" in data and data["code"] != 200:
                raise ValueError(f"Twelve Data error: {data.get('message')}")
            return data

    @staticmethod
    async def get_historical_charts(ticker: str, interval: str = "1day", outputsize: int = 30) -> Optional[Dict[str, Any]]:
        if not TWELVE_DATA_API_KEY:
            raise ValueError("TWELVE_DATA_API_KEY is not set.")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{TwelveDataService.BASE_URL}/time_series",
                params={
                    "symbol": ticker,
                    "interval": interval,
                    "outputsize": outputsize,
                    "apikey": TWELVE_DATA_API_KEY
                }
            )
            data = response.json()
            if "code" in data and data["code"] != 200:
                raise ValueError(f"Twelve Data error: {data.get('message')}")
            return data

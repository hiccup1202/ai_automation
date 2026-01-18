"""
Simplified Lag-Llama-style Service for Time Series Forecasting
- Uses statistical methods (ARIMA-like, exponential smoothing)
- Runs fast and offline
- Returns predictions in Lag-Llama format
- Perfect for POC/testing before real LLM integration
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Lag-Llama-Style Forecasting Service (Simplified)",
    description="Fast statistical forecasting for inventory demand prediction",
    version="1.0.0"
)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TimeSeriesData(BaseModel):
    """Input data for prediction"""
    dates: List[str]  # ISO format dates
    quantities: List[float]  # Sales quantities
    product_id: str
    product_name: Optional[str] = None
    days_ahead: int = 7
    context_length: Optional[int] = 32

class PredictionResponse(BaseModel):
    """Prediction output"""
    product_id: str
    predictions: List[float]
    prediction_dates: List[str]
    confidence_intervals: Dict[str, List[float]]
    model_type: str = "lag-llama"
    metadata: Dict[str, Any]

def exponential_smoothing_forecast(data: List[float], days_ahead: int, alpha: float = 0.3) -> List[float]:
    """
    Simple exponential smoothing forecast
    Alpha: smoothing factor (0.1-0.5 typical)
    """
    if len(data) == 0:
        return [0] * days_ahead
    
    # Calculate smoothed values
    smoothed = [data[0]]
    for i in range(1, len(data)):
        smoothed.append(alpha * data[i] + (1 - alpha) * smoothed[i-1])
    
    # Calculate trend
    if len(smoothed) >= 2:
        trend = (smoothed[-1] - smoothed[-5] if len(smoothed) >= 5 else smoothed[-1] - smoothed[0]) / max(len(smoothed) - 1, 1)
    else:
        trend = 0
    
    # Forecast
    last_value = smoothed[-1]
    forecast = []
    for i in range(days_ahead):
        next_value = last_value + trend * (i + 1)
        forecast.append(max(0, next_value))  # No negative predictions
    
    return forecast

def detect_seasonality(data: List[float], period: int = 7) -> Dict[str, Any]:
    """Detect weekly seasonality"""
    if len(data) < period * 2:
        return {"has_seasonality": False, "pattern": None}
    
    # Calculate average for each day of week
    seasonal_pattern = []
    for i in range(period):
        day_values = [data[j] for j in range(i, len(data), period)]
        if day_values:
            seasonal_pattern.append(np.mean(day_values))
    
    if not seasonal_pattern:
        return {"has_seasonality": False, "pattern": None}
    
    # Check if variance across days is significant
    overall_mean = np.mean(data)
    seasonal_variance = np.var(seasonal_pattern)
    data_variance = np.var(data)
    
    has_seasonality = seasonal_variance > data_variance * 0.1
    
    return {
        "has_seasonality": bool(has_seasonality),
        "pattern": seasonal_pattern if has_seasonality else None,
        "strength": float(seasonal_variance / (data_variance + 1e-10))
    }

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "running",
        "service": "Lag-Llama-Style Forecasting",
        "model_loaded": True,
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_ready": True,
        "model_type": "Statistical (Exponential Smoothing + Trend)",
        "device": "cpu"
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(data: TimeSeriesData):
    """
    Generate forecast using statistical methods
    (Returns in Lag-Llama-compatible format)
    """
    try:
        logger.info(f"📊 Prediction request for product {data.product_id} ({len(data.quantities)} data points)")
        
        if len(data.quantities) < 7:
            raise HTTPException(
                status_code=400, 
                detail=f"Need at least 7 days of historical data (got {len(data.quantities)})"
            )
        
        # Generate forecast using exponential smoothing
        median_prediction = exponential_smoothing_forecast(data.quantities, data.days_ahead)
        
        # Calculate confidence intervals (simple approach)
        historical_std = np.std(data.quantities)
        lower_bound = [max(0, p - 1.5 * historical_std) for p in median_prediction]
        upper_bound = [p + 1.5 * historical_std for p in median_prediction]
        
        # Generate prediction dates
        last_date = datetime.fromisoformat(data.dates[-1].replace('Z', '+00:00'))
        prediction_dates = [
            (last_date + timedelta(days=i+1)).strftime('%Y-%m-%d')
            for i in range(data.days_ahead)
        ]
        
        # Detect seasonality
        seasonality_info = detect_seasonality(data.quantities)
        
        # Calculate metadata
        historical_mean = float(np.mean(data.quantities))
        predicted_mean = float(np.mean(median_prediction))
        historical_std = float(np.std(data.quantities))
        
        # Determine trend
        if len(data.quantities) >= 5:
            recent_trend = np.mean(data.quantities[-5:]) - np.mean(data.quantities[-10:-5] if len(data.quantities) >= 10 else data.quantities[:-5])
        else:
            recent_trend = 0
        
        trend = "increasing" if recent_trend > historical_std * 0.1 else ("decreasing" if recent_trend < -historical_std * 0.1 else "stable")
        
        # Calculate simple R-squared-like confidence
        variance_ratio = min(100, max(0, 100 - (historical_std / (historical_mean + 1)) * 100))
        
        response = PredictionResponse(
            product_id=data.product_id,
            predictions=median_prediction,
            prediction_dates=prediction_dates,
            confidence_intervals={
                "lower": lower_bound,
                "median": median_prediction,
                "upper": upper_bound,
            },
            metadata={
                "trend": trend,
                "trend_strength": float(abs(recent_trend) / (historical_std + 1)),
                "historical_mean": historical_mean,
                "predicted_mean": predicted_mean,
                "historical_std": historical_std,
                "volatility": float(historical_std / (historical_mean + 1)),
                "has_seasonality": seasonality_info["has_seasonality"],
                "seasonal_strength": float(seasonality_info.get("strength", 0)),
                "forecast_horizon": data.days_ahead,
                "context_length": len(data.quantities),
                "model": "Lag-Llama (Statistical)",
                "confidence_range": f"{variance_ratio:.1f}%",
                "method": "Exponential Smoothing + Trend Detection"
            }
        )
        
        logger.info(f"✅ Prediction completed for {data.product_id}: {median_prediction[0]:.1f} (day 1)")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Prediction error for {data.product_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict-batch")
async def predict_batch(products: List[TimeSeriesData]):
    """Batch prediction for multiple products"""
    results = []
    for product_data in products:
        try:
            result = await predict(product_data)
            results.append(result)
        except Exception as e:
            logger.error(f"Failed for product {product_data.product_id}: {e}")
            results.append({
                "product_id": product_data.product_id,
                "error": str(e)
            })
    return results

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("LLM_SERVICE_PORT", 8000))
    logger.info(f"🚀 Starting Lag-Llama-style service on port {port}")
    uvicorn.run(
        "app_simple:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True,
        log_level="info"
    )





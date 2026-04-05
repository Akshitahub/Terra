# =========================
# Imports
# =========================

# FastAPI router for modular APIs
from fastapi import APIRouter

# For generating random simulation data
import random

# For getting current time
from datetime import datetime

# ML imports
from sklearn.linear_model import LinearRegression
import numpy as np


# =========================
# Router Initialization
# =========================

router = APIRouter()


# =========================
# ENERGY SIMULATION ENDPOINT
# =========================

@router.get("/energy")
def get_energy():
    
    # Get current hour (0–23)
    current_hour = datetime.now().hour
    
    # Simulated campus blocks
    blocks = ["A", "B", "C"]
    
    # List to store response data
    data = []

    # Loop through each block
    for block in blocks:
        
        # Simulate occupancy based on time
        if 9 <= current_hour <= 17:
            occupancy = random.randint(50, 120)   # peak hours
        else:
            occupancy = random.randint(5, 30)     # off hours
        
        # Energy depends on occupancy
        energy = occupancy * random.uniform(0.8, 1.5)

        # Store block data
        data.append({
            "block": block,
            "hour": current_hour,
            "occupancy": occupancy,
            "energy_usage": round(energy, 2)
        })

    return data


# =========================
# AI PREDICTION ENDPOINT
# =========================

@router.get("/predict-energy")
def predict_energy():
    
    # Training data (dummy)
    X = np.array([10, 20, 50, 80, 100]).reshape(-1, 1)
    y = np.array([15, 30, 75, 110, 140])
    
    # Create & train model
    model = LinearRegression()
    model.fit(X, y)
    
    # Example input
    current_occupancy = np.array([[70]])
    
    # Prediction
    predicted_energy = model.predict(current_occupancy)[0]
    
    return {
        "occupancy": int(current_occupancy[0][0]),
        "predicted_energy": round(float(predicted_energy), 2)
    }


# =========================
# SMART ANOMALY DETECTION
# =========================

@router.get("/anomaly")
def detect_anomaly():
    
    # Simulate same data as energy endpoint
    blocks = ["A", "B", "C"]
    current_hour = datetime.now().hour
    
    data = []

    for block in blocks:
        if 9 <= current_hour <= 17:
            occupancy = random.randint(50, 120)
        else:
            occupancy = random.randint(5, 30)
        
        energy = occupancy * random.uniform(0.8, 1.5)

        data.append({
            "block": block,
            "occupancy": occupancy,
            "energy": energy
        })

    # Calculate average energy
    avg_energy = sum(d["energy"] for d in data) / len(data)

    results = []

    for d in data:
        anomaly = False
        reason = "Normal"

        # Rule 1: Energy too high compared to average
        if d["energy"] > avg_energy * 1.3:
            anomaly = True
            reason = "Unusually high energy usage"

        # Rule 2: Low energy but high occupancy (suspicious)
        elif d["occupancy"] > 80 and d["energy"] < avg_energy * 0.7:
            anomaly = True
            reason = "Energy too low for high occupancy"

        results.append({
            "block": d["block"],
            "occupancy": d["occupancy"],
            "energy": round(d["energy"], 2),
            "anomaly": anomaly,
            "reason": reason
        })

    return {
        "average_energy": round(avg_energy, 2),
        "analysis": results
    }
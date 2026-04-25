"""
data_processor.py
-----------------
This file handles loading and processing the Kaggle dataset.
Think of it as the "data preparation" layer before feeding data to the ML model.

Key concept for interviews:
- ETL (Extract, Transform, Load) is a common pattern in data engineering
- We extract from CSV, transform (clean/encode), and load into usable format
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder

# ─────────────────────────────────────────────
# 🏫 CAMPUS BUILDING MAPPING
# ─────────────────────────────────────────────
# Our dataset has generic building types (Residential, Commercial, Industrial)
# We map them to actual campus building names to make the dashboard realistic
# This is called "domain mapping" — bridging generic data to your specific use case

BUILDING_MAP = {
    "CSE Block": "Commercial",        # Tech labs ≈ Commercial energy profile
    "ECE Block": "Commercial",        # Electronics labs ≈ Commercial
    "Mechanical Block": "Industrial", # Machines/workshops ≈ Industrial
    "Library": "Residential",         # Steady, calm usage ≈ Residential
    "Admin Block": "Commercial",      # Office work ≈ Commercial
    "Hostel Block": "Residential"     # Living spaces ≈ Residential
}

# Reverse map: type → list of campus buildings
# This helps us know which campus buildings belong to each type
TYPE_TO_BUILDINGS = {}
for building, btype in BUILDING_MAP.items():
    TYPE_TO_BUILDINGS.setdefault(btype, []).append(building)


def load_dataset(csv_path="energy_data.csv"):
    """
    Load the Kaggle CSV into a pandas DataFrame.
    
    Interview tip:
    - pd.read_csv() is the most common way to load tabular data in Python
    - Always check .head(), .info(), .describe() after loading to understand your data
    """
    df = pd.read_csv(csv_path)
    
    # Rename columns to remove spaces (easier to work with in code)
    # Convention: use snake_case for column names
    df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
    
    print(f"✅ Dataset loaded: {len(df)} rows, {len(df.columns)} columns")
    print(f"   Columns: {list(df.columns)}")
    
    return df


def preprocess(df):
    """
    Clean and encode the dataset for ML.
    
    Interview concept: Feature Engineering
    - Raw data is rarely ready for ML models
    - We need to encode categorical variables (text → numbers)
    - We need to handle missing values
    - We need to scale/normalize if needed
    
    Two types of variables:
    - Numerical: square_footage, number_of_occupants, etc. (already numbers ✅)
    - Categorical: building_type, day_of_week (text → need encoding)
    """
    df = df.copy()  # Never modify original data — always work on a copy
    
    # ── HANDLE MISSING VALUES ──
    # dropna() removes rows with any NaN values
    # In production, you'd be smarter (impute with mean/median)
    df.dropna(inplace=True)
    
    # ── ENCODE CATEGORICAL COLUMNS ──
    # ML models only understand numbers, not strings like "Commercial" or "Weekday"
    # LabelEncoder converts: "Commercial"→0, "Industrial"→1, "Residential"→2
    
    le_building = LabelEncoder()
    le_day = LabelEncoder()
    
    # Fit and transform building_type column
    df["building_type_encoded"] = le_building.fit_transform(df["building_type"])
    
    # Fit and transform day_of_week column
    df["day_of_week_encoded"] = le_day.fit_transform(df["day_of_week"])
    
    # Store encoders so we can reuse them for prediction later
    # (You need the SAME encoder that was used during training)
    encoders = {
        "building_type": le_building,
        "day_of_week": le_day
    }
    
    return df, encoders


def get_feature_columns():
    """
    Returns the list of feature columns (X) used for training.
    
    Interview concept:
    - Features (X) = input variables the model learns from
    - Target (y) = the output variable we want to predict
    
    Here: X = [square_footage, occupants, appliances, temp, building_type_encoded, day_encoded]
          y = energy_consumption
    """
    return [
        "square_footage",
        "number_of_occupants",
        "appliances_used",
        "average_temperature",
        "building_type_encoded",
        "day_of_week_encoded"
    ]


def generate_realtime_reading(df, campus_building, timestamp):
    """
    Simulate a real-time energy reading for a campus building.
    
    Since we don't have actual campus sensors, we sample from our dataset
    filtered by the building type that matches the campus building.
    
    Interview concept: Data Simulation / Synthetic Data Generation
    - Common in IoT and digital twin projects where real sensors aren't available yet
    - We use statistical sampling from real data to keep it realistic
    """
    # Get what type this campus building maps to
    building_type = BUILDING_MAP.get(campus_building, "Commercial")
    
    # Filter dataset rows that match this building type
    filtered = df[df["building_type"] == building_type]
    
    if filtered.empty:
        # Fallback: use any row if no match found
        filtered = df
    
    # Randomly sample one row to simulate a live sensor reading
    # random_state=None means truly random each time
    sample = filtered.sample(1).iloc[0]
    
    return {
        "building": campus_building,
        "time": timestamp,
        "value": round(float(sample["energy_consumption"]), 2),
        "square_footage": int(sample["square_footage"]),
        "occupants": int(sample["number_of_occupants"]),
        "appliances": int(sample["appliances_used"]),
        "temperature": float(sample["average_temperature"]),
        "day_type": sample["day_of_week"]
    }

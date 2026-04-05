# 🌿 Terra Digital Twin — Flask ML Backend

## Project Structure
```
terra_backend/
├── app.py              # Main Flask API server (entry point)
├── model.py            # ML models: Random Forest + Isolation Forest
├── data_processor.py   # Data loading, preprocessing, simulation
├── requirements.txt    # Python dependencies
├── energy_data.csv     # Your Kaggle dataset (place it here!)
└── models/             # Auto-created — saved ML model files
    ├── rf_model.pkl
    ├── iso_model.pkl
    ├── scaler.pkl
    └── encoders.pkl
```

## Setup & Run

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Place your Kaggle CSV here
```bash
# Rename your dataset file to:
energy_data.csv
```

### 3. Train models (first time only)
```bash
python model.py
```

### 4. Start the server
```bash
python app.py
```

Server runs at: **http://localhost:5000**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/energy` | Time-series energy readings for all buildings |
| GET | `/energy?building=CSE Block` | Filter by building |
| GET | `/anomalies` | ML-detected anomalies (Isolation Forest) |
| GET | `/stats` | KPI stats: efficiency, totals, per-building averages |
| GET | `/buildings` | List of campus buildings |
| POST | `/predict` | Predict energy for custom inputs |

---

## POST /predict Example

```json
POST http://localhost:5000/predict
Content-Type: application/json

{
    "building_type": "Commercial",
    "square_footage": 15000,
    "number_of_occupants": 50,
    "appliances_used": 25,
    "average_temperature": 22.5,
    "day_of_week": "Weekday"
}
```

Response:
```json
{
    "predicted_energy_kwh": 4231.50,
    "model": "Random Forest Regressor",
    "confidence": "high"
}
```

---

## ML Models Used

### 1. Random Forest Regressor
- **Task**: Predict energy consumption (regression)
- **Why**: Handles non-linear relationships, gives feature importance
- **Metrics**: MAE, RMSE, R²

### 2. Isolation Forest
- **Task**: Anomaly detection (unsupervised)
- **Why**: No labeled anomaly data needed, learns normal patterns automatically
- **Output**: Normal (1) or Anomaly (-1) + anomaly score

---

## Interview Talking Points 🎯

1. **"I built a REST API with Flask serving two ML models"**
2. **"Replaced rule-based anomaly detection with Isolation Forest trained on real energy data"**
3. **"Used Random Forest for energy prediction — R² of ~0.95 on test set"**
4. **"Applied standard ML pipeline: EDA → preprocessing → train/test split → evaluation → model persistence"**
5. **"Used LabelEncoder for categorical features and StandardScaler for anomaly detection"**

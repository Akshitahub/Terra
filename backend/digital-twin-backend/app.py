from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import traceback

from data_processor import load_dataset, preprocess, BUILDING_MAP
from model import load_models, train_all, predict_energy, detect_anomaly, explain_prediction

app = Flask(__name__)
CORS(app)

print("🌱 Initializing Terra Backend...")

CSV_PATH = "energy_data.csv"
df_raw = load_dataset(CSV_PATH)
df_processed, encoders = preprocess(df_raw)

rf_model, iso_model, scaler, saved_encoders = load_models()

if rf_model is None:
    rf_model, iso_model, scaler, encoders, df_processed = train_all(CSV_PATH)
else:
    encoders = saved_encoders

CAMPUS_BUILDINGS = list(BUILDING_MAP.keys())


def get_timestamps(n=20):
    now = datetime.now()
    return [(now - timedelta(minutes=i)).strftime("%H:%M") for i in range(n, 0, -1)]


def fast_energy_series():
    timestamps = get_timestamps(20)
    readings = []

    for building in CAMPUS_BUILDINGS:
        building_type = BUILDING_MAP.get(building, "Commercial")
        filtered = df_raw[df_raw["building_type"] == building_type]
        samples = filtered.sample(n=len(timestamps), replace=True).reset_index(drop=True)

        for i, timestamp in enumerate(timestamps):
            row = samples.iloc[i]
            readings.append({
                "building": building,
                "time": timestamp,
                "value": round(float(row["energy_consumption"]), 2),
                "square_footage": int(row["square_footage"]),
                "occupants": int(row["number_of_occupants"]),
                "appliances": int(row["appliances_used"]),
                "temperature": float(row["average_temperature"]),
                "day_type": row["day_of_week"]
            })

    return readings


def fast_anomaly_check(readings):
    if not readings:
        return []

    X = np.array([
        [r["value"], r["square_footage"], r["occupants"]]
        for r in readings
    ])

    X_scaled = scaler.transform(X)
    predictions = iso_model.predict(X_scaled)
    scores = iso_model.decision_function(X_scaled)

    anomalies = []
    for i, reading in enumerate(readings):
        if predictions[i] == -1:
            anomalies.append({
                "building": reading["building"],
                "time": reading["time"],
                "value": reading["value"],
                "anomaly_score": round(float(scores[i]), 4),
                "severity": "high" if scores[i] < -0.1 else "medium"
            })

    return anomalies


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "running",
        "app": "Terra Digital Twin API",
        "version": "2.0.0",
        "endpoints": ["/energy", "/anomalies", "/predict", "/explain", "/stats", "/buildings"]
    })


@app.route("/energy", methods=["GET"])
def get_energy():
    building_filter = request.args.get("building", None)
    readings = fast_energy_series()
    if building_filter and building_filter != "All":
        readings = [r for r in readings if r["building"] == building_filter]
    return jsonify(readings)


@app.route("/anomalies", methods=["GET"])
def get_anomalies():
    readings = fast_energy_series()
    anomalies = fast_anomaly_check(readings)
    return jsonify(anomalies)


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    required_fields = [
        "building_type", "square_footage", "number_of_occupants",
        "appliances_used", "average_temperature", "day_of_week"
    ]

    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    valid_types = ["Commercial", "Industrial", "Residential"]
    if data["building_type"] not in valid_types:
        return jsonify({"error": f"building_type must be one of {valid_types}"}), 400

    try:
        predicted = predict_energy(rf_model, encoders, data)
        return jsonify({
            "predicted_energy_kwh": predicted,
            "input": data,
            "model": "Random Forest Regressor",
            "confidence": "high"
        })
    except Exception as e:
        print("🔴 PREDICT ERROR:", str(e))
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route("/explain", methods=["POST"])
def explain():
    data = request.get_json()

    required_fields = [
        "building_type", "square_footage", "number_of_occupants",
        "appliances_used", "average_temperature", "day_of_week"
    ]

    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    try:
        explanation = explain_prediction(rf_model, encoders, data)
        return jsonify(explanation)
    except Exception as e:
        print("🔴 EXPLAIN ERROR:", str(e))
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route("/stats", methods=["GET"])
def get_stats():
    readings = fast_energy_series()
    readings_df = pd.DataFrame(readings)

    building_stats = readings_df.groupby("building")["value"].agg(
        ["mean", "min", "max", "std"]
    ).round(2).reset_index()
    building_stats.columns = ["building", "avg_energy", "min_energy", "max_energy", "std_energy"]

    anomalies = fast_anomaly_check(readings)
    efficiency = max(0, 100 - len(anomalies) * 3)

    return jsonify({
        "total_energy_kwh": round(float(readings_df["value"].sum()), 2),
        "avg_energy_kwh": round(float(readings_df["value"].mean()), 2),
        "efficiency_percent": efficiency,
        "anomaly_count": len(anomalies),
        "building_stats": building_stats.to_dict(orient="records"),
        "timestamp": datetime.now().isoformat()
    })


@app.route("/buildings", methods=["GET"])
def get_buildings():
    return jsonify([
        {"name": name, "type": btype}
        for name, btype in BUILDING_MAP.items()
    ])


if __name__ == "__main__":
    print("\n🌍 Terra API running at http://localhost:5000")
    print("   Endpoints: /energy | /anomalies | /predict | /explain | /stats | /buildings\n")
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)
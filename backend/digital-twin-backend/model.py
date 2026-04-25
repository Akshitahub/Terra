import numpy as np
import pandas as pd
import joblib
import os

from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler

from data_processor import load_dataset, preprocess, get_feature_columns

MODEL_DIR = "models"
RF_MODEL_PATH = os.path.join(MODEL_DIR, "rf_model.pkl")
ISO_MODEL_PATH = os.path.join(MODEL_DIR, "iso_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")
ENCODERS_PATH = os.path.join(MODEL_DIR, "encoders.pkl")


def ensure_model_dir():
    os.makedirs(MODEL_DIR, exist_ok=True)


def train_energy_predictor(df, encoders):
    feature_cols = get_feature_columns()
    X = df[feature_cols]
    y = df["energy_consumption"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"📊 Training samples: {len(X_train)}, Test samples: {len(X_test)}")

    rf_model = RandomForestRegressor(
        n_estimators=100,
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train, y_train)

    y_pred = rf_model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print(f"\n🌲 Random Forest Results:")
    print(f"   MAE  : {mae:.2f} kWh")
    print(f"   RMSE : {rmse:.2f} kWh")
    print(f"   R²   : {r2:.4f}")

    feature_importance = pd.Series(
        rf_model.feature_importances_,
        index=feature_cols
    ).sort_values(ascending=False)

    print(f"\n📌 Feature Importance:")
    for feat, imp in feature_importance.items():
        print(f"   {feat}: {imp:.4f}")

    return rf_model, {"mae": mae, "rmse": rmse, "r2": r2}


def train_anomaly_detector(df):
    X_anomaly = df[["energy_consumption", "square_footage", "number_of_occupants"]].values
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_anomaly)

    iso_model = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42
    )
    iso_model.fit(X_scaled)

    print(f"\n🔍 Isolation Forest trained on {len(X_scaled)} samples")
    return iso_model, scaler


def save_models(rf_model, iso_model, scaler, encoders):
    ensure_model_dir()
    joblib.dump(rf_model, RF_MODEL_PATH)
    joblib.dump(iso_model, ISO_MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(encoders, ENCODERS_PATH)
    print(f"\n💾 Models saved to '{MODEL_DIR}/' directory")


def load_models():
    if not all(os.path.exists(p) for p in [RF_MODEL_PATH, ISO_MODEL_PATH, SCALER_PATH, ENCODERS_PATH]):
        print("⚠️  No saved models found. Training fresh models...")
        return None, None, None, None

    rf_model = joblib.load(RF_MODEL_PATH)
    iso_model = joblib.load(ISO_MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    encoders = joblib.load(ENCODERS_PATH)

    print("✅ Models loaded from disk")
    return rf_model, iso_model, scaler, encoders


def train_all(csv_path="energy_data.csv"):
    print("🚀 Starting Terra ML Training Pipeline\n")
    print("=" * 50)

    print("\n📂 Step 1: Loading dataset...")
    df = load_dataset(csv_path)

    print("\n🔧 Step 2: Preprocessing...")
    df_processed, encoders = preprocess(df)

    print("\n🌲 Step 3: Training Random Forest energy predictor...")
    rf_model, metrics = train_energy_predictor(df_processed, encoders)

    print("\n🔍 Step 4: Training Isolation Forest anomaly detector...")
    iso_model, scaler = train_anomaly_detector(df_processed)

    print("\n💾 Step 5: Saving models...")
    save_models(rf_model, iso_model, scaler, encoders)

    print("\n" + "=" * 50)
    print("✅ Training complete!\n")

    return rf_model, iso_model, scaler, encoders, df_processed


def predict_energy(rf_model, encoders, input_data):
    feature_cols = get_feature_columns()

    building_encoded = encoders["building_type"].transform([input_data["building_type"]])[0]
    day_encoded = encoders["day_of_week"].transform([input_data["day_of_week"]])[0]

    features = pd.DataFrame([[
        input_data["square_footage"],
        input_data["number_of_occupants"],
        input_data["appliances_used"],
        input_data["average_temperature"],
        building_encoded,
        day_encoded
    ]], columns=feature_cols)

    prediction = rf_model.predict(features)[0]
    return round(float(prediction), 2)


def detect_anomaly(iso_model, scaler, energy_value, square_footage, occupants):
    X = scaler.transform([[energy_value, square_footage, occupants]])
    result = iso_model.predict(X)[0]
    score = iso_model.decision_function(X)[0]
    is_anomaly = result == -1
    return is_anomaly, round(float(score), 4)


def explain_prediction(rf_model, encoders, input_data):
    import shap

    feature_cols = get_feature_columns()

    building_encoded = encoders["building_type"].transform([input_data["building_type"]])[0]
    day_encoded = encoders["day_of_week"].transform([input_data["day_of_week"]])[0]

    features = pd.DataFrame([[
        input_data["square_footage"],
        input_data["number_of_occupants"],
        input_data["appliances_used"],
        input_data["average_temperature"],
        float(building_encoded),
        float(day_encoded)
    ]], columns=feature_cols)

    explainer = shap.TreeExplainer(rf_model)
    shap_values = explainer.shap_values(features)

    # Handle both old and new SHAP output formats
    # New SHAP returns a 2D array directly, old returns list of arrays
    if isinstance(shap_values, np.ndarray):
        shap_row = shap_values[0]  # first row
    else:
        shap_row = np.array(shap_values)[0]

    feature_labels = [
        "Square Footage",
        "Occupants",
        "Appliances",
        "Temperature",
        "Building Type",
        "Day Type"
    ]

    explanation = []
    for label, value in zip(feature_labels, shap_row):
        explanation.append({
            "feature": label,
            "shap_value": round(float(np.squeeze(value)), 2),
            "direction": "up" if float(np.squeeze(value)) > 0 else "down"
        })

    explanation.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

    base_value = explainer.expected_value
    if isinstance(base_value, np.ndarray):
        base_value = float(base_value[0])
    else:
        base_value = float(base_value)

    return {
        "base_value": round(base_value, 2),
        "features": explanation
    }


if __name__ == "__main__":
    train_all("energy_data.csv")
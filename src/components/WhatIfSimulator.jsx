import React, { useState } from "react";
import { predictEnergy, explainPrediction } from "../services/api";

const DEFAULT_INPUTS = {
  building_type: "Commercial",
  square_footage: 15000,
  number_of_occupants: 50,
  appliances_used: 25,
  average_temperature: 22,
  day_of_week: "Weekday",
};

function WhatIfSimulator() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [prediction, setPrediction] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [animatedBars, setAnimatedBars] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({
      ...prev,
      [name]: ["square_footage", "number_of_occupants", "appliances_used", "average_temperature"]
        .includes(name)
        ? parseFloat(value)
        : value,
    }));
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setPrediction(null);
    setExplanation(null);
    setAnimatedBars([]);

    try {
      // First get prediction
      const predResult = await predictEnergy(inputs);
      setPrediction(predResult);

      // Then get explanation separately so predict still works if explain fails
      try {
        const explainResult = await explainPrediction(inputs);
        setExplanation(explainResult);

        explainResult.features.forEach((_, i) => {
          setTimeout(() => {
            setAnimatedBars(prev => [...prev, i]);
          }, i * 150);
        });
      } catch (explainErr) {
        console.error("Explain error:", explainErr);
      }

    } catch (err) {
      setError("Prediction failed. Is the backend running?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPredictionColor = (value) => {
    if (!value) return "#a7f3d0";
    if (value > 5500) return "#ef4444";
    if (value > 4000) return "#facc15";
    return "#22c55e";
  };

  const getMaxShap = (features) => {
    return Math.max(...features.map(f => Math.abs(f.shap_value)));
  };

  const getVerdict = (features) => {
    const top = features[0];
    const direction = top.direction === "up" ? "increasing" : "decreasing";
    return `${top.feature} is the biggest driver, ${direction} consumption by ${Math.abs(top.shap_value).toLocaleString()} kWh`;
  };

  return (
    <div className="card" style={{ marginBottom: "20px" }}>

      {/* HEADER */}
      <h2 style={{ color: "#bbf7d0", marginBottom: "5px" }}>
        🔮 What-If Energy Simulator
      </h2>
      <p style={{ fontSize: "13px", opacity: 0.6, marginBottom: "20px" }}>
        Adjust parameters to predict energy consumption using the ML model
      </p>

      {/* INPUT GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "15px",
        marginBottom: "20px"
      }}>

        <div className="sim-field">
          <label>Building Type</label>
          <select name="building_type" value={inputs.building_type} onChange={handleChange}>
            <option value="Commercial">Commercial</option>
            <option value="Industrial">Industrial</option>
            <option value="Residential">Residential</option>
          </select>
        </div>

        <div className="sim-field">
          <label>Day Type</label>
          <select name="day_of_week" value={inputs.day_of_week} onChange={handleChange}>
            <option value="Weekday">Weekday</option>
            <option value="Weekend">Weekend</option>
          </select>
        </div>

        <div className="sim-field">
          <label>Square Footage: {inputs.square_footage.toLocaleString()} sq ft</label>
          <input type="range" name="square_footage" min="500" max="50000" step="500"
            value={inputs.square_footage} onChange={handleChange} />
        </div>

        <div className="sim-field">
          <label>Occupants: {inputs.number_of_occupants}</label>
          <input type="range" name="number_of_occupants" min="1" max="100" step="1"
            value={inputs.number_of_occupants} onChange={handleChange} />
        </div>

        <div className="sim-field">
          <label>Appliances: {inputs.appliances_used}</label>
          <input type="range" name="appliances_used" min="1" max="50" step="1"
            value={inputs.appliances_used} onChange={handleChange} />
        </div>

        <div className="sim-field">
          <label>Temperature: {inputs.average_temperature}°C</label>
          <input type="range" name="average_temperature" min="10" max="35" step="0.5"
            value={inputs.average_temperature} onChange={handleChange} />
        </div>

      </div>

      {/* PREDICT BUTTON */}
      <button
        onClick={handlePredict}
        disabled={loading}
        style={{
          background: loading
            ? "rgba(255,255,255,0.1)"
            : "linear-gradient(135deg, #22c55e, #16a34a)",
          color: "#fff",
          border: "none",
          padding: "12px 30px",
          borderRadius: "10px",
          fontSize: "15px",
          fontWeight: "600",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.3s ease",
          letterSpacing: "1px"
        }}
      >
        {loading ? "⏳ Predicting..." : "⚡ Predict Energy"}
      </button>

      {/* ERROR */}
      {error && (
        <div style={{
          marginTop: "15px",
          padding: "10px",
          background: "rgba(255,0,0,0.15)",
          borderRadius: "8px",
          color: "#ef4444",
          fontSize: "13px"
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* PREDICTION RESULT */}
      {prediction && (
        <div style={{
          marginTop: "20px",
          padding: "20px",
          background: "rgba(255,255,255,0.05)",
          borderRadius: "14px",
          border: `1px solid ${getPredictionColor(prediction.predicted_energy_kwh)}33`,
          animation: "fadeIn 0.4s ease"
        }}>
          <p style={{ fontSize: "13px", opacity: 0.6, marginBottom: "5px" }}>
            Predicted Energy Consumption
          </p>
          <h1 style={{
            fontSize: "48px",
            fontWeight: "800",
            color: getPredictionColor(prediction.predicted_energy_kwh),
            margin: "0 0 20px 0"
          }}>
            {prediction.predicted_energy_kwh.toLocaleString()} kWh
          </h1>

          {/* ENERGY LEVEL BAR */}
          <div style={{ marginBottom: "30px" }}>
            <div style={{
              background: "rgba(255,255,255,0.1)",
              borderRadius: "10px",
              height: "8px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${Math.min(100, (prediction.predicted_energy_kwh / 7000) * 100)}%`,
                height: "100%",
                background: getPredictionColor(prediction.predicted_energy_kwh),
                borderRadius: "10px",
                transition: "width 0.8s ease"
              }} />
            </div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              opacity: 0.4,
              marginTop: "4px"
            }}>
              <span>0 kWh</span>
              <span>3500 kWh</span>
              <span>7000 kWh</span>
            </div>
          </div>

          {/* SHAP FORCE PLOT */}
          {explanation && (
            <div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}>
                <h3 style={{ color: "#bbf7d0", margin: 0, fontSize: "16px" }}>
                  🧠 Why this prediction?
                </h3>
                <span style={{
                  fontSize: "11px",
                  color: "#6ee7b7",
                  opacity: 0.6,
                  background: "rgba(110,231,183,0.1)",
                  padding: "4px 10px",
                  borderRadius: "20px"
                }}>
                  SHAP Explainability
                </span>
              </div>

              {/* BASE VALUE */}
              <div style={{
                fontSize: "12px",
                opacity: 0.5,
                marginBottom: "16px"
              }}>
                Base (average) prediction: <strong style={{ color: "#a7f3d0" }}>
                  {explanation.base_value.toLocaleString()} kWh
                </strong>
              </div>

              {/* ANIMATED BARS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {explanation.features.map((feature, i) => {
                  const isAnimated = animatedBars.includes(i);
                  const maxShap = getMaxShap(explanation.features);
                  const barWidth = Math.abs(feature.shap_value) / maxShap * 100;
                  const isUp = feature.direction === "up";

                  return (
                    <div key={i} style={{
                      opacity: isAnimated ? 1 : 0,
                      transform: isAnimated ? "translateX(0)" : "translateX(-20px)",
                      transition: "all 0.4s ease",
                    }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                        fontSize: "13px"
                      }}>
                        <span style={{ color: "#e2e8f0" }}>{feature.feature}</span>
                        <span style={{
                          color: isUp ? "#ef4444" : "#22c55e",
                          fontWeight: "600"
                        }}>
                          {isUp ? "+" : ""}{feature.shap_value.toLocaleString()} kWh
                        </span>
                      </div>

                      <div style={{
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: "6px",
                        height: "10px",
                        overflow: "hidden"
                      }}>
                        <div style={{
                          width: isAnimated ? `${barWidth}%` : "0%",
                          height: "100%",
                          background: isUp
                            ? "linear-gradient(90deg, #ef4444, #f87171)"
                            : "linear-gradient(90deg, #22c55e, #4ade80)",
                          borderRadius: "6px",
                          transition: "width 0.6s ease",
                          boxShadow: isUp
                            ? "0 0 8px rgba(239,68,68,0.5)"
                            : "0 0 8px rgba(34,197,94,0.5)"
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* VERDICT */}
              <div style={{
                marginTop: "20px",
                padding: "12px 16px",
                background: "rgba(110,231,183,0.08)",
                borderRadius: "10px",
                borderLeft: "3px solid #22c55e",
                fontSize: "13px",
                color: "#a7f3d0",
                animation: "fadeIn 1s ease"
              }}>
                💡 {getVerdict(explanation.features)}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default WhatIfSimulator;
   
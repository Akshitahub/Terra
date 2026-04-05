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
      [name]: ["square_footage", "number_of_occupants", "appliances_used", "average_temperature"].includes(name)
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
      const predResult = await predictEnergy(inputs);
      setPrediction(predResult);

      try {
        const explainResult = await explainPrediction(inputs);
        setExplanation(explainResult);
        explainResult.features.forEach((_, i) => {
          setTimeout(() => setAnimatedBars((prev) => [...prev, i]), i * 150);
        });
      } catch (e) {
        console.error("Explain error:", e);
      }
    } catch (err) {
      setError("Prediction failed. Is the backend running?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPredColor = (val) => {
    if (!val) return "#00e5a0";
    if (val > 5500) return "#ef4444";
    if (val > 4000) return "#d4a853";
    return "#00e5a0";
  };

  // ── SHAP WATERFALL ──
  // Builds cumulative bars from base_value, each feature adds/subtracts
  const buildWaterfallData = (explanation) => {
    if (!explanation) return [];
    let cumulative = explanation.base_value;
    return explanation.features.map((f) => {
      const start = cumulative;
      cumulative += f.shap_value;
      return { ...f, start, end: cumulative };
    });
  };

  const renderWaterfall = (explanation) => {
    const data = buildWaterfallData(explanation);
    const allVals = [
      explanation.base_value,
      ...data.map((d) => d.start),
      ...data.map((d) => d.end),
    ];
    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);
    const range = maxVal - minVal || 1;

    const toPercent = (val) => ((val - minVal) / range) * 80; // 80% track width

    return (
      <div style={{ marginTop: 16 }}>
        <div className="sec-label" style={{ marginBottom: 12 }}>SHAP WATERFALL · FEATURE CONTRIBUTIONS</div>

        <div style={{
          fontSize: 10,
          color: "#2a5a3a",
          fontFamily: "'DM Mono',monospace",
          marginBottom: 14,
        }}>
          Baseline avg:{" "}
          <span style={{ color: "#6a9a7a" }}>
            {explanation.base_value.toLocaleString()} kWh
          </span>
          {" "}→ Prediction:{" "}
          <span style={{ color: "#00e5a0" }}>
            {(explanation.base_value + data.reduce((s, d) => s + d.shap_value, 0)).toFixed(0)} kWh
          </span>
        </div>

        {/* Baseline row */}
        <div className="shap-row">
          <div className="shap-feat" style={{ color: "#2a5a3a" }}>Baseline</div>
          <div className="shap-track" style={{ position: "relative" }}>
            <div
              className="shap-fill dn"
              style={{ width: `${toPercent(explanation.base_value)}%` }}
            >
              {explanation.base_value.toLocaleString()} kWh
            </div>
          </div>
          <div className="shap-num" style={{ color: "#6a9a7a" }}>
            {explanation.base_value.toLocaleString()}
          </div>
        </div>

        {/* Feature rows */}
        {data.map((feature, i) => {
          const isUp = feature.shap_value > 0;
          const isAnimated = animatedBars.includes(i);
          const barWidth = Math.abs(feature.shap_value) / range * 80;

          return (
            <div
              key={i}
              className="shap-row"
              style={{
                opacity: isAnimated ? 1 : 0,
                transform: isAnimated ? "translateX(0)" : "translateX(-10px)",
                transition: "all 0.4s ease",
              }}
            >
              <div className="shap-feat">{feature.feature}</div>
              <div className="shap-track" style={{ position: "relative" }}>
                {/* Connector line showing cumulative position */}
                <div style={{
                  position: "absolute",
                  left: `${toPercent(feature.start)}%`,
                  top: 0,
                  width: isAnimated ? `${barWidth}%` : "0%",
                  height: "100%",
                  background: isUp ? "#ef444418" : "#00e5a015",
                  border: `1px solid ${isUp ? "#ef444440" : "#00e5a035"}`,
                  borderRadius: 5,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 6px",
                  justifyContent: isUp ? "flex-end" : "flex-start",
                  transition: "width 0.7s cubic-bezier(0.34,1.56,0.64,1)",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  fontSize: 10,
                  fontWeight: 600,
                  fontFamily: "'DM Mono',monospace",
                  color: isUp ? "#fca5a5" : "#7ae8c0",
                  boxSizing: "border-box",
                }}>
                  {isAnimated && `${isUp ? "+" : ""}${feature.shap_value.toFixed(0)} kWh`}
                </div>
              </div>
              <div className="shap-num" style={{ color: isUp ? "#fca5a5" : "#7ae8c0" }}>
                {isUp ? "+" : ""}{feature.shap_value.toFixed(0)}
              </div>
            </div>
          );
        })}

        {/* Final total row */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 0 0",
          borderTop: "1px solid #1a3d2066",
          marginTop: 4,
          fontSize: 10,
          color: "#2a5a3a",
          fontFamily: "'DM Mono',monospace",
        }}>
          <span>Baseline: <span style={{ color: "#6a9a7a" }}>{explanation.base_value.toLocaleString()} kWh</span></span>
          <span>Final: <span style={{ color: "#00e5a0" }}>
            {(explanation.base_value + data.reduce((s, d) => s + d.shap_value, 0)).toFixed(0)} kWh
          </span></span>
        </div>

        {/* Verdict */}
        {explanation.features.length > 0 && (
          <div style={{
            marginTop: 14,
            padding: "10px 14px",
            background: "#00e5a00a",
            borderRadius: 8,
            borderLeft: "3px solid #00e5a0",
            fontSize: 11,
            color: "#6a9a7a",
            fontFamily: "'DM Mono',monospace",
            lineHeight: 1.6,
          }}>
            Top driver: <span style={{ color: "#00e5a0" }}>{explanation.features[0].feature}</span>
            {" "}{explanation.features[0].direction === "up" ? "increases" : "decreases"} consumption by{" "}
            <span style={{ color: explanation.features[0].direction === "up" ? "#fca5a5" : "#7ae8c0" }}>
              {Math.abs(explanation.features[0].shap_value).toLocaleString()} kWh
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="sec-label">WHAT-IF SIMULATOR · RANDOM FOREST + SHAP</div>

      <div className="sim-grid">
        <div className="sim-field">
          <div className="sim-lbl">BUILDING TYPE</div>
          <select name="building_type" value={inputs.building_type} onChange={handleChange}>
            <option value="Commercial">Commercial</option>
            <option value="Industrial">Industrial</option>
            <option value="Residential">Residential</option>
          </select>
        </div>

        <div className="sim-field">
          <div className="sim-lbl">DAY TYPE</div>
          <select name="day_of_week" value={inputs.day_of_week} onChange={handleChange}>
            <option value="Weekday">Weekday</option>
            <option value="Weekend">Weekend</option>
          </select>
        </div>

        <div className="sim-field">
          <div className="sim-lbl">OCCUPANTS: {inputs.number_of_occupants}</div>
          <div className="sim-val">{inputs.number_of_occupants}</div>
          <input
            type="range" name="number_of_occupants"
            min="1" max="200" step="1"
            value={inputs.number_of_occupants}
            onChange={handleChange}
          />
        </div>

        <div className="sim-field">
          <div className="sim-lbl">TEMPERATURE (°C)</div>
          <div className="sim-val">{inputs.average_temperature}°C</div>
          <input
            type="range" name="average_temperature"
            min="10" max="45" step="0.5"
            value={inputs.average_temperature}
            onChange={handleChange}
          />
        </div>

        <div className="sim-field">
          <div className="sim-lbl">APPLIANCES</div>
          <div className="sim-val">{inputs.appliances_used}</div>
          <input
            type="range" name="appliances_used"
            min="1" max="100" step="1"
            value={inputs.appliances_used}
            onChange={handleChange}
          />
        </div>

        <div className="sim-field">
          <div className="sim-lbl">SQ FOOTAGE</div>
          <div className="sim-val">{inputs.square_footage.toLocaleString()}</div>
          <input
            type="range" name="square_footage"
            min="500" max="50000" step="500"
            value={inputs.square_footage}
            onChange={handleChange}
          />
        </div>
      </div>

      <button className="pred-btn" onClick={handlePredict} disabled={loading}>
        {loading ? "PREDICTING..." : "PREDICT ENERGY CONSUMPTION"}
      </button>

      {error && (
        <div style={{
          marginTop: 12,
          padding: "10px 14px",
          background: "#ef444415",
          border: "1px solid #ef444433",
          borderRadius: 8,
          color: "#fca5a5",
          fontSize: 12,
          fontFamily: "'DM Mono',monospace",
        }}>
          {error}
        </div>
      )}

      {prediction && (
        <div className="pred-result">
          <div className="pred-label">PREDICTED CONSUMPTION</div>
          <div className="pred-num" style={{ color: getPredColor(prediction.predicted_energy_kwh) }}>
            {prediction.predicted_energy_kwh.toLocaleString()} kWh
          </div>

          {/* Energy level bar */}
          <div style={{ marginTop: 12, marginBottom: 4 }}>
            <div style={{ height: 4, background: "#1a3d2066", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.min(100, (prediction.predicted_energy_kwh / 7000) * 100)}%`,
                background: getPredColor(prediction.predicted_energy_kwh),
                borderRadius: 2,
                transition: "width 0.8s ease",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#2a5a3a", marginTop: 4, fontFamily: "'DM Mono',monospace" }}>
              <span>0 kWh</span><span>3,500 kWh</span><span>7,000 kWh</span>
            </div>
          </div>

          <div className="pred-meta">
            <span>Model: <strong>Random Forest</strong></span>
            <span>Dataset: <strong style={{ color: "#d4a853" }}>ASHRAE</strong></span>
            <span>SHAP: <strong style={{ color: "#00e5a0" }}>Active</strong></span>
          </div>

          {/* SHAP Waterfall */}
          {explanation && (
            <div className="shap-card" style={{ marginTop: 16 }}>
              {renderWaterfall(explanation)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WhatIfSimulator;

/**
 * EnergyChart.jsx (Updated)
 * -------------------------
 * Now shows TWO lines per critical building:
 * 1. Actual energy consumption (from dataset)
 * 2. Predicted energy consumption (from ML model)
 *
 * Interview talking point:
 * "Added a predicted vs actual visualization by calling the ML prediction
 * endpoint for each data point and overlaying the results on the chart."
 */

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Scatter,
  ReferenceLine
} from "recharts";
import { predictEnergy } from "../services/api";
import { BUILDING_MAP } from "../utils/buildingConfig";

function EnergyChart({ data, anomalies, highlightBuilding }) {

  // ── STATE FOR PREDICTIONS ──
  // We store predicted values separately and merge them into chart data
  const [predictedData, setPredictedData] = useState({});
  const [showPrediction, setShowPrediction] = useState(true);

  // ── FETCH PREDICTIONS FOR HIGHLIGHTED BUILDING ──
  // Whenever the critical building changes, fetch new predictions
  // Interview concept: useEffect with dependency array
  // This runs every time highlightBuilding changes
  useEffect(() => {
    if (!highlightBuilding || highlightBuilding === "None") return;

    fetchPredictions(highlightBuilding);
  }, [highlightBuilding, data]);

  const fetchPredictions = async (building) => {
    // Get building type from our mapping
    const buildingType = BUILDING_MAP[building] || "Commercial";

    // Get the last 5 data points for this building
    const buildingData = data
      .filter(d => d.building === building)
      .slice(-5);

    if (buildingData.length === 0) return;

    // Fetch prediction for each data point
    // Interview concept: Promise.all — run multiple async calls in parallel
    // Much faster than awaiting them one by one in a loop
    const predictions = await Promise.all(
      buildingData.map(async (point) => {
        try {
          const result = await predictEnergy({
            building_type: buildingType,
            square_footage: point.square_footage || 20000,
            number_of_occupants: point.occupants || 50,
            appliances_used: point.appliances || 25,
            average_temperature: point.temperature || 22,
            day_of_week: point.day_type || "Weekday"
          });

          return {
            time: point.time,
            predicted: result.predicted_energy_kwh
          };
        } catch {
          return { time: point.time, predicted: null };
        }
      })
    );

    // Store predictions keyed by time
    const predMap = {};
    predictions.forEach(p => {
      if (p.predicted) predMap[p.time] = p.predicted;
    });

    setPredictedData(predMap);
  };

  // ── GROUP DATA BY TIME ──
  // Same as before — reshape array into time-keyed objects for Recharts
  const groupedData = [];

  data.forEach((item) => {
    const existing = groupedData.find(d => d.time === item.time);

    if (existing) {
      existing[item.building] = item.value;
      // Add predicted value if available for this time point
      if (item.building === highlightBuilding && predictedData[item.time]) {
        existing[`${item.building}_predicted`] = predictedData[item.time];
      }
    } else {
      const newPoint = {
        time: item.time,
        [item.building]: item.value
      };
      // Add predicted value
      if (item.building === highlightBuilding && predictedData[item.time]) {
        newPoint[`${item.building}_predicted`] = predictedData[item.time];
      }
      groupedData.push(newPoint);
    }
  });

  const buildings = [...new Set(data.map(d => d.building))];

  const colors = {
    "CSE Block": "#22c55e",
    "ECE Block": "#4ade80",
    "Mechanical Block": "#16a34a",
    "Library": "#10b981",
    "Admin Block": "#34d399",
    "Hostel Block": "#86efac"
  };

  // ── CRITICAL PULSE DOT ──
  let criticalPoint = [];
  if (highlightBuilding) {
    const latest = data
      .filter(d => d.building === highlightBuilding)
      .slice(-1);

    if (latest.length > 0) {
      criticalPoint = [{
        time: latest[0].time,
        value: latest[0].value
      }];
    }
  }

  const renderPulseDot = ({ cx, cy }) => (
    <g>
      <circle cx={cx} cy={cy} r={12} fill="red" opacity="0.2">
        <animate attributeName="r" from="6" to="18" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={5} fill="#ef4444" />
    </g>
  );

  // ── CUSTOM TOOLTIP ──
  // Interview concept: Custom Recharts tooltip
  // Shows both actual and predicted values when hovering
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div style={{
        background: "rgba(15, 23, 42, 0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "10px",
        padding: "12px"
      }}>
        <p style={{ color: "#6ee7b7", fontSize: "12px", marginBottom: "8px" }}>
           {label}
        </p>
        {payload.map((entry, i) => (
          <p key={i} style={{
            color: entry.color,
            fontSize: "12px",
            margin: "3px 0"
          }}>
            {entry.name.includes("predicted") ? " Predicted" : " Actual"}: {" "}
            <strong>{entry.value != null ? Number(entry.value).toFixed(0) : '—'} kWh</strong>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="card">
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <h2 style={{ color: "#bbf7d0", margin: 0 }}> Energy Monitor</h2>

        {/* Toggle prediction line */}
        {highlightBuilding && highlightBuilding !== "None" && (
          <button
            onClick={() => setShowPrediction(!showPrediction)}
            style={{
              background: showPrediction
                ? "rgba(139, 92, 246, 0.3)"
                : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(139, 92, 246, 0.5)",
              color: "#c4b5fd",
              padding: "6px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            {showPrediction ? " Hide Prediction" : " Show Prediction"}
          </button>
        )}
      </div>

      {/* ── LEGEND FOR PREDICTED VS ACTUAL ── */}
      {highlightBuilding && highlightBuilding !== "None" && showPrediction && (
        <div style={{
          display: "flex",
          gap: "20px",
          marginBottom: "10px",
          fontSize: "12px"
        }}>
          <span style={{ color: "#ef4444" }}>
            ── Actual ({highlightBuilding})
          </span>
          <span style={{ color: "#a78bfa" }}>
            ╌╌ Predicted ({highlightBuilding})
          </span>
        </div>
      )}

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={groupedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" stroke="#6ee7b7" tick={{ fontSize: 11 }} />
            <YAxis stroke="#6ee7b7" tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* ── ACTUAL LINES ── */}
            {buildings.map((b) => {
              const isProblem = b === highlightBuilding;
              return (
                <Line
                  key={b}
                  type="monotone"
                  dataKey={b}
                  stroke={isProblem ? "#ef4444" : colors[b]}
                  strokeWidth={isProblem ? 3 : 1.5}
                  opacity={isProblem ? 1 : 0.25}
                  dot={false}
                  isAnimationActive
                  animationDuration={800}
                />
              );
            })}

            {/* ── PREDICTED LINE (dashed purple) ── */}
            {highlightBuilding && highlightBuilding !== "None" && showPrediction && (
              <Line
                key={`${highlightBuilding}_predicted`}
                type="monotone"
                dataKey={`${highlightBuilding}_predicted`}
                stroke="#a78bfa"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                name={`${highlightBuilding} (predicted)`}
                isAnimationActive
                animationDuration={1000}
              />
            )}

            {/* ── CRITICAL PULSE DOT ── */}
            {highlightBuilding && (
              <Scatter data={criticalPoint} shape={renderPulseDot} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default EnergyChart;

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Scatter
} from "recharts";

function EnergyChart({ data, anomalies, highlightBuilding }) {

  // Group data by time
  const groupedData = [];

  data.forEach((item) => {
    const existing = groupedData.find(d => d.time === item.time);

    if (existing) {
      existing[item.building] = item.value;
    } else {
      groupedData.push({
        time: item.time,
        [item.building]: item.value
      });
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

  // 🔴 CRITICAL POINT
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

  // 🔥 Pulse dot
  const renderPulseDot = ({ cx, cy }) => (
    <g>
      <circle cx={cx} cy={cy} r={12} fill="red" opacity="0.2">
        <animate attributeName="r" from="6" to="18" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx={cx} cy={cy} r={5} fill="#ef4444" />
    </g>
  );

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={groupedData}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />

        {/* Lines */}
        {buildings.map((b) => {
          const isProblem = b === highlightBuilding;

          return (
            <Line
              key={b}
              type="monotone"
              dataKey={b}
              stroke={isProblem ? "#ef4444" : colors[b]}
              strokeWidth={isProblem ? 4 : 2}
              opacity={isProblem ? 1 : 0.3}
              dot={false}
              isAnimationActive
              animationDuration={800}
            />
          );
        })}

        {/* CRITICAL pulse */}
        {highlightBuilding && (
          <Scatter data={criticalPoint} shape={renderPulseDot} />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

export default EnergyChart;
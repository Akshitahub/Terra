import React, { useEffect, useState } from "react";

function TerraInsights({ stats, anomalies, energy }) {
  const [insight, setInsight] = useState("");
  const [insightTime, setInsightTime] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  if (stats && anomalies && energy) {
    generateInsight();
  }
}, [stats, anomalies, energy]);

  const generateInsight = () => {
    if (!stats || !anomalies || !energy) return;

    const anomalyCount = anomalies.length;
    const efficiency = stats.efficiency_percent;
    const totalEnergy = stats.total_energy_kwh;
    const avgEnergy = stats.avg_energy_kwh;

    const buildingAnomalies = {};
    anomalies.forEach(a => {
      buildingAnomalies[a.building] = (buildingAnomalies[a.building] || 0) + 1;
    });

    const criticalBuilding = Object.keys(buildingAnomalies).length > 0
      ? Object.keys(buildingAnomalies).reduce((a, b) =>
          buildingAnomalies[a] > buildingAnomalies[b] ? a : b)
      : null;

    const buildingAvg = {};
    const buildingCount = {};
    energy.forEach(e => {
      buildingAvg[e.building] = (buildingAvg[e.building] || 0) + e.value;
      buildingCount[e.building] = (buildingCount[e.building] || 0) + 1;
    });

    Object.keys(buildingAvg).forEach(b => {
      buildingAvg[b] = buildingAvg[b] / buildingCount[b];
    });

    const highestEnergyBuilding = Object.keys(buildingAvg).length > 0
      ? Object.keys(buildingAvg).reduce((a, b) =>
          buildingAvg[a] > buildingAvg[b] ? a : b)
      : null;

    const highestAvg = highestEnergyBuilding
      ? buildingAvg[highestEnergyBuilding].toFixed(0)
      : 0;

    const campusAvg = avgEnergy.toFixed(0);
    const percentAbove = highestEnergyBuilding
      ? (((buildingAvg[highestEnergyBuilding] - avgEnergy) / avgEnergy) * 100).toFixed(0)
      : 0;

    let text = "";

    if (anomalyCount === 0) {
      text = `Campus energy systems are operating normally. All ${Object.keys(buildingAvg).length} buildings are within expected consumption ranges. Total campus load is ${(totalEnergy / 1000).toFixed(1)} MWh with an efficiency rating of ${efficiency}%. No anomalies detected in the current monitoring window.`;
    } else if (anomalyCount < 5) {
     text = `Campus efficiency is at ${efficiency}% with ${anomalyCount} anomaly${anomalyCount !== 1 ? "s" : ""} detected. `;
      if (criticalBuilding) {
        text += `${criticalBuilding} is the primary concern with ${buildingAnomalies[criticalBuilding]} irregular reading${buildingAnomalies[criticalBuilding] > 1 ? "s" : ""}. `;
      }
      if (highestEnergyBuilding) {
        text += `${highestEnergyBuilding} is consuming an average of ${highestAvg} kWh, which is ${percentAbove}% above the campus mean of ${campusAvg} kWh. `;
      }
      text += `Total campus load stands at ${(totalEnergy / 1000).toFixed(1)} MWh. Monitoring recommended.`;
    } else {
      text = `Alert: Campus efficiency has dropped to ${efficiency}% with ${anomalyCount} anomalies detected across multiple zones. `;
      if (criticalBuilding) {
        text += `${criticalBuilding} is the most critical zone with ${buildingAnomalies[criticalBuilding]} flagged readings. `;
      }
      if (highestEnergyBuilding) {
        text += `${highestEnergyBuilding} is consuming ${percentAbove}% above average at ${highestAvg} kWh per reading. `;
      }
      text += `Immediate inspection of high-consumption zones is recommended. Total campus load is ${(totalEnergy / 1000).toFixed(1)} MWh.`;
    }

    setInsight(text);
    setInsightTime(new Date().toLocaleTimeString());
  };

  if (!insight) return null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "20px",
      borderLeft: "3px solid #22c55e",
      backdropFilter: "blur(10px)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px"
      }}>
        <div>
          <h2 style={{
            color: "#bbf7d0",
            margin: 0,
            fontSize: "18px",
            fontWeight: "600",
            letterSpacing: "1px"
          }}>
            Terra Insights
          </h2>
          <p style={{
            fontSize: "11px",
            color: "#6ee7b7",
            opacity: 0.6,
            margin: "3px 0 0 0",
            letterSpacing: "1px",
            textTransform: "uppercase"
          }}>
            AI-powered campus analysis
          </p>
        </div>

        <button
          onClick={generateInsight}
          style={{
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.3)",
            color: "#22c55e",
            padding: "6px 14px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "12px",
            letterSpacing: "0.5px"
          }}
        >
          Refresh
        </button>
      </div>

      <p style={{
        color: "#e2e8f0",
        fontSize: "14px",
        lineHeight: "1.8",
        margin: 0,
        opacity: 0.9
      }}>
        {insight}
      </p>

      <p style={{
        fontSize: "11px",
        color: "#6ee7b7",
        opacity: 0.4,
        margin: "12px 0 0 0"
      }}>
        Last updated: {insightTime}
      </p>
    </div>
  );
}

export default TerraInsights;

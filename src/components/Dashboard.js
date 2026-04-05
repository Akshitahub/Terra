import "./Dashboard.css";
import React, { useEffect, useState } from "react";
import { getEnergyData, getAnomalies, getStats } from "../services/api";
import EnergyChart from "./EnergyChart";
import CampusMap from "./CampusMap";
import WhatIfSimulator from "./WhatIfSimulator";
import TerraInsights from "./TerraInsights";

function Dashboard() {
  const [energy, setEnergy] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState("All");
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [energyData, anomalyData, statsData] = await Promise.all([
        getEnergyData(),
        getAnomalies(),
        getStats()
      ]);

      setEnergy(energyData);
      setAnomalies(anomalyData);
      setStats(statsData);
      setFetchError(null);
    } catch (error) {
      console.error("Error fetching data:", error);
      setFetchError(error.message || "Unknown error");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const filteredEnergy = selectedBuilding === "All"
    ? energy
    : energy.filter(e => e.building === selectedBuilding);

  const filteredAnomalies = selectedBuilding === "All"
    ? anomalies
    : anomalies.filter(a => a.building === selectedBuilding);

  const efficiency = stats?.efficiency_percent ?? Math.max(0, 100 - anomalies.length * 3);

  const getProblematicBuilding = () => {
    if (anomalies.length === 0) return "None";
    const count = {};
    anomalies.forEach(a => {
      count[a.building] = (count[a.building] || 0) + 1;
    });
    return Object.keys(count).reduce((a, b) => count[a] > count[b] ? a : b);
  };

  const problemName = getProblematicBuilding();

  if (loading) return (
    <div className="loading-spinner">
      <h2 style={{ color: "#6ee7b7" }}>Initializing Terra...</h2>
      <p style={{ color: "#6ee7b7", opacity: 0.6 }}>Connecting to ML backend...</p>
    </div>
  );

  if (fetchError) return (
    <div className="loading-spinner">
      <h2 style={{ color: "#ef4444" }}>Backend Error</h2>
      <p style={{ color: "#fca5a5", maxWidth: "500px", textAlign: "center" }}>
        {fetchError}
      </p>
      <p style={{ color: "#6ee7b7", fontSize: "13px", marginTop: "10px" }}>
        Make sure Flask is running: <code>python app.py</code> in the backend folder
      </p>
      <button
        onClick={fetchData}
        style={{
          marginTop: "20px",
          padding: "10px 24px",
          background: "#22c55e",
          border: "none",
          borderRadius: "8px",
          color: "white",
          cursor: "pointer",
          fontSize: "14px"
        }}
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="dashboard">
      <h1 className="title">Terra</h1>
      <p className="subtitle">Smart Campus Digital Twin · ML Powered</p>

      <TerraInsights
        stats={stats}
        anomalies={anomalies}
        energy={energy}
      />

      <div className="kpi-container">
        <div className="kpi-card">
          <p>Efficiency</p>
          <h2 className={efficiency > 80 ? "healthy" : efficiency > 50 ? "warning" : "critical"}>
            {efficiency}%
          </h2>
        </div>
        <div className="kpi-card">
          <p>Anomalies</p>
          <h2 className={anomalies.length === 0 ? "healthy" : anomalies.length < 5 ? "warning" : "critical"}>
            {anomalies.length}
          </h2>
        </div>
        <div className="kpi-card">
          <p>Total Energy</p>
          <h2>{stats ? `${(stats.total_energy_kwh / 1000).toFixed(1)}MWh` : "..."}</h2>
        </div>
        <div className="kpi-card">
          <p>Critical Zone</p>
          <h2 className={problemName === "None" ? "healthy" : "critical"} style={{ fontSize: "14px" }}>
            {problemName}
          </h2>
        </div>
      </div>

      <EnergyChart
        data={filteredEnergy}
        anomalies={filteredAnomalies}
        highlightBuilding={problemName}
      />

      <WhatIfSimulator />

      <CampusMap
        energy={energy}
        anomalies={anomalies}
        onSelectBuilding={setSelectedBuilding}
        selectedBuilding={selectedBuilding}
      />

      {filteredAnomalies.length > 0 && (
        <div className="card">
          <h2 style={{ color: "#bbf7d0", marginBottom: "15px" }}>Active Alerts</h2>
          <div className="alerts">
            {filteredAnomalies.slice(0, 5).map((alert, i) => (
              <div
                key={i}
                className={`alert ${alert.severity === "high" ? "alert-high" : "alert-medium"}`}
              >
                <span>
                  {alert.building} — {alert.value} kWh
                </span>
                <span style={{ fontSize: "11px", opacity: 0.6 }}>
                  Score: {alert.anomaly_score} · {alert.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;
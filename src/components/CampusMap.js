import React from "react";

function CampusMap({ energy, anomalies, onSelectBuilding, selectedBuilding }) {

  const buildings = [...new Set(energy.map(e => e.building))];

  const anomalyCount = {};
  anomalies.forEach(a => {
    anomalyCount[a.building] = (anomalyCount[a.building] || 0) + 1;
  });

  const getStatus = (b) => {
    const count = anomalyCount[b] || 0;
    if (count > 2) return "critical";
    if (count > 0) return "warning";
    return "normal";
  };

  return (
    <div className="map-card">
      <h2>Campus Map</h2>

      {/* Reset */}
      <div
        className={`map-item ${selectedBuilding === "All" ? "active" : ""}`}
        onClick={() => onSelectBuilding("All")}
      >
        <span className="dot normal"></span>
        <strong>All Buildings</strong>
      </div>

      <div className="map-grid">
        {buildings.map((b, i) => (
          <div
            key={i}
            className={`map-item ${selectedBuilding === b ? "active" : ""}`}
            onClick={() => onSelectBuilding(b)}
          >
            <span className={`dot ${getStatus(b)}`}></span>
            <span>{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CampusMap;
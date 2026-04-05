import React, { useEffect, useRef } from "react";

// IGDTUW building coordinates (Kashmere Gate, Delhi)
const BUILDING_COORDS = {
  "CSE Block":        [28.6685, 77.2282],
  "ECE Block":        [28.6688, 77.2290],
  "Mechanical Block": [28.6692, 77.2278],
  "Library":          [28.6679, 77.2285],
  "Admin Block":      [28.6681, 77.2295],
  "Hostel Block":     [28.6675, 77.2300],
};

const CAMPUS_CENTER = [28.6683, 77.2288];

function CampusMap({ energy, anomalies, onSelectBuilding, selectedBuilding, buildingAvgEnergy, anomalyCount }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  const getStatus = (building) => {
    const count = anomalyCount[building] || 0;
    if (count > 2) return "critical";
    if (count > 0) return "warning";
    return "normal";
  };

  const getColor = (status) => {
    if (status === "critical") return "#ef4444";
    if (status === "warning") return "#d4a853";
    return "#00e5a0";
  };

  const createMarkerIcon = (status, isSelected) => {
    const color = getColor(status);
    const size = isSelected ? 16 : 12;
    const pulse = status === "critical";

    const svg = `
      <svg width="${size + 8}" height="${size + 8}" viewBox="0 0 ${size + 8} ${size + 8}" xmlns="http://www.w3.org/2000/svg">
        ${pulse ? `<circle cx="${(size + 8) / 2}" cy="${(size + 8) / 2}" r="${size / 2 + 3}" fill="${color}" opacity="0.2">
          <animate attributeName="r" values="${size / 2}; ${size / 2 + 5}; ${size / 2}" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.4; 0; 0.4" dur="1.5s" repeatCount="indefinite"/>
        </circle>` : ""}
        <circle cx="${(size + 8) / 2}" cy="${(size + 8) / 2}" r="${size / 2}"
          fill="${color}" stroke="${isSelected ? "#ffffff" : color}"
          stroke-width="${isSelected ? 2 : 1}" opacity="${isSelected ? 1 : 0.85}"/>
      </svg>
    `;

    // Return as Leaflet divIcon — we'll use L from window
    return window.L.divIcon({
      html: svg,
      className: "",
      iconSize: [size + 8, size + 8],
      iconAnchor: [(size + 8) / 2, (size + 8) / 2],
    });
  };

  const createPopupContent = (building, status, avgEnergy, count) => {
    const color = getColor(status);
    return `
      <div style="
        background:#0a1a0f;
        border:1px solid ${color}44;
        border-left:3px solid ${color};
        border-radius:8px;
        padding:12px 14px;
        font-family:'DM Mono',monospace;
        min-width:180px;
      ">
        <div style="font-size:11px;letter-spacing:2px;color:${color};margin-bottom:8px;">
          ${building.toUpperCase()}
        </div>
        <div style="font-size:18px;font-weight:700;color:${color};margin-bottom:4px;">
          ${avgEnergy ? avgEnergy.toLocaleString() + " kWh" : "— kWh"}
        </div>
        <div style="font-size:10px;color:#4a7a5a;">
          ${count > 0 ? `${count} anomaly flag${count > 1 ? "s" : ""} · ` : ""}${status.toUpperCase()}
        </div>
      </div>
    `;
  };

  useEffect(() => {
    // Load Leaflet CSS dynamically
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS dynamically
    const loadLeaflet = () => {
      return new Promise((resolve) => {
        if (window.L) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    };

    loadLeaflet().then(() => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const L = window.L;

      // Init map
      const map = L.map(mapRef.current, {
        center: CAMPUS_CENTER,
        zoom: 17,
        zoomControl: true,
        attributionControl: false,
      });

      // CartoDB Dark Matter tiles — matches TERRA theme perfectly
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 20,
      }).addTo(map);

      // Attribution (small, styled)
      L.control.attribution({ prefix: false, position: "bottomright" })
        .addAttribution('<span style="color:#2a5a3a;font-size:9px">© CartoDB · OSM</span>')
        .addTo(map);

      mapInstanceRef.current = map;

      // Add markers for each building
      Object.entries(BUILDING_COORDS).forEach(([building, coords]) => {
        const status = getStatus(building);
        const avgEnergy = buildingAvgEnergy?.[building];
        const count = anomalyCount?.[building] || 0;
        const isSelected = selectedBuilding === building;

        const marker = L.marker(coords, {
          icon: createMarkerIcon(status, isSelected),
        }).addTo(map);

        marker.bindPopup(
          createPopupContent(building, status, avgEnergy, count),
          {
            className: "terra-popup",
            closeButton: false,
            maxWidth: 220,
          }
        );

        marker.on("click", () => {
          onSelectBuilding(building);
        });

        markersRef.current[building] = marker;
      });

      // Add campus boundary circle
      L.circle(CAMPUS_CENTER, {
        radius: 120,
        color: "#00e5a0",
        fillColor: "#00e5a0",
        fillOpacity: 0.03,
        weight: 1,
        dashArray: "4 4",
        opacity: 0.3,
      }).addTo(map);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = {};
      }
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    Object.entries(BUILDING_COORDS).forEach(([building, coords]) => {
      const marker = markersRef.current[building];
      if (!marker) return;
      const status = getStatus(building);
      const isSelected = selectedBuilding === building;
      marker.setIcon(createMarkerIcon(status, isSelected));
      const avgEnergy = buildingAvgEnergy?.[building];
      const count = anomalyCount?.[building] || 0;
      marker.setPopupContent(createPopupContent(building, status, avgEnergy, count));
    });
  }, [anomalies, selectedBuilding, buildingAvgEnergy, anomalyCount]);

  const buildings = Object.keys(BUILDING_COORDS);

  return (
    <div className="map-card">
      <div className="sec-label">IGDTUW CAMPUS · KASHMERE GATE, DELHI</div>

      {/* Leaflet Map */}
      <div
        ref={mapRef}
        style={{ height: 340, borderRadius: 10, border: "1px solid #1a3d2044", marginBottom: 14 }}
      />

      {/* Building list */}
      <div className="building-list">
        <div
          className={`building-row ${selectedBuilding === "All" ? "active" : ""}`}
          onClick={() => onSelectBuilding("All")}
        >
          <span className="bdot" style={{ background: "#00e5a0" }} />
          <span>All Buildings</span>
        </div>
        {buildings.map((b, i) => {
          const status = getStatus(b);
          const color = getColor(status);
          const avg = buildingAvgEnergy?.[b];
          return (
            <div
              key={i}
              className={`building-row ${selectedBuilding === b ? "active" : ""}`}
              onClick={() => {
                onSelectBuilding(b);
                const marker = markersRef.current[b];
                if (marker && mapInstanceRef.current) {
                  mapInstanceRef.current.setView(BUILDING_COORDS[b], 18, { animate: true });
                  marker.openPopup();
                }
              }}
            >
              <span
                className="bdot"
                style={{
                  background: color,
                  animation: status === "critical" ? "lpulse 1s infinite" : "none",
                }}
              />
              <span>{b}</span>
              {avg && (
                <span className="benergy" style={{ color }}>
                  {avg.toLocaleString()} kWh
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Leaflet popup styles injected */}
      <style>{`
        .terra-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .terra-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .terra-popup .leaflet-popup-tip-container {
          display: none !important;
        }
        .leaflet-control-zoom a {
          background: #0a1a0f !important;
          border-color: #1a3d2066 !important;
          color: #00e5a0 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #1a3d20 !important;
        }
      `}</style>
    </div>
  );
}

export default CampusMap;

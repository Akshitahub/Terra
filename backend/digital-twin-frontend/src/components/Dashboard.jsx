import "./Dashboard.css";
import React, { useEffect, useState, useRef } from "react";
import { getEnergyData, getAnomalies, getStats } from "../services/api";
import EnergyChart from "./EnergyChart";
import CampusMap from "./CampusMap";
import WhatIfSimulator from "./WhatIfSimulator";
import TerraInsights from "./TerraInsights";
import StackTab from "./StackTab";

const TABS = ["OVERVIEW", "ENERGY", "CAMPUS MAP", "SIMULATOR", "ALERTS", "STACK & ARCH"];

function Dashboard() {
  const [energy, setEnergy] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState("All");
  const [fetchError, setFetchError] = useState(null);
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [clock, setClock] = useState("");
  const canvasRef = useRef(null);

  // ── CLOCK ──
  useEffect(() => {
    const tick = () => setClock(new Date().toTimeString().slice(0, 8));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── PARTICLE CANVAS ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pts = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "#00e5a0";
        ctx.fill();
      });
      pts.forEach((p, i) => {
        pts.slice(i + 1).forEach((q) => {
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(0,229,160,${(1 - d / 120) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ── DATA FETCHING ──
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
        getStats(),
      ]);
      setEnergy(energyData);
      setAnomalies(anomalyData);
      setStats(statsData);
      setFetchError(null);
    } catch (error) {
      console.error("Fetch error:", error);
      setFetchError(error.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const filteredEnergy = selectedBuilding === "All"
    ? energy
    : energy.filter((e) => e.building === selectedBuilding);

  const filteredAnomalies = selectedBuilding === "All"
    ? anomalies
    : anomalies.filter((a) => a.building === selectedBuilding);

  const efficiency = stats?.efficiency_percent ?? Math.max(0, 100 - anomalies.length * 3);

  const getProblematicBuilding = () => {
    if (anomalies.length === 0) return "None";
    const count = {};
    anomalies.forEach((a) => { count[a.building] = (count[a.building] || 0) + 1; });
    return Object.keys(count).reduce((a, b) => (count[a] > count[b] ? a : b));
  };

  const problemName = getProblematicBuilding();

  // ── BUILDING ENERGY MAP for campus map ──
  const buildingEnergyMap = {};
  energy.forEach((e) => {
    if (!buildingEnergyMap[e.building]) buildingEnergyMap[e.building] = [];
    buildingEnergyMap[e.building].push(e.value);
  });
  const buildingAvgEnergy = {};
  Object.keys(buildingEnergyMap).forEach((b) => {
    const vals = buildingEnergyMap[b];
    buildingAvgEnergy[b] = Math.round(vals.reduce((a, c) => a + c, 0) / vals.length);
  });

  // ── ANOMALY COUNT per building ──
  const anomalyCount = {};
  anomalies.forEach((a) => { anomalyCount[a.building] = (anomalyCount[a.building] || 0) + 1; });

  if (loading) return (
    <div className="terra-app">
      <canvas ref={canvasRef} id="terra-canvas" />
      <div className="terra-loading">
        <h2>INITIALIZING TERRA</h2>
        <p>Connecting to ML backend...</p>
      </div>
    </div>
  );

  if (fetchError) return (
    <div className="terra-app">
      <canvas ref={canvasRef} id="terra-canvas" />
      <div className="terra-error">
        <h2>Backend Offline</h2>
        <p>{fetchError}</p>
        <p>Make sure Flask is running: <code>python app.py</code></p>
        <button className="retry-btn" onClick={fetchData}>Retry</button>
      </div>
    </div>
  );

  return (
    <div className="terra-app">
      {/* Particle canvas */}
      <canvas ref={canvasRef} id="terra-canvas" />

      {/* ── HEADER ── */}
      <header className="terra-header">
        <div className="hdr-left">
          <span className="hdr-author">Akshita Singh</span>
          <a
            className="hdr-gh"
            href="https://github.com/Akshitahub"
            target="_blank"
            rel="noreferrer"
          >
            github.com/Akshitahub ↗
          </a>
        </div>

        <div className="hdr-center">
          <div className="logo-leaf">
            <svg viewBox="0 0 36 36" fill="none">
              <path
                d="M18 4 C10 4 4 12 4 20 C4 28 10 32 18 32 C18 32 18 20 28 12 C24 6 18 4 18 4Z"
                fill="#00e5a022"
                stroke="#00e5a0"
                strokeWidth="1.2"
              />
              <path
                d="M18 32 C18 32 18 20 10 14"
                stroke="#00e5a066"
                strokeWidth="1"
                strokeLinecap="round"
              />
              <circle cx="18" cy="32" r="2" fill="#00e5a0" />
            </svg>
          </div>
          <div>
            <div className="logo-name">TERRA</div>
            <div className="logo-tagline">SMART CAMPUS DIGITAL TWIN · IGDTUW</div>
          </div>
        </div>

        <div className="hdr-right">
          <div className="live-pill">
            <span className="ldot" />
            <span className="mono">{clock}</span>
          </div>
        </div>
      </header>

      {/* ── TABS ── */}
      <nav className="terra-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`terra-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === "ALERTS" && anomalies.length > 0 && (
              <span className="tab-badge">{anomalies.length}</span>
            )}
          </button>
        ))}
      </nav>

      {/* ── CONTENT ── */}
      <main className="terra-content">

        {/* OVERVIEW */}
        {activeTab === "OVERVIEW" && (
          <div>
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-corner" />
                <div className="kpi-label">EFFICIENCY</div>
                <div className={`kpi-val ${efficiency > 80 ? "green" : efficiency > 50 ? "amber" : "red"}`}>
                  {efficiency}%
                </div>
                <div className="kpi-sub">campus performance</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-corner" />
                <div className="kpi-label">ANOMALIES</div>
                <div className={`kpi-val ${anomalies.length === 0 ? "green" : anomalies.length < 5 ? "amber" : "red"}`}>
                  {anomalies.length}
                </div>
                <div className="kpi-sub">across all zones</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-corner" />
                <div className="kpi-label">TOTAL ENERGY</div>
                <div className="kpi-val green">
                  {stats ? `${(stats.total_energy_kwh / 1000).toFixed(1)}` : "—"}
                  <span style={{ fontSize: 14 }}>MWh</span>
                </div>
                <div className="kpi-sub">campus load</div>
              </div>
              <div className={`kpi-card ${problemName !== "None" ? "critical" : ""}`}>
                <div className="kpi-corner" />
                <div className="kpi-label">CRITICAL ZONE</div>
                <div className={`kpi-val ${problemName === "None" ? "green" : "red"}`} style={{ fontSize: 15, marginTop: 4 }}>
                  {problemName}
                </div>
                <div className="kpi-sub" style={{ color: problemName !== "None" ? "#ef444466" : undefined }}>
                  {problemName !== "None" ? `${anomalyCount[problemName] || 0} flags detected` : "all systems normal"}
                </div>
              </div>
            </div>

            <TerraInsights stats={stats} anomalies={anomalies} energy={energy} />

            <div className="chart-card">
              <div className="sec-label">LIVE ENERGY FEED</div>
              <EnergyChart
                data={filteredEnergy}
                anomalies={filteredAnomalies}
                highlightBuilding={problemName}
              />
            </div>
          </div>
        )}

        {/* ENERGY */}
        {activeTab === "ENERGY" && (
          <div>
            <div className="sec-label">REAL-TIME ENERGY · ALL BUILDINGS</div>
            <div className="chart-card">
              <EnergyChart
                data={energy}
                anomalies={anomalies}
                highlightBuilding={problemName}
              />
            </div>
            {stats?.building_stats && (
              <div className="chart-card" style={{ marginTop: 0 }}>
                <div className="sec-label">BUILDING BREAKDOWN</div>
                {stats.building_stats.map((b, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span className="mono" style={{ fontSize: 11, color: "#6a9a7a" }}>{b.building}</span>
                      <span className="mono" style={{ fontSize: 11, color: "#00e5a0" }}>{b.avg_energy} kWh avg</span>
                    </div>
                    <div style={{ height: 4, background: "#1a3d2066", borderRadius: 2 }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.min(100, (b.avg_energy / 6000) * 100)}%`,
                        background: b.avg_energy > 4500 ? "#ef4444" : b.avg_energy > 3000 ? "#d4a853" : "#00e5a0",
                        borderRadius: 2,
                        transition: "width 0.6s ease"
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CAMPUS MAP */}
        {activeTab === "CAMPUS MAP" && (
          <CampusMap
            energy={energy}
            anomalies={anomalies}
            onSelectBuilding={setSelectedBuilding}
            selectedBuilding={selectedBuilding}
            buildingAvgEnergy={buildingAvgEnergy}
            anomalyCount={anomalyCount}
          />
        )}

        {/* SIMULATOR */}
        {activeTab === "SIMULATOR" && <WhatIfSimulator />}

        {/* ALERTS */}
        {activeTab === "ALERTS" && (
          <div>
            <div className="sec-label">ANOMALY HEATMAP</div>
            <div className="alert-hmap">
              {Object.keys(anomalyCount).length === 0 ? (
                <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#2a5a3a", fontFamily: "'DM Mono',monospace", fontSize: 12, padding: 20 }}>
                  No anomalies detected — all systems normal
                </div>
              ) : (
                Object.entries(anomalyCount)
                  .sort((a, b) => b[1] - a[1])
                  .map(([building, count], i) => {
                    const isHigh = count > 2;
                    const isMed = count > 0;
                    const color = isHigh ? "#ef4444" : isMed ? "#d4a853" : "#00e5a0";
                    const bg = isHigh ? "#ef444418" : isMed ? "#d4a85318" : "#00e5a010";
                    const border = isHigh ? "#ef444444" : isMed ? "#d4a85333" : "#00e5a022";
                    return (
                      <div key={i} className="hmap-cell" style={{ background: bg, borderColor: border }}>
                        <div className="hmap-name" style={{ color }}>{building.toUpperCase()}</div>
                        <div className="hmap-val" style={{ color }}>{buildingAvgEnergy[building] || "—"} kWh</div>
                        <div className="hmap-sub" style={{ color }}>{count} flag{count !== 1 ? "s" : ""} · {isHigh ? "CRITICAL" : "MEDIUM"}</div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="sec-label">ACTIVE ALERTS · {anomalies.length} DETECTED</div>
            {anomalies.length === 0 ? (
              <div style={{ textAlign: "center", color: "#2a5a3a", fontFamily: "'DM Mono',monospace", fontSize: 12, padding: 20 }}>
                No active alerts
              </div>
            ) : (
              anomalies.slice(0, 8).map((alert, i) => {
                const sev = alert.severity === "high" ? "high" : "medium";
                return (
                  <div key={i} className={`acard ${sev}`}>
                    <div className="acard-top">
                      <span className={`acard-name ${sev}`}>{alert.building}</span>
                      <span className={`abadge ${sev}`}>{sev.toUpperCase()}</span>
                    </div>
                    <div className="abar" style={{
                      width: `${Math.min(100, Math.abs(alert.anomaly_score) * 40)}%`,
                      background: sev === "high" ? "#ef444466" : "#d4a85355"
                    }} />
                    <div style={{ display: "flex", gap: 14, fontSize: 10, marginBottom: 5 }}>
                      <span style={{ color: sev === "high" ? "#fca5a5" : "#e8c87a" }}>{alert.value} kWh</span>
                      <span style={{ color: "#2a5a3a" }}>Score: {alert.anomaly_score}</span>
                    </div>
                    <div className="ameta">
                      <span>{alert.time}</span>
                      <span>Isolation Forest</span>
                    </div>
                  </div>
                );
              })
            )}

            {anomalies.length > 0 && (
              <>
                <div className="sec-label" style={{ marginTop: 16 }}>DETECTION TIMELINE</div>
                <div className="timeline">
                  {anomalies.slice(0, 5).map((alert, i) => (
                    <div key={i} className="tl-item">
                      <div className="tl-dot" style={{
                        background: alert.severity === "high" ? "#ef4444" : "#d4a853",
                        animation: i === 0 ? "lpulse 1s infinite" : "none"
                      }} />
                      <div className="tl-time">{alert.time}</div>
                      <div className="tl-text" style={{ color: alert.severity === "high" ? "#fca5a5" : "#e8c87a" }}>
                        {alert.building} flagged · score {alert.anomaly_score}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* STACK & ARCH */}
        {activeTab === "STACK & ARCH" && <StackTab />}

      </main>

      {/* ── FOOTER ── */}
      <footer className="terra-footer">
        <div className="footer-left">
          Built by{" "}
          <a href="https://github.com/Akshitahub" target="_blank" rel="noreferrer">
            Akshita Singh
          </a>{" "}
          · IGDTUW · Full Stack AI/ML Engineer
        </div>
        <div className="footer-right">TERRA v2.0 · ASHRAE · GCP · Vercel</div>
      </footer>
    </div>
  );
}

export default Dashboard;

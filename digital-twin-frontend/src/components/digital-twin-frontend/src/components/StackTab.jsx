import React from "react";

function StackTab() {
  return (
    <div>
      <div className="sec-label">CLOUD ARCHITECTURE · END-TO-END PIPELINE</div>

      <div className="arch-card">
        <div style={{ fontSize: 10, color: "#4a7a5a", fontFamily: "'DM Mono',monospace", marginBottom: 14 }}>
          Data → ML → Cloud → Dashboard
        </div>
        <div className="arch-flow">
          <div className="arch-node">
            <b style={{ color: "#d4a853" }}>ASHRAE</b>
            <span>Kaggle Dataset</span>
          </div>
          <div className="arch-arr">→</div>
          <div className="arch-node">
            <b>Pandas / sklearn</b>
            <span>Preprocessing + ETL</span>
          </div>
          <div className="arch-arr">→</div>
          <div className="arch-node">
            <b>Random Forest</b>
            <span>+ Isolation Forest</span>
          </div>
          <div className="arch-arr">→</div>
          <div className="arch-node cloud">
            <b>Flask API</b>
            <span>GCP Cloud Run</span>
          </div>
          <div className="arch-arr">→</div>
          <div className="arch-node cloud">
            <b>BigQuery</b>
            <span>Data Warehouse</span>
          </div>
          <div className="arch-arr">→</div>
          <div className="arch-node">
            <b>TERRA</b>
            <span>React · Vercel</span>
          </div>
        </div>

        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#d4a85310",
          border: "1px solid #d4a85333",
          borderRadius: 6,
          padding: "5px 10px",
          fontSize: 9,
          fontFamily: "'DM Mono',monospace",
          color: "#d4a853",
          marginTop: 14,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#d4a853", display: "inline-block" }} />
          Dataset: ASHRAE Energy Prediction · Kaggle · 1,449 buildings · 20M+ readings
        </div>
      </div>

      <div className="stack-section">
        <div className="stack-block">
          <div className="stack-block-title">ML & DATA</div>
          <div className="stack-item"><span className="sdot green" />Python 3.11</div>
          <div className="stack-item"><span className="sdot green" />scikit-learn (Random Forest, Isolation Forest)</div>
          <div className="stack-item"><span className="sdot green" />SHAP — TreeExplainer</div>
          <div className="stack-item"><span className="sdot green" />Pandas · NumPy</div>
          <div className="stack-item"><span className="sdot amber" />ASHRAE Energy Dataset (Kaggle)</div>
          <div className="stack-item"><span className="sdot green" />joblib (model persistence)</div>
        </div>

        <div className="stack-block">
          <div className="stack-block-title">BACKEND & CLOUD</div>
          <div className="stack-item"><span className="sdot purple" />Flask 3.0 (REST API)</div>
          <div className="stack-item"><span className="sdot purple" />GCP Cloud Run (Serverless)</div>
          <div className="stack-item"><span className="sdot purple" />BigQuery (Data Warehouse)</div>
          <div className="stack-item"><span className="sdot purple" />Docker + gunicorn</div>
          <div className="stack-item"><span className="sdot green" />Vercel (Frontend Deploy)</div>
          <div className="stack-item"><span className="sdot purple" />Flask-CORS</div>
        </div>

        <div className="stack-block">
          <div className="stack-block-title">FRONTEND</div>
          <div className="stack-item"><span className="sdot green" />React 18</div>
          <div className="stack-item"><span className="sdot green" />Recharts (actual vs predicted)</div>
          <div className="stack-item"><span className="sdot green" />Leaflet.js (campus map)</div>
          <div className="stack-item"><span className="sdot green" />axios (API calls)</div>
          <div className="stack-item"><span className="sdot amber" />DM Mono + Syne (typography)</div>
          <div className="stack-item"><span className="sdot green" />Canvas particle system</div>
        </div>

        <div className="stack-block">
          <div className="stack-block-title">ABOUT THIS PROJECT</div>
          <div className="stack-item"><span className="sdot green" />Smart Campus Digital Twin for IGDTUW</div>
          <div className="stack-item"><span className="sdot amber" />Anomaly detection — Isolation Forest</div>
          <div className="stack-item"><span className="sdot green" />Energy forecasting — Random Forest</div>
          <div className="stack-item"><span className="sdot green" />SHAP waterfall explainability</div>
          <div className="stack-item"><span className="sdot green" />Actual vs predicted overlay chart</div>
          <div className="stack-item"><span className="sdot purple" />Built by Akshita Singh · IGDTUW</div>
        </div>
      </div>

      {/* Model metrics note */}
      <div style={{
        background: "#0a1a0f",
        border: "1px solid #1a3d2066",
        borderLeft: "3px solid #00e5a0",
        borderRadius: 12,
        padding: 16,
        fontFamily: "'DM Mono',monospace",
      }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: "#2a5a3a", marginBottom: 10 }}>MODEL PERFORMANCE · RANDOM FOREST</div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 9, color: "#2a5a3a", marginBottom: 4 }}>METRIC</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#00e5a0" }}>MAE</div>
            <div style={{ fontSize: 9, color: "#4a7a5a", marginTop: 2 }}>Mean Abs Error</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: "#2a5a3a", marginBottom: 4 }}>METRIC</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#00e5a0" }}>RMSE</div>
            <div style={{ fontSize: 9, color: "#4a7a5a", marginTop: 2 }}>Root Mean Sq Error</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: "#2a5a3a", marginBottom: 4 }}>METRIC</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#00e5a0" }}>R²</div>
            <div style={{ fontSize: 9, color: "#4a7a5a", marginTop: 2 }}>R-squared score</div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ fontSize: 10, color: "#4a7a5a", lineHeight: 1.7 }}>
              Metrics printed to console on first <span style={{ color: "#00e5a0" }}>python app.py</span> run.
              Check terminal output for exact values from your trained model.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StackTab;

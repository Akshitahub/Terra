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
          <div className="arch-node"><b style={{ color: "#d4a853" }}>ASHRAE</b><span>Kaggle Dataset</span></div>
          <div className="arch-arr">→</div>
          <div className="arch-node"><b>Pandas / sklearn</b><span>Preprocessing + ETL</span></div>
          <div className="arch-arr">→</div>
          <div className="arch-node"><b>Random Forest</b><span>+ Isolation Forest</span></div>
          <div className="arch-arr">→</div>
          <div className="arch-node cloud"><b>Flask API</b><span>GCP Cloud Run</span></div>
          <div className="arch-arr">→</div>
          <div className="arch-node cloud"><b>BigQuery</b><span>Data Warehouse</span></div>
          <div className="arch-arr">→</div>
          <div className="arch-node"><b>TERRA</b><span>React · Vercel</span></div>
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
        </div>
        <div className="stack-block">
          <div className="stack-block-title">BACKEND & CLOUD</div>
          <div className="stack-item"><span className="sdot purple" />Flask 3.0 (REST API)</div>
          <div className="stack-item"><span className="sdot purple" />GCP Cloud Run (Serverless)</div>
          <div className="stack-item"><span className="sdot purple" />BigQuery (Data Warehouse)</div>
          <div className="stack-item"><span className="sdot purple" />Docker + gunicorn</div>
          <div className="stack-item"><span className="sdot green" />Vercel (Frontend Deploy)</div>
        </div>
        <div className="stack-block">
          <div className="stack-block-title">FRONTEND</div>
          <div className="stack-item"><span className="sdot green" />React 18</div>
          <div className="stack-item"><span className="sdot green" />Recharts (actual vs predicted)</div>
          <div className="stack-item"><span className="sdot green" />Leaflet.js (campus map)</div>
          <div className="stack-item"><span className="sdot green" />axios (API calls)</div>
          <div className="stack-item"><span className="sdot amber" />DM Mono + Syne (typography)</div>
        </div>
        <div className="stack-block">
          <div className="stack-block-title">ABOUT THIS PROJECT</div>
          <div className="stack-item"><span className="sdot green" />Smart Campus Digital Twin for IGDTUW</div>
          <div className="stack-item"><span className="sdot amber" />Anomaly detection — Isolation Forest</div>
          <div className="stack-item"><span className="sdot green" />Energy forecasting — Random Forest</div>
          <div className="stack-item"><span className="sdot green" />SHAP waterfall explainability</div>
          <div className="stack-item"><span className="sdot purple" />Built by Akshita Singh · IGDTUW</div>
        </div>
      </div>
    </div>
  );
}

export default StackTab;

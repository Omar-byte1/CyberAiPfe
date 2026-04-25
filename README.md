# CyberAI (Système Automatisé de Collecte et de Contextualisation de Données de Cybermenaces)

![CyberAI UI Preview](frontend/nextjs-dashboard/public/logo.png)

## 📌 Overview
**CyberAI** is a comprehensive, production-ready Security Operations Center (SOC) dashboard. It bridges the gap between raw threat intelligence and actionable insights by automating the collection, parsing, and correlation of cyber threat data. 

The platform leverages **Machine Learning (Isolation Forests)** for anomaly detection, **LLMs (Ollama)** for heuristic threat verdicts, and a blazing-fast **Next.js App Router** frontend designed with a crisp, professional, high-contrast corporate aesthetic.

---

## 🚀 Key Features

### 🔐 Security & Authentication
- **Secure Access:** Fully integrated JWT-based authentication flow.
- **Login & Register:** User onboarding with encrypted credentials.
- **Advanced Rate Limiting:** Exponential backoff mechanism on the login API to mitigate brute-force attacks and credential stuffing.
- **Route Guarding:** Protected Next.js routes that automatically redirect unauthenticated users.

### 🌐 Dashboard & Modules
- **Supervision Globale (Dashboard):** High-level SOC metrics, live threat timelines, global origin heatmaps, and ML-driven "Synaptic Insights".
- **Live Monitor:** Real-time interception feed of network packets, calculating live risk scores and buffering active anomalies.
- **Parse AI:** An advanced asynchronous pipeline to scrape, parse, and analyze IOCs (Indicators of Compromise) from raw threat intelligence URLs.
- **Sandbox Detonation:** Isolated environment to execute and analyze suspicious files and URLs (Malware & Phishing analysis) with Ollama-powered behavioral verdicts.
- **IP Intel:** Deep-dive forensic analysis of suspicious IP addresses.
- **Incidents & Alerts:** Searchable, sortable, and filterable datagrids of all historical anomalies.
- **Base CVE:** Searchable database of Common Vulnerabilities and Exposures, visually mapped to CVSS severity scores.
- **Playbooks:** Automated response procedures mapped to MITRE ATT&CK tactics.
- **Threat Reports:** Automatically generated PDF threat briefings for C-Suite and stakeholders.
- **AI Copilot:** A chat widget integrated into the platform to ask questions about current threats in natural language.

---

## 🏗️ Architecture

### Backend (Python / FastAPI)
Located in `backend/`.
- **FastAPI** for high-performance async HTTP endpoints.
- **SQLAlchemy / SQLite** for user and token management.
- **Patchright / Playwright** for headless asynchronous web scraping.
- **Ollama Integration** for local, secure LLM analysis.
- **Scikit-Learn** for ML-based anomaly detection.

### Frontend (Next.js / React)
Located in `frontend/nextjs-dashboard/`.
- **Next.js 14+ (App Router)** for optimized server-side rendering and routing.
- **Tailwind CSS** for a pristine, responsive light-mode "Corporate Green/White" UI.
- **Chart.js** for telemetry visualizations (Doughnut, Bar, and Line charts).
- **Lucide React** for consistent, modern iconography.

---

## ⚙️ Installation & Launch Guide

### 1. Backend Setup (FastAPI)
Open a terminal in the root repository directory.

**Windows:**
```powershell
# 1. Create and activate a virtual environment
python -m venv venv
.\venv\Scripts\activate

# 2. Install Python dependencies
pip install -r backend/requirements.txt

# 3. Start the FastAPI server (Runs on port 8000)
python -m backend.api
```
*(The backend API and Swagger Docs will be available at `http://127.0.0.1:8000/docs`)*

### 2. Frontend Setup (Next.js)
Open a second terminal window.

```bash
# 1. Navigate to the frontend directory
cd frontend/nextjs-dashboard

# 2. Install Node modules
npm install

# 3. Start the development server
npm run dev
```
*(The Dashboard UI will be available at `http://localhost:3000`. You will be redirected to `/login` if you are not authenticated.)*

---

## 📖 Usage
1. Open `http://localhost:3000` in your browser.
2. Click on **Create an account** to register a new user.
3. Log in with your new credentials (Note: Repeated failed logins will trigger the exponential rate limiter).
4. Navigate through the sidebar to explore the Live Monitor, run a URL through Parse AI, or detonate a sample in the Sandbox.

---

## 🤝 Authors
- Designed and built as a comprehensive PFE (Projet de Fin d'Études) focusing on automated threat contextualization.

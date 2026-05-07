# tg-roof-takeoff-pro# TG Roof Takeoff Pro

A dark‑mode, offline‑first Progressive Web App (PWA) + FastAPI backend for roof takeoffs.

## 🚀 Deployment Overview

Frontend (PWA): Vercel  
Backend (FastAPI): Railway  
Database: Firestore (optional)

---

# 1. Deploy the PWA (Vercel)

1. Go to https://vercel.com
2. Click "New Project"
3. Import this GitHub repo
4. Select the `pwa/` folder
5. Set:
   - Framework: Vite
   - Build Command: npm run build
   - Output Directory: dist
6. Deploy
7. 

Your PWA will be live instantly.

---

# 2. Deploy the Backend (Railway)

1. Go to https://railway.app
2. Click "New Project"
3. Choose "Deploy from GitHub"
4. Select this repo
5. Choose the `backend/` folder
6. Railway auto-detects FastAPI
7. Deploy

Your API will be live at:

https://your-app-name.up.railway.app

---

# 3. Connect PWA → Backend

In `pwa/src/config.js` (create this file):

export const API_URL = "https://your-api.up.railway.app";

---

# 4. Install the PWA

Open your Vercel URL on your phone → Add to Home Screen.

---

# 5. Features

- Upload roof screenshots
- Set scale
- Trace polygons
- Auto-calc area, squares, pitch
- Automatic annotation overlay
- Export annotated PNG
- Offline support
- Sync-ready architecture

---

# 6. Local Development

## Backend
cd backend  
pip install -r requirements.txt  
uvicorn app:app --reload

## PWA
cd pwa  
npm install  
npm run dev

---

# 7. Production Notes

- Vercel handles HTTPS automatically
- Railway handles HTTPS automatically
- Firestore optional for sync
- PWA works offline by default

---

# 8. License

Private — TG Contracting

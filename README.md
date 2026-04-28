<<<<<<< HEAD
# RapidGuard AI Emergency System

A full-stack React + Express MVP for emergency response analysis.

## Project structure
- `/frontend` — React + Vite frontend
- `/backend` — Express backend proxy to Gemini
- `README.md` — this deployment and local setup guide
- `.gitignore` — excludes secrets and node_modules

## Local setup
1. Open the project root folder.
2. Install root tools:
   ```bash
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   cd ..
   ```
4. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```
5. Create backend env file:
   ```bash
   cd backend
   cp .env.example .env
   # edit .env and set GEMINI_API_KEY
   ```
6. Run the backend and frontend together:
   ```bash
   npm start
   ```

The frontend will open on Vite at `http://localhost:5173` or `http://localhost:5174`.

## Environment variables
- Backend: `backend/.env`
  - `GEMINI_API_KEY=your_valid_api_key`
- Frontend: use Vercel or Vite env to set the backend URL
  - `VITE_BACKEND_URL=https://your-render-backend-url`

## GitHub setup
1. Initialize git:
   ```bash
   git init
   git add .
   git commit -m "Initial RapidGuard MVP structure"
   ```
2. Create a public GitHub repo.
3. Add the remote and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/rapidguard.git
   git push -u origin main
   ```

## Backend deployment (Render)
1. Create a Render account.
2. Create a new Web Service.
3. Connect your GitHub repo.
4. Select the `backend` folder as the service root.
5. Set build command:
   ```bash
   npm install
   ```
6. Set start command:
   ```bash
   node server.js
   ```
7. Add environment variable on Render:
   - `GEMINI_API_KEY=your_api_key`
8. Deploy and copy the Render backend URL.

## Frontend deployment (Vercel)
1. Create a Vercel account.
2. Import your GitHub repo.
3. Select the `frontend` folder.
4. Set build command:
   ```bash
   npm run build
   ```
5. Set output directory:
   ```bash
   dist
   ```
6. Add environment variable on Vercel:
   - `VITE_BACKEND_URL=https://your-render-backend-url`
7. Deploy and copy the Vercel frontend URL.

## Testing
1. Open the Vercel frontend URL.
2. Click `Trigger Emergency`.
3. Confirm AI response appears.
4. Confirm there are no console errors.

## Final links format
- Live MVP link (frontend): `https://your-vercel-url`
- Working prototype link: `https://your-vercel-url`

## Notes
- The backend must be deployed first.
- The frontend must use `VITE_BACKEND_URL` for the live backend URL.
- If the Gemini key is missing, the backend returns a demo response so the app still works.
=======
# rapidguard-ai
AI-powered emergency response system using Google Gemini for real-time crisis analysis and smart evacuation guidance.
>>>>>>> ec394bc938de397fba8ec3c30157936008cdd70a

# Hospital Ecosystem Platform

A comprehensive MERN stack application for managing hospital operations, including patient appointments, doctor schedules, real-time queues, and medical records.

## Features
- **Users**: Patients, Doctors, Hospital Admins, Super Admins.
- **Appointments**: Booking, Rescheduling, Status tracking.
- **Real-time Queue**: Socket.io powered live token system.
- **Prescriptions**: Digital prescription creation and history.
- **Medical Records**: Upload and view medical reports (PDF/Images).
- **Dashboards**: Role-specific interfaces for all users.

## Tech Stack
- **Frontend**: React (Vite), Redux Toolkit, TailwindCSS.
- **Backend**: Node.js, Express, MongoDB.
- **Real-time**: Socket.io.

## Setup & specific Environment Variables

### Prerequisites
- Node.js (v14+)
- MongoDB (Local or Atlas URI)

### Backend (`/server`)
1.  Install dependencies:
    ```bash
    cd server
    npm install
    ```
2.  Create `.env` file (copy `.env.example`):
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/hospital_db (or your Atlas URI)
    JWT_SECRET=your_super_secret_key
    CLIENT_URL=http://localhost:5173 (The frontend URL)
    NODE_ENV=production
    ```
3.  Start server:
    ```bash
    npm start
    ```

### Frontend (`/client`)
1.  Install dependencies:
    ```bash
    cd client
    npm install
    ```
2.  Create `.env` file (copy `.env.example`):
    ```env
    VITE_API_URL=http://localhost:5000 (The backend URL)
    ```
3.  Build for production:
    ```bash
    npm run build
    ```
4.  Preview/Serve:
    ```bash
    npm run preview
    ```

## 🚀 Deployment Guide

### Database (MongoDB Atlas)
1.  Create a cluster on MongoDB Atlas.
2.  Get the connection string and set it as `MONGO_URI` in the backend environment.

### Backend (Render/Heroku/Railway)
1.  Push the code to GitHub.
2.  Connect repository to hosting provider (e.g., Render Web Service).
3.  Set Root Directory to `server`.
4.  Set Build Command: `npm install`.
5.  Set Start Command: `npm start`.
6.  Add Environment Variables (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`).

### Frontend (Vercel/Netlify)
1.  Connect repository to Vercel.
2.  Set Root Directory to `client`.
3.  Add Environment Variable: `VITE_API_URL` (The URL of your deployed backend).
4.  Deploy!

## License
MIT

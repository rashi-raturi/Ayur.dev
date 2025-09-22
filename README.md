# Ayur.dev

## Description
**ayur.dev** is a full-stack web platform that bridges traditional Ayurvedic wisdom with modern technology. It enables patients to connect with certified Ayurvedic doctors, manage appointments, analyze their health constitution, and receive personalized care — all in one place.

---

## 🔍 Key Features

- **🔐 User Authentication**  
  Secure login system for patients, doctors, and administrators with role-based access.

- **📅 Appointment Scheduling**  
  Patients can easily book, reschedule, or cancel appointments with Ayurvedic doctors. Doctors and admins can view and manage bookings via a real-time dashboard.

- **📋 Patient Profiles & Records Management**  
  Doctors and patients can access comprehensive patient profiles. The system also allows secure storage, access, and updating of medical history, prescriptions, and treatment plans.

- **🧾 Prescription Summarization**  
  AI-powered summarization of patient prescriptions helps doctors quickly understand treatment history and progress over time.

- **🧬 PrakrutiSense – Constitution Analysis**  
  A guided questionnaire that identifies the patient's **Prakruti** (Vata, Pitta, Kapha) to enable personalized treatments and lifestyle guidance.

- **🥗 AyuChart – Personalized Ayurvedic Diet Plans**  
  Automatically generates diet charts based on the user's Prakruti, promoting nutritional balance as per Ayurvedic principles.

- **🗣️ VaaniAI – Voice-Based Ayurveda Assistant**  
  A conversational voice assistant offering real-time Ayurvedic advice, lifestyle tips, and support.

- **💬 AyurMind – Chatbot for Ayurvedic Guidance**  
  An AI chatbot that provides instant, reliable responses to user queries about Ayurvedic health and wellness.

- **📊 Admin Dashboard**  
  Centralized dashboard for admins to manage users, oversee appointments, and view platform usage analytics.

- **🔒 Secure Data Storage**  
  All patient and consultation data is securely stored in **MongoDB**, ensuring privacy and compliance with data protection best practices.

---

## ⚙️ Tech Stack

- **Frontend**: `React` / `TailwindCSS`
- **Backend**: `Node.js` / `Express` 
- **Database**: `MongoDB` 
- **AI/ML**:
  - NLP models for prescription summarization
  - LLMs for chatbot and voice assistant
---

## 🚀 Demo & Deployment
> Live Demo : https://ayurdev.vercel.app/

> Admin : https://ayurdev-admin.vercel.app

### Installation

## Install dependencies

1. **Install admin dependencies**
   ```bash
   cd admin
   npm install
   ```

2. **Install frontend and backend dependencies**
   ```bash
   cd frontend
   npm install
   ```

   ```bash
   cd ..
   cd backend
   npm install
   ```

3. **Set up environment variables**
   No need - I have pushed the env file for convenience.

4. **Start server:**
   ```bash
   cd backend
   npm run server
   ```

5. **Start Admin Panel:**
   ```bash
   cd admin
   npm run dev
   ```

6. **Start Frontend Panel:**
   ```bash
   cd frontend
   npm run dev
   ```

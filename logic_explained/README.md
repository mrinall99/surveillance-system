# 🧠 HawkEye — Deep Architectural & Viva Guide

Welcome to the **Deep Logic & Viva Preparation Guide** for the **HawkEye AI Surveillance System**.

This folder explains **why** every part of the program exists, **how** it works under the hood, **how the developer thought while designing it**, **exact line-by-line code logic**, **Supabase cloud database migration**, and **how to answer examiner questions to get full marks in your project viva**.

---

## 📚 Reading Map

| Document | Key Focus / What You Will Learn |
|---|---|
| **[09_supabase_integration_guide.md](./09_supabase_integration_guide.md)** | ⚡ **SUPABASE MIGRATION**: Complete setup guide for cloud PostgreSQL, SQL schema script, `.env` config, and viva answers. |
| **[08_backend_master_guide.md](./08_backend_master_guide.md)** | 🟢 **BACKEND MASTER GUIDE**: Deep breakdown of Express server, JWT auth, Bcrypt hashing, REST API routes, and database adapter. |
| **[07_code_logic_mapping.md](./07_code_logic_mapping.md)** | 💻 **LINE-BY-LINE CODE LOGIC**: Exact mapping of python MOG2, YOLOv8, Base64 encoding, Node atomic DB writes, and JWT auth code. |
| **[06_viva_master_cheatsheet.md](./06_viva_master_cheatsheet.md)** | 🏆 **TOP 20 VIVA QUESTIONS**: Examiner Q&As, Presentation Script, and Demo Day Checklist. |
| **[01_developer_mindset_and_design_decisions.md](./01_developer_mindset_and_design_decisions.md)** | **Mental Model & Architectural Rationale**: Why Python + Node + React? Why MOG2 before YOLO? Why JSON DB over PostgreSQL? Why WebSockets over HTTP polling? |
| **[02_end_to_end_data_flow.md](./02_end_to_end_data_flow.md)** | **The Journey of a Single Video Frame**: Trace a camera frame from physical capture to AI detection, alert trigger, WebSocket broadcast, and React UI rendering. |
| **[03_python_cv_engine_deep_logic.md](./03_python_cv_engine_deep_logic.md)** | **Computer Vision Logic**: Dual-stage gating (MOG2 + YOLOv8), ByteTrack tracking, OpenCV frame processing, and Base64 streaming mechanics. |
| **[04_backend_and_database_deep_logic.md](./04_backend_and_database_deep_logic.md)** | **Node.js API & Database Logic**: Layered architecture (Routes → Controllers → Services → DB), JWT stateless security, lowdb JSON atomicity, and event logging. |
| **[05_frontend_react_deep_logic.md](./05_frontend_react_deep_logic.md)** | **React UI & Real-Time Logic**: Component hierarchy, WebSocket hook subscription, HTML5 Canvas dynamic bounding box overlay, and sound/visual alerts. |

---

## 🎯 Purpose of this Guide
Unlike basic file explanations, this guide breaks down the **engineering thought process**, **trade-offs**, **mathematical & algorithmic choices**, and **inter-process communication** so you can confidently present and defend every design choice in a technical viva or project presentation.

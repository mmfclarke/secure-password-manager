# Secure Password Manager
CS 467 Online Capstone — Spring 2026  
Thania Cisneros, Eduardo Jr Perez, Matthew Clarke

## Overview
A free, open-source, web-based password manager built on a modified MERN stack 
(DocumentDB, Express, React, Node.js) and hosted on AWS. Users can register, log in 
with multi-factor authentication, and securely manage credentials through a 
browser-based interface.

## Project Structure
secure-password-manager/
├── .github/workflows/    # GitHub Actions auto-deploy workflows
├── frontend/             # React SPA (Matthew)
├── backend/              # Express/Node.js API (Thania)
└── totp/                 # TOTP/Speakeasy service (Thania + Eduardo)

## Branching Convention
- `main` — protected, merge via PR with 1 approval only
- `feat/matthew-example_branch` — Matthew's feature branches
- `feat/thania-example_branch` — Thania's feature branches
- `feat/eduardo-example_branch` — Eduardo's feature branches

## Local Development

### Prerequisites
- Node.js v20+
- Git

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# runs on http://localhost:5173
```

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
# runs on http://localhost:5000
```

### TOTP Service
```bash
cd totp
cp .env.example .env
npm install
npm run dev
# runs on http://localhost:5001
```

## Deployment
Pushing to `main` automatically triggers the corresponding GitHub Actions workflow:
- Changes in `frontend/` → deploys to Frontend EC2
- Changes in `backend/` → deploys to Backend EC2
- Changes in `totp/` → deploys to TOTP EC2

## Tech Stack
- **Frontend:** React, Vite, React Router, Axios, CryptoJS
- **Backend:** Node.js, Express, Mongoose, bcrypt, JWT
- **TOTP:** Speakeasy
- **Database:** Amazon DocumentDB
- **Hosting:** AWS EC2
- **Security:** AES-256 client-side encryption, MFA, bcrypt, JWT

## Resources
- [bcrypt docs](https://www.npmjs.com/package/bcrypt)
- [speakeasy docs](https://www.npmjs.com/package/speakeasy)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [AWS](https://aws.amazon.com)
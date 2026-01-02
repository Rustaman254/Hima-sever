# 🏍️ Hima Insurance Platform

> **Production-ready WhatsApp-based motorcycle insurance platform with hybrid on-chain/off-chain architecture on Mantle blockchain**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Mantle](https://img.shields.io/badge/Blockchain-Mantle-blue)](https://mantle.xyz)
[![WhatsApp](https://img.shields.io/badge/Chat-WhatsApp-25D366)](https://www.whatsapp.com/)
[![Twilio](https://img.shields.io/badge/Provider-Twilio-F22F46)](https://www.twilio.com/)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Phase 3: Dashboard Integration](#phase-3-dashboard-integration)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [M-Pesa Integration](#m-pesa-integration)
- [WhatsApp Interaction](#whatsapp-interaction)
- [Admin Features](#admin-features)

---

## 🎯 Overview

Hima is a revolutionary insurance platform that allows users to purchase motorcycle insurance entirely through WhatsApp (via Twilio), with payments and policies integrated with the Mantle blockchain and M-Pesa.

---

## 🛠 Phase 4: Connectivity & Resilience
- **CORS Enabled**: The server now uses the `cors` package to allow the Hima Dashboard (localhost:3000) to securely access the API endpoints on localhost:8100.
- **Fail-Safe Twilio**: The server is now resilient to missing or invalid Twilio credentials. If the `TWILIO_ACCOUNT_SID` is not valid, the server will log a warning and fallback to **Simulation Mode** for messaging, rather than crashing.

## ⚙️ Configuration

### Environment Variables (.env)

Hima uses **Twilio** for messaging and **M-Pesa** for local payments. Create a `.env` file with:

```env
# TWILIO
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# M-PESA
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=174379

# ADMIN
ADMIN_EMAIL=admin@hima.com
ADMIN_PASSWORD=hima_admin_2026

# MANTLE
RPC_URL=https://mantle-sepolia.drpc.org
CHAIN_ID=5001
```

---

## 💰 M-Pesa Integration

Hima integrates with Safaricom's Daraja API:
- **STK Push**: For instant premium payments.
- **B2C Payouts**: For automated claim settlements.
- **Sandbox Supported**: Full testing environment using Daraja sandbox.

---

**Built with ❤️ for accessible insurance on Web3**

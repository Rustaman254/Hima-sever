# 🏍️ Hima Insurance Platform

> **Production-ready WhatsApp-based motorcycle insurance platform with hybrid on-chain/off-chain architecture on Mantle blockchain**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Mantle](https://img.shields.io/badge/Blockchain-Mantle-blue)](https://mantle.xyz)
[![WhatsApp](https://img.shields.io/badge/Chat-WhatsApp-25D366)](https://www.whatsapp.com/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [M-Pesa Integration](#m-pesa-integration)
- [WhatsApp Interaction](#whatsapp-interaction)
- [Admin Features](#admin-features)

---

## 🎯 Overview

Hima is a revolutionary insurance platform that allows users to purchase motorcycle insurance entirely through WhatsApp using the Meta WhatsApp Business API, with payments and policies integrated with the Mantle blockchain and M-Pesa.

---

## ⚙️ Configuration

### WhatsApp Connectivity
Hima exclusively uses the **Meta WhatsApp Business API**.

#### Environment Variables (.env)
```env
# META WHATSAPP BUSINESS API
WHATSAPP_ACCESS_TOKEN=EAAMu0yPDPZCc...
WHATSAPP_PHONE_NUMBER_ID=879843564631752
WHATSAPP_BUSINESS_ACCOUNT_ID=879843564631752
WHATSAPP_WEBHOOK_VERIFY_TOKEN=hima_webhook_verify_token

# BLOCKCHAIN (Mantle Testnet)
RPC_URL=https://rpc.testnet.mantle.xyz
CHAIN_ID=5001
INSURANCE_CONTRACT_ADDRESS=0x...
PRIVATE_KEY=your_wallet_private_key
```

### 📱 WhatsApp Features
The platform leverages native Meta WhatsApp interactive components:
- **Interactive Buttons**: Native (Up to 3) for quick actions.
- **List Messages**: Native (Up to 10 options) for product selection.
- **CTA Link Buttons**: Native CTA URL for external links.
- **Media Handling**: Full support for ID photos and documents.

### 🔗 Webhook Setup
To receive messages, configure your Meta Developer portal webhook to point to your server:
- **Meta Webhook**: `https://your-domain.com/webhook`

> [!TIP]
> Use **ngrok** for local testing: `ngrok http 8100`. Update the Meta Developer portal with the temporary ngrok URL.

---

## 💰 M-Pesa Integration

Hima integrates with Safaricom's Daraja API:
- **STK Push**: For instant premium payments.
- **B2C Payouts**: For automated claim settlements.
- **Sandbox Supported**: Full testing environment using Daraja sandbox.

---

**Built with ❤️ for accessible insurance on Web3**

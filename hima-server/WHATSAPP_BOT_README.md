# HIMA WhatsApp Bot - Setup Guide

## Overview

This document provides comprehensive instructions for setting up and using the HIMA WhatsApp bot powered by `@open-wa/wa-automate`. The bot provides bilingual (English/Swahili) support for boda boda insurance with interactive button-based forms and complete KYC flows.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [First-Time Setup](#first-time-setup)
- [Bot Architecture](#bot-architecture)
- [Conversation Flows](#conversation-flows)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Testing Guide](#testing-guide)

## Prerequisites

- Node.js (v18 or higher)
- MongoDB database
- WhatsApp account for bot authentication
- Terminal with display capability (for QR code scanning) OR headless server with session persistence

## Installation

The bot dependencies are already included in `package.json`. If you need to reinstall:

```bash
npm install
```

Key dependency: `@open-wa/wa-automate@^4.66.1`

## First-Time Setup

### 1. Environment Configuration

The bot configuration is already set in `.env`:

```env
# WhatsApp Bot Configuration
BOT_SESSION_NAME=hima-bot
BOT_HEADLESS=true
BOT_QR_TIMEOUT=60000
BOT_SESSION_DATA_PATH=./sessions
```

**Configuration Options:**

- `BOT_SESSION_NAME`: Unique identifier for the bot session
- `BOT_HEADLESS`: Set to `true` for headless mode (no browser UI), `false` for debugging
- `BOT_QR_TIMEOUT`: Time in milliseconds to wait for QR code scan (default: 60 seconds)
- `BOT_SESSION_DATA_PATH`: Directory where session data is stored for persistence

### 2. Start the Server

```bash
npm run dev
```

### 3. QR Code Authentication

On first launch, the bot will display a QR code in the terminal:

1. Open WhatsApp on your phone
2. Go to **Settings** → **Linked Devices**
3. Tap **Link a Device**
4. Scan the QR code displayed in the terminal

**Important:** The QR code expires after 60 seconds. If you miss it, restart the server.

### 4. Session Persistence

After successful authentication, session data is saved to `./sessions/hima-bot/`. On subsequent server restarts, the bot will automatically reconnect without requiring QR code scanning.

**To reset the bot session:**

```bash
rm -rf ./sessions/hima-bot
```

Then restart the server to generate a new QR code.

## Bot Architecture

### File Structure

```
src/whatsapp-bot/
├── BotClient.ts                 # WhatsApp client wrapper
├── BotConversationManager.ts    # State machine for conversations
├── translations.ts              # Bilingual translation utility
└── index.ts                     # Bot initialization module

src/routers/
└── himaRouter.ts                # API endpoints for bot operations

src/models/
├── User.ts                      # Updated with bot fields
└── Claim.ts                     # Insurance claim model
```

### State Machine

The bot uses a state-based conversation flow managed by `BotConversationManager`. Each user has a `botConversationState` field that tracks their current position in the conversation.

**Main States:**

- `LANG_SELECT` - Language selection (English/Swahili)
- `REGISTER_START` - Begin registration
- `REG_*` - KYC registration steps (name, ID, DOB, plate, photos)
- `WAITING_KYC_APPROVAL` - KYC submitted, awaiting admin approval
- `MAIN_MENU` - Main menu (KYC approved users only)
- `BUY_SELECT_COVER` - Insurance product selection
- `BUY_CONFIRM` - Purchase confirmation
- `CLAIM_*` - Claim filing steps

## Conversation Flows

### 1. Language Selection

**First Interaction:**

```
User: hi
Bot: Karibu HIMA 🚀
     Welcome to HIMA, boda boda insurance on WhatsApp.
     
     Chagua lugha / Choose language:
     [English] [Kiswahili]
```

### 2. KYC Registration Flow

**For users without KYC:**

1. **Full Name**: "Please send your full name as on your ID."
2. **ID Number**: "Please send your National ID number."
3. **Date of Birth**: "Please send your date of birth (format: YYYY-MM-DD)."
4. **Plate Number**: "Please send your motorcycle plate number."
5. **ID Photo**: "Please send a clear photo of your National ID."
6. **Logbook Photo**: "Please send a photo of your motorcycle logbook."
7. **Bike Photo**: "Please send a photo of your motorcycle."
8. **Selfie**: "Please send a selfie of yourself with your motorcycle."

**Confirmation:**

```
Thank you. Your details have been submitted for KYC review.
You will get a message once approved.
```

### 3. Main Menu (KYC Approved)

```
HIMA 🚀
What would you like to do?

[Buy insurance] [View profile] [File a claim]
```

### 4. Buy Insurance Flow

**Product Selection:**

```
Choose your HIMA boda boda cover:

1) Third party only
2) Comprehensive
3) Personal accident (rider)

[Third party] [Comprehensive] [Personal accident]
```

**Confirmation:**

```
Please confirm your selection:

*Product:* Comprehensive Cover
*Premium:* KES 500
*Coverage:* comprehensive

[Yes, proceed] [No, cancel]
```

**Payment:**

```
Please check your phone to complete the M-Pesa payment.
```

### 5. View Profile

```
Your HIMA profile:

*Name:* John Doe
*ID:* 12345678
*Motorcycle:* KCA 123A
*Policy:* HIMA-ABC12345

Profile link: https://hima.com/profile/...

[Open web profile]
```

### 6. File Claim Flow

1. **Accident Date**: "Please send the accident date (format: YYYY-MM-DD)."
2. **Location**: "Please send the location where the accident occurred."
3. **Description**: "Please provide a brief description of what happened."
4. **Damage Photo**: "Please send a photo of the damage to your motorcycle."
5. **Police Abstract**: "Please send a photo of the police abstract (or type SKIP)."

**Confirmation:**

```
Your claim has been submitted successfully.
Claim number: CLM-ABC12345

Our team will review it and contact you soon.
```

## API Endpoints

All endpoints are under `/api/hima/`:

### GET /api/hima/user-status

Check user account and KYC status.

**Query Parameters:**
- `phone` (required): User's phone number

**Response:**
```json
{
  "status": "NO_ACCOUNT" | "KYC_PENDING" | "KYC_APPROVED" | "KYC_REJECTED"
}
```

### POST /api/hima/register

Submit KYC registration.

**Request Body:**
```json
{
  "phone": "254XXXXXXXXX",
  "lang": "en" | "sw",
  "kycData": {
    "fullName": "John Doe",
    "idNumber": "12345678",
    "dateOfBirth": "1990-01-01",
    "plateNumber": "KCA 123A",
    "idPhotoBase64": "...",
    "logbookPhotoBase64": "...",
    "bikePhotoBase64": "...",
    "selfiePhotoBase64": "..."
  }
}
```

### GET /api/hima/profile

Get user profile details.

**Query Parameters:**
- `phone` (required): User's phone number

**Response:**
```json
{
  "name": "John Doe",
  "idNumber": "12345678",
  "plate": "KCA 123A",
  "currentPolicyNumber": "HIMA-ABC12345",
  "profileUrl": "https://hima.com/profile/..."
}
```

### POST /api/hima/claims

Submit insurance claim.

**Request Body:**
```json
{
  "phone": "254XXXXXXXXX",
  "accidentDate": "2026-01-16",
  "location": "Nairobi CBD",
  "description": "Accident description",
  "photos": {
    "damage": "base64...",
    "policeAbstract": "base64..."
  }
}
```

### GET /api/hima/products

List available insurance products.

**Response:**
```json
[
  {
    "_id": "...",
    "name": "Third Party Cover",
    "coverageType": "basic",
    "premiumAmountKES": 300,
    "isActive": true
  }
]
```

## Environment Variables

### Bot Configuration

```env
BOT_SESSION_NAME=hima-bot          # Session identifier
BOT_HEADLESS=true                  # Headless mode (true/false)
BOT_QR_TIMEOUT=60000               # QR code timeout (ms)
BOT_SESSION_DATA_PATH=./sessions   # Session storage path
```

### Database

```env
MONGODB_URI=mongodb+srv://...      # MongoDB connection string
```

### M-Pesa (for payments)

```env
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=174379
MPESA_PASSKEY=...
```

## Troubleshooting

### Bot Won't Start

**Error:** `Failed to initialize bot`

**Solutions:**
1. Check if port 8100 is available
2. Verify MongoDB connection
3. Ensure `@open-wa/wa-automate` is installed
4. Check Node.js version (requires v18+)

### QR Code Not Displaying

**Error:** QR code doesn't appear in terminal

**Solutions:**
1. Set `BOT_HEADLESS=false` for debugging
2. Check terminal supports UTF-8 characters
3. Increase `BOT_QR_TIMEOUT` if needed

### Session Expired

**Error:** Bot disconnects frequently

**Solutions:**
1. Delete session data: `rm -rf ./sessions/hima-bot`
2. Restart server and scan QR code again
3. Ensure stable internet connection

### Messages Not Being Received

**Checklist:**
1. Verify bot is connected (check logs for "Bot is ready")
2. Ensure user is sending messages to the correct WhatsApp number
3. Check `BotConversationManager` logs for errors
4. Verify MongoDB connection is active

### Button Clicks Not Working

**Fallback:** If buttons don't work, the bot will send numbered options. Users can reply with the number instead.

## Testing Guide

### Manual Testing Checklist

#### 1. Language Selection
- [ ] Send "hi" from new number
- [ ] Verify language buttons appear
- [ ] Tap "Kiswahili" button
- [ ] Confirm subsequent messages are in Swahili
- [ ] Test with "English" button

#### 2. KYC Registration
- [ ] Complete full name step
- [ ] Complete ID number step
- [ ] Complete DOB step (test invalid format)
- [ ] Complete plate number step
- [ ] Upload ID photo
- [ ] Upload logbook photo
- [ ] Upload bike photo
- [ ] Upload selfie
- [ ] Verify confirmation message

#### 3. KYC Pending State
- [ ] Send "hi" after KYC submission
- [ ] Verify "KYC under review" message
- [ ] Test in both languages

#### 4. Main Menu (Manually approve KYC first)
- [ ] Set user's `kycStatus` to `verified` in database
- [ ] Send "hi" to bot
- [ ] Verify main menu appears
- [ ] Test all three buttons

#### 5. Buy Insurance
- [ ] Select product from list
- [ ] Verify confirmation with price
- [ ] Test cancel button
- [ ] Test confirm button (M-Pesa integration)

#### 6. View Profile
- [ ] Tap "View profile"
- [ ] Verify all details display correctly
- [ ] Test in both languages

#### 7. File Claim
- [ ] Enter accident date
- [ ] Enter location
- [ ] Enter description
- [ ] Upload damage photo
- [ ] Test SKIP for police abstract
- [ ] Verify claim number is generated

#### 8. Session Persistence
- [ ] Restart server
- [ ] Verify bot reconnects automatically
- [ ] Continue existing conversation

## Admin Tasks

### Approve KYC

Update user's KYC status in MongoDB:

```javascript
db.users.updateOne(
  { phoneNumber: "254XXXXXXXXX" },
  { $set: { kycStatus: "verified" } }
)
```

### Reject KYC

```javascript
db.users.updateOne(
  { phoneNumber: "254XXXXXXXXX" },
  { $set: { kycStatus: "rejected" } }
)
```

### View Submitted Claims

```javascript
db.claims.find({ status: "submitted" }).pretty()
```

## Support

For issues or questions:
- Email: support@hima.com
- Phone: +254 700 000 000

---

**Note:** The Meta WhatsApp Graph API integration has been commented out in `.env` and the webhook router (`src/routers/webhookRouter.ts`) is preserved but inactive. To re-enable Meta integration, uncomment the variables in `.env` and update `app.ts`.

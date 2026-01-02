# Hima Connect WhatsApp Bot - Quick Start Guide

## 🚀 Project Overview

A WhatsApp bot for Hima Connect insurance platform that allows users to:
- Get motorcycle insurance quotes in seconds
- Choose from 3 coverage types
- Make secure payments using stablecoins
- Receive instant policy confirmation

**Key Feature**: Users never see any crypto/blockchain jargon. All blockchain interactions are abstracted away.

## 📁 Project Structure

```
src/
├── app.ts                          # Main application entry
├── Configs/
│   └── configs.ts                 # Environment & configuration
├── models/
│   ├── User.ts                    # User data model
│   ├── InsuranceQuote.ts          # Quote calculation model
│   └── Policy.ts                  # Insurance policy model
├── whatsapp/
│   ├── WhatsAppBot.ts             # WhatsApp client & connection
│   ├── ConversationManager.ts     # Conversation flow & logic
│   ├── QuoteCalculator.ts         # Premium calculation engine
│   ├── PaymentProcessor.ts        # Payment abstraction layer
│   └── constants.ts               # Messages & state definitions
├── routers/
│   └── insurance.ts               # REST API endpoints
└── types/
    └── qrcode-terminal.d.ts       # Type definitions
```

## 🛠️ Setup Steps

### 1. **Copy Environment Variables**
```bash
cp .env.example .env
```

### 2. **Edit `.env` file** with:
```env
# Required: MongoDB
MONGODB_URI=mongodb://localhost:27017/hima

# Optional: Blockchain (for actual payment processing)
RPC_URL=https://polygon-rpc.com
STABLECOIN_ADDRESS=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=0x...
```

### 3. **Start MongoDB** (if local)
```bash
mongod
```

### 4. **Install and Run**
```bash
pnpm install
pnpm run dev
```

### 5. **Scan QR Code**
- A QR code will appear in terminal
- Open WhatsApp on your phone
- Go to Settings → Linked Devices
- Scan the QR code
- Bot is now connected!

## 💬 How Users Interact

Send a WhatsApp message to trigger the bot:

```
User: Hi
Bot: Welcome to Hima Connect! What's your first name?

User: Ahmed
Bot: Thanks Ahmed! What's the make of your motorcycle?

User: Honda
Bot: What's the model?

User: CB125R
Bot: What year was it manufactured?

User: 2022
Bot: What's your registration number?

User: ABC-1234
Bot: What's the current market value?

User: 50000
Bot: [Shows 3 coverage options]
     1️⃣ Basic - $5.20/month
     2️⃣ Comprehensive - $8.30/month  
     3️⃣ Premium - $12.50/month

User: 2
Bot: [Shows quote, asks for confirmation]

User: YES
Bot: [Provides payment link]
     Payment successful! Policy #HIMA1701234567 is active
```

## 📊 Database Models

### User Collection
```javascript
{
  phoneNumber: "1234567890",
  firstName: "Ahmed",
  motorcycleMake: "Honda",
  motorcycleModel: "CB125R",
  motorcycleYear: 2022,
  registrationNumber: "ABC-1234",
  motorcycleValue: 50000,
  coverageType: "comprehensive",
  quotedPrice: 8.30,
  policyStatus: "active",
  conversationState: "payment_complete"
}
```

### InsuranceQuote Collection
```javascript
{
  userId: "ObjectId",
  motorcycleMake: "Honda",
  motorcycleModel: "CB125R",
  motorcycleYear: 2022,
  motorcycleValue: 50000,
  coverageType: "comprehensive",
  basePremium: 7.16,
  taxes: 1.14,
  totalPrice: 8.30,
  validUntil: "2024-12-09T10:00:00Z",
  isAccepted: true
}
```

### Policy Collection
```javascript
{
  userId: "ObjectId",
  policyNumber: "HIMA1701234567",
  coverageType: "comprehensive",
  premiumAmount: 8.30,
  policyStartDate: "2024-12-08",
  policyEndDate: "2025-12-08",
  paymentStatus: "completed",
  policyStatus: "active",
  transactionHash: "0x..."
}
```

## 🔄 Conversation States

The bot manages conversation flow through states:

1. `INITIAL` → `GREETING` - Says welcome
2. `ASKING_MOTORCYCLE_MAKE` - Collects bike make
3. `ASKING_MOTORCYCLE_MODEL` - Collects bike model
4. `ASKING_MOTORCYCLE_YEAR` - Collects year
5. `ASKING_REGISTRATION` - Collects reg number
6. `ASKING_MOTORCYCLE_VALUE` - Collects bike value
7. `ASKING_COVERAGE_TYPE` - Shows coverage options
8. `SHOWING_QUOTE` - Calculates & displays quote
9. `ASKING_QUOTE_ACCEPTANCE` - Asks for confirmation
10. `PROCESSING_PAYMENT` - Initiates payment
11. `PAYMENT_COMPLETE` → `POLICY_ISSUED` - Issues policy

## 💰 Premium Calculation Formula

```
Adjusted Value = Bike Value × Depreciation Factor
Monthly Base = (Adjusted Value × Coverage Rate) / 12
Risk Adjustment = 1.0 (or 1.2 if bike > 15 years)
Monthly Premium = Base × Risk Adjustment
Taxes = Monthly Premium × 16%
Total = Monthly Premium + Taxes
```

**Coverage Rates:**
- Basic: 5% per year
- Comprehensive: 8% per year  
- Premium: 12% per year

## 🔐 Payment Processing

**No Blockchain Exposure to Users:**
1. User sees simple payment prompt
2. Payment gateway handles stablecoin transfer
3. Server verifies transaction
4. User gets policy confirmation
5. Zero crypto terminology shown

**Behind the Scenes:**
- Amount converted to USDC (stablecoin)
- Transaction on Polygon network
- Verified server-side
- Policy automatically activated

## 📡 REST API Endpoints

```bash
# Get Quote
POST /api/insurance/quotes
{
  "phoneNumber": "1234567890",
  "motorcycleMake": "Honda",
  "motorcycleModel": "CB125R",
  "motorcycleYear": 2022,
  "motorcycleValue": 50000,
  "coverageType": "comprehensive"
}

# Create Policy
POST /api/insurance/policies
{
  "phoneNumber": "1234567890",
  "quoteId": "ObjectId",
  "firstName": "Ahmed",
  "registrationNumber": "ABC-1234"
}

# Get Policy
GET /api/insurance/policies/HIMA1701234567

# Verify Payment
POST /api/payments/verify
{
  "policyNumber": "HIMA1701234567",
  "transactionId": "0x..."
}

# Get User
GET /api/insurance/users/1234567890
```

## 🐛 Troubleshooting

### Bot Not Responding
- Check MongoDB is running: `mongod`
- Verify `.env` file exists and has correct values
- Check WhatsApp connection status in logs

### QR Code Not Showing
- Make sure you haven't already linked a device
- Restart with: `pnpm run dev`
- Logout from WhatsApp Web if logged in

### Payment Not Working
- Check `STABLECOIN_ADDRESS` in `.env`
- Verify wallet has USDC balance
- Check `RPC_URL` is accessible
- Check logs for transaction errors

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` format
- Verify database exists

## 📚 Technologies Used

- **Framework**: Express.js + TypeScript
- **Database**: MongoDB + Mongoose
- **WhatsApp**: whatsapp-web.js
- **Blockchain**: ethers.js, viem
- **Payments**: Stablecoin (USDC)
- **Network**: Polygon

## 🚢 Deployment

1. **MongoDB Atlas** (cloud database):
   ```env
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hima
   ```

2. **Vercel/Heroku** (app hosting):
   - Set environment variables
   - Deploy with `pnpm run build`

3. **Blockchain Network**:
   - Deploy insurance contract
   - Set `CONTRACT_ADDRESS` in `.env`

## 📝 Notes

- Quotes are valid for 24 hours
- Policies are valid for 1 year
- All prices are in USD equivalent
- Stablecoins ensure price stability
- Depreciation decreases premium for older bikes

## 🤝 Support

For issues or questions:
1. Check `.env` file configuration
2. Review logs in terminal
3. Ensure MongoDB is running
4. Verify WhatsApp connection

---

**Ready to launch? Run `pnpm run dev` and scan that QR code! 🎉**

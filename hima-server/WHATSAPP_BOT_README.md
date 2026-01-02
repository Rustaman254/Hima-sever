# Hima Connect WhatsApp Insurance Bot

A WhatsApp bot that helps users purchase motorcycle insurance with a seamless, crypto-abstracted payment experience using stablecoins.

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/hima

# Server
PORT=8100
NODE_ENV=development

# Blockchain (Polygon or other EVM network)
RPC_URL=https://polygon-rpc.com
CONTRACT_ADDRESS=0x... # Your insurance contract address
PRIVATE_KEY=0x... # Your wallet private key
STABLECOIN_ADDRESS=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174 # USDC on Polygon
CHAIN_ID=137 # Polygon mainnet

# Payment Gateway (e.g., Stripe, Razorpay)
PAYMENT_GATEWAY_URL=https://api.yourgwteway.com

# WhatsApp
WHATSAPP_BOT_TOKEN=your_bot_token_here
```

### 2. Installation

```bash
# Install dependencies
pnpm install

# Start the bot
pnpm run dev
```

### 3. First Run

1. When you run `pnpm run dev`, the bot will display a QR code
2. Open WhatsApp on your phone
3. Go to Settings > Linked Devices
4. Scan the QR code with your phone
5. The bot is now connected!

## How It Works

### User Conversation Flow

```
1. User messages bot
2. Bot: Asks for first name
3. Bot: Asks for motorcycle make
4. Bot: Asks for motorcycle model
5. Bot: Asks for motorcycle year
6. Bot: Asks for registration number
7. Bot: Asks for motorcycle value
8. Bot: Asks for coverage type (Basic, Comprehensive, Premium)
9. Bot: Shows calculated quote
10. Bot: Asks for acceptance
11. Bot: Initiates payment
12. User completes payment
13. Bot: Issues policy and sends confirmation
```

### Coverage Types

- **Basic Coverage**: Third-party liability protection
- **Comprehensive Coverage**: Theft, fire, accidents, and third-party
- **Premium Coverage**: Full protection with 24/7 roadside assistance

### Quote Calculation

Premiums are calculated based on:
- Motorcycle value and age
- Selected coverage type
- Risk factors (older bikes get 20% premium)
- Depreciation rates
- Local taxes (16%)

### Payment Processing

The system abstracts away blockchain complexity:
1. **User sees**: Simple payment flow with familiar currency
2. **Behind the scenes**:
   - Amount is processed through a payment gateway (Stripe/Razorpay)
   - Payment gateway handles stablecoin transfer
   - No crypto jargon shown to users
   - Users never see wallet addresses or blockchain details

## Database Models

### User
- Phone number
- Personal information
- Motorcycle details
- Policy status
- Conversation state

### InsuranceQuote
- Quote calculation details
- Coverage type
- Premium breakdown
- Quote validity (24 hours)

### Policy
- Policy number and dates
- Coverage details
- Payment information
- Policy status

## API Routes (Optional)

```typescript
POST /api/insurance/quotes       // Get quote
POST /api/insurance/policies     // Create policy
GET  /api/insurance/policies/:id // Get policy details
POST /api/payments/verify        // Verify payment
```

## Blockchain Details (For Developers)

- **Network**: Polygon (or configurable EVM network)
- **Stablecoin**: USDC (6 decimals)
- **Payment Integration**: Uses payment gateway for UX abstraction
- **Transaction Verification**: Happens server-side
- **User Experience**: No blockchain knowledge required

## Features

✅ User-friendly WhatsApp interface
✅ Real-time insurance quotes
✅ Multiple coverage options
✅ Secure payment processing
✅ Automatic policy generation
✅ MongoDB persistence
✅ Transaction verification
✅ Conversation state management

## Development

```bash
# Start development server
pnpm run dev

# Build for production
pnpm run build

# Run in production
pnpm run start
```

## Troubleshooting

### QR Code Not Appearing
- Make sure the bot has permission to write to console
- Check that port 8100 is available
- Restart the bot

### Payments Not Processing
- Verify `RPC_URL` and `CONTRACT_ADDRESS` in `.env`
- Check wallet has sufficient gas
- Ensure stablecoin is at the correct address

### MongoDB Connection Error
- Verify `MONGODB_URI` is correct
- Ensure MongoDB is running
- Check network connectivity

## Architecture

```
src/
├── whatsapp/
│   ├── WhatsAppBot.ts          # Main bot class
│   ├── ConversationManager.ts  # Conversation flow
│   ├── QuoteCalculator.ts      # Premium calculation
│   ├── PaymentProcessor.ts     # Payment handling
│   └── constants.ts            # Messages and constants
├── models/
│   ├── User.ts                 # User schema
│   ├── InsuranceQuote.ts       # Quote schema
│   └── Policy.ts               # Policy schema
├── Configs/
│   └── configs.ts              # Configuration
└── app.ts                       # Entry point
```

## Future Enhancements

- [ ] Multi-language support
- [ ] Claim filing through WhatsApp
- [ ] Policy renewal reminders
- [ ] Premium discount programs
- [ ] Vehicle damage photo upload
- [ ] Real-time quotes API
- [ ] Admin dashboard

## License

MIT

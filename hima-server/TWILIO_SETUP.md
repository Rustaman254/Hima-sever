# 🔄 Twilio WhatsApp Setup Guide

## Overview

The Hima Insurance platform now uses **Twilio WhatsApp API** instead of WhatsApp Business API. The previous WhatsApp Business API implementation has been preserved as comments for reference.

---

## 🚀 Quick Setup

### Step 1: Get Twilio Credentials

1. **Sign up for Twilio**
   - Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
   - Create a free account

2. **Get Your Credentials**
   - Go to [Twilio Console](https://console.twilio.com/)
   - Find your **Account SID** and **Auth Token**
   - Copy these values

3. **Activate WhatsApp Sandbox**
   - Go to [Twilio Console > Messaging > Try it out > Send a WhatsApp message](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
   - Follow instructions to join the sandbox
   - Your sandbox number will be: `whatsapp:+14155238886` (or similar)

---

### Step 2: Configure Environment Variables

Update your `.env` file:

```env
# Twilio WhatsApp API
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

---

### Step 3: Configure Webhook in Twilio

1. **Go to Twilio Console**
   - Navigate to: Messaging > Settings > WhatsApp Sandbox Settings

2. **Set Webhook URL**
   - **When a message comes in**: `https://your-domain.com/twilio-webhook`
   - For local testing with ngrok:
     ```bash
     ngrok http 8100
     # Use the ngrok URL: https://xxxx.ngrok.io/twilio-webhook
     ```

3. **HTTP Method**: POST

4. **Save Settings**

---

### Step 4: Test the Integration

1. **Start the Server**
   ```bash
   pnpm run dev
   ```

2. **Join WhatsApp Sandbox**
   - Send the join code to your Twilio WhatsApp number
   - Example: Send "join <your-sandbox-code>" to `+1 415 523 8886`

3. **Test Message**
   - Send "Hi" to the Twilio WhatsApp number
   - You should receive a response from the bot

---

## 📱 User Flow with Twilio

### Registration Flow
```
User: Hi
Bot: Welcome to Hima Insurance! What's your first name?

User: John
Bot: Thanks John! What's your motorcycle make?

User: Honda
Bot: What's the model? (e.g., CB125R)

... (continues with insurance flow)
```

---

## 🔧 Technical Details

### Files Created/Modified

#### New Files:
- [`TwilioWhatsAppClient.ts`](file:///home/masterchiefff/Documents/Hima/hima-server/src/whatsapp/TwilioWhatsAppClient.ts) - Twilio API client
- [`twilioWebhookRouter.ts`](file:///home/masterchiefff/Documents/Hima/hima-server/src/routers/twilioWebhookRouter.ts) - Twilio webhook handler

#### Modified Files:
- [`app.ts`](file:///home/masterchiefff/Documents/Hima/hima-server/src/app.ts) - Now uses Twilio webhook
- [`configs.ts`](file:///home/masterchiefff/Documents/Hima/hima-server/src/Configs/configs.ts) - Added Twilio config
- [`.env.example`](file:///home/masterchiefff/Documents/Hima/hima-server/.env.example) - Updated with Twilio vars

#### Commented (Preserved):
- `WhatsAppBusinessClient.ts` - Still available for reference
- `webhookRouter.ts` - Commented in app.ts

---

## 🌐 Local Testing with ngrok

For local development, use ngrok to expose your localhost:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 8100

# Copy the HTTPS URL (e.g., https://xxxx.ngrok.io)
# Use this in Twilio webhook settings: https://xxxx.ngrok.io/twilio-webhook
```

---

## 📊 Endpoints

### Twilio Webhook
- **URL**: `/twilio-webhook`
- **Method**: POST
- **Purpose**: Receive WhatsApp messages from Twilio

### Health Check
```bash
curl http://localhost:8100/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Hima Insurance Server is running",
  "whatsappProvider": "Twilio",
  "network": "Mantle Testnet",
  "chainId": 5001
}
```

---

## 🔐 Security

### Webhook Signature Validation

Twilio webhooks are validated using the `X-Twilio-Signature` header:

```typescript
const signature = req.headers["x-twilio-signature"];
const isValid = twilioClient.validateWebhookSignature(
    signature,
    url,
    req.body
);
```

This ensures messages are genuinely from Twilio.

---

## 💰 Twilio Pricing

### Free Tier
- **$15 trial credit** when you sign up
- Test in sandbox for free
- No credit card required for sandbox

### Production Pricing
- **WhatsApp messages**: ~$0.005 per message
- **Phone number**: ~$1/month
- See [Twilio Pricing](https://www.twilio.com/whatsapp/pricing) for details

---

## 🆚 Twilio vs WhatsApp Business API

| Feature | Twilio | WhatsApp Business API |
|---------|--------|----------------------|
| Setup Time | 5 minutes | 2-15 days (verification) |
| Developer Account | Not required | Required |
| Business Verification | Not required for sandbox | Required |
| Cost | Pay-per-message | Free (self-hosted) or BSP fees |
| Ease of Use | Very easy | Complex |
| Production Ready | Yes | Yes |

---

## 🐛 Troubleshooting

### Issue: Messages not being received

**Solution:**
1. Check webhook URL is correct in Twilio console
2. Verify webhook is publicly accessible (use ngrok for local)
3. Check server logs for errors
4. Ensure you've joined the WhatsApp sandbox

### Issue: "Invalid signature" error

**Solution:**
1. Verify `TWILIO_AUTH_TOKEN` is correct in `.env`
2. Check webhook URL matches exactly (including https://)
3. Ensure request body is not modified before validation

### Issue: Can't send messages

**Solution:**
1. Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are correct
2. Check Twilio account has credits
3. Ensure recipient has joined the sandbox (for testing)

---

## 📈 Next Steps

1. ✅ Configure Twilio credentials in `.env`
2. ✅ Set up webhook in Twilio console
3. ✅ Test message flow
4. ⏳ Deploy to production server
5. ⏳ Upgrade to Twilio production WhatsApp number
6. ⏳ Complete KYC flow implementation

---

## 🔄 Switching Back to WhatsApp Business API

If you need to switch back to WhatsApp Business API:

1. **Uncomment** WhatsApp Business API code in:
   - `app.ts` (uncomment webhook router import and route)
   - `configs.ts` (uncomment WhatsApp Business config)

2. **Comment out** Twilio code in:
   - `app.ts` (comment Twilio webhook router)
   - `configs.ts` (comment Twilio config)

3. **Update** `.env` with WhatsApp Business credentials

All the code is preserved and ready to use!

---

## 📞 Support

- **Twilio Docs**: [twilio.com/docs/whatsapp](https://www.twilio.com/docs/whatsapp)
- **Twilio Support**: [support.twilio.com](https://support.twilio.com)
- **Twilio Console**: [console.twilio.com](https://console.twilio.com)

---

**✅ You're all set! Start testing your WhatsApp insurance bot with Twilio!**

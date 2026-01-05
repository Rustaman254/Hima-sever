# WhatsApp Business API Setup Guide

This guide will help you configure the Meta WhatsApp Business API for the Hima Insurance Platform.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Meta Developer Portal Setup](#meta-developer-portal-setup)
- [Environment Configuration](#environment-configuration)
- [Sandbox vs Production Mode](#sandbox-vs-production-mode)
- [Webhook Configuration](#webhook-configuration)
- [Testing Your Setup](#testing-your-setup)
- [Common Errors](#common-errors)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

1. **Meta Developer Account**: Create one at [developers.facebook.com](https://developers.facebook.com)
2. **WhatsApp Business Account**: Set up through Meta Business Suite
3. **Phone Number**: A phone number to use for your WhatsApp Business API
4. **Server with HTTPS**: For webhook callbacks (use ngrok for local testing)

---

## Meta Developer Portal Setup

### 1. Create a Meta App

1. Go to [Meta Developer Portal](https://developers.facebook.com/apps)
2. Click **"Create App"**
3. Select **"Business"** as the app type
4. Fill in your app details:
   - **App Name**: e.g., "Hima Insurance"
   - **App Contact Email**: Your email
   - **Business Account**: Select or create one

### 2. Add WhatsApp Product

1. In your app dashboard, find **"WhatsApp"** in the products list
2. Click **"Set Up"**
3. Select your **Business Portfolio**

### 3. Get Your Credentials

Navigate to **WhatsApp > API Setup** and note down:

- **Phone Number ID**: Found under "From" section (e.g., `852829371256540`)
- **WhatsApp Business Account ID**: Found in the URL or account settings (e.g., `879843564631752`)
- **Access Token**: Click "Generate Token" (temporary) or create a permanent one

> **⚠️ Important**: Temporary tokens expire in 24 hours. For production, create a permanent System User token.

### 4. Create a Permanent Access Token (Recommended)

1. Go to **Meta Business Suite** → **Settings** → **Business Settings**
2. Navigate to **Users** → **System Users**
3. Click **"Add"** and create a new system user
4. Assign the system user to your app
5. Generate a token with these permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
6. Save this token securely - you won't see it again!

---

## Environment Configuration

Create or update your `.env` file:

```env
# WhatsApp Business API (Meta)
WHATSAPP_ACCESS_TOKEN=EAAMu0yPDPZCcBQT3rZB...  # Your access token
WHATSAPP_PHONE_NUMBER_ID=852829371256540       # Your phone number ID
WHATSAPP_BUSINESS_ACCOUNT_ID=879843564631752   # Your business account ID
WHATSAPP_WEBHOOK_VERIFY_TOKEN=hima_webhook_verify_token  # Choose any secure string

# For testing
TEST_PHONE_NUMBER=254712345678  # Your phone number with country code
```

---

## Sandbox vs Production Mode

### Sandbox Mode (Default)

When you first set up WhatsApp Business API, you're in **sandbox mode**. This has restrictions:

**✅ What Works:**
- Testing with up to 5 phone numbers
- All message types (text, buttons, lists, media)
- Webhook integration

**❌ Restrictions:**
- Can only message phone numbers in your **allowed list**.
- ⚠️ **Interactive Message Restriction**: In sandbox mode, Meta may allow **Plain Text** and **Templates** (OTP) to go through, but strictly block **Interactive Buttons/Lists** (Error 131030) until the recipient is explicitly added to the "Manage phone number list" in the portal.
- Limited to 250 conversations per day.
- "Test Number" displayed as sender name.

### Adding Numbers to Allowed List (Sandbox)

1. Go to **WhatsApp > API Setup** in Meta Developer Portal
2. Scroll to the **"To"** section
3. Click **"Manage phone number list"**
4. Click **"Add phone number"**
5. Enter the phone number with country code (e.g., `254712345678`)
6. The recipient will receive a verification code via WhatsApp
7. They must reply with the code to verify
8. Once verified, you can send messages to that number

> **💡 Tip**: You can add up to 5 phone numbers in sandbox mode.

### Production Mode

To remove sandbox restrictions:

1. **Complete Business Verification**:
   - Verify your business in Meta Business Manager
   - Provide business documents (registration, tax ID, etc.)
   - This can take 1-3 weeks

2. **Get Official Business Account**:
   - Your WhatsApp number will show your verified business name
   - No recipient restrictions
   - Higher message limits

3. **Message Template Approval**:
   - Create and submit message templates for approval
   - Required for initiating conversations (24-hour window)

---

## Webhook Configuration

### 1. Set Up Your Webhook URL

For local development, use **ngrok**:

```bash
# Start ngrok
ngrok http 8100

# Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)
```

For production, use your server's HTTPS URL.

### 2. Configure Webhook in Meta Portal

1. Go to **WhatsApp > Configuration** in Meta Developer Portal
2. Click **"Edit"** next to Webhook
3. Enter your webhook details:
   - **Callback URL**: `https://your-domain.com/webhook`
   - **Verify Token**: Same as `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in your `.env`
4. Click **"Verify and Save"**

### 3. Subscribe to Webhook Fields

Make sure these fields are subscribed:
- ✅ `messages` (required)
- ✅ `message_status` (optional, for delivery status)

---

## Testing Your Setup

### 1. Run the Diagnostic Script

```bash
cd /home/masterchiefff/Documents/Hima/hima-server
npx tsx scripts/diagnose_whatsapp.ts
```

This will:
- ✅ Verify your Phone Number ID
- ✅ Check your Business Account
- ✅ Test message sending
- ❌ Show any configuration issues

### 2. Test Webhook Locally

```bash
# Start your server
pnpm run dev

# In another terminal, send a test webhook
curl -X POST http://localhost:8100/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "254712345678",
            "id": "test123",
            "timestamp": "1234567890",
            "type": "text",
            "text": {"body": "hi"}
          }],
          "metadata": {"phone_number_id": "852829371256540"}
        }
      }]
    }]
  }'
```

### 3. Test End-to-End

1. **Add your phone number** to the Meta sandbox allowed list
2. **Send a message** to your WhatsApp Business number
3. **Verify** you receive a response

---

## Common Errors

### Error 131030: Recipient not in allowed list

**Problem**: You're in sandbox mode and the recipient isn't verified.

**Solution**:
1. Go to Meta Developer Portal → WhatsApp → API Setup
2. Add the phone number to your allowed list
3. Have the recipient verify via WhatsApp code

### Error 401: Authentication failed

**Problem**: Invalid or expired access token.

**Solution**:
1. Generate a new access token in Meta Developer Portal
2. Update `WHATSAPP_ACCESS_TOKEN` in your `.env`
3. Restart your server

### Error 404: Phone number not found

**Problem**: Invalid `WHATSAPP_PHONE_NUMBER_ID`.

**Solution**:
1. Verify the Phone Number ID in Meta Developer Portal
2. Update `WHATSAPP_PHONE_NUMBER_ID` in your `.env`

### Error 131047: Template message required

**Problem**: Your account requires approved message templates.

**Solution**:
1. This happens in some production accounts
2. Create and submit message templates in Meta Portal
3. Use approved templates for initiating conversations

### Webhook verification failed

**Problem**: Verify token mismatch.

**Solution**:
1. Ensure `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in `.env` matches the token in Meta Portal
2. Restart your server
3. Re-verify the webhook in Meta Portal

---

## Troubleshooting

### Messages not being received

1. **Check webhook subscription**: Ensure `messages` field is subscribed
2. **Verify webhook URL**: Must be HTTPS and publicly accessible
3. **Check server logs**: Look for incoming webhook requests
4. **Test with curl**: Send a manual webhook payload (see Testing section)

### Messages not being sent

1. **Run diagnostic script**: `npx tsx scripts/diagnose_whatsapp.ts`
2. **Check recipient is in allowed list** (sandbox mode)
3. **Verify access token** is valid
4. **Check server logs** for detailed error messages

### Interactive buttons not working

1. **Ensure recipient is verified** in sandbox allowed list
2. **Check button format**: Max 3 buttons, 20 characters each
3. **Review server logs** for API errors
4. **Test with plain text** first to isolate the issue

### Quality Rating Issues

If your quality rating drops to RED:
1. **Reduce spam**: Don't send unsolicited messages
2. **Improve response time**: Reply to users quickly
3. **Use message templates**: For business-initiated conversations
4. **Monitor feedback**: Check user reports in Meta Portal

---

## Additional Resources

- [Meta WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Message Templates Guide](https://developers.facebook.com/docs/whatsapp/message-templates)
- [Webhook Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Business Verification Guide](https://www.facebook.com/business/help/2058515294227817)

---

## Support

For issues specific to Hima Insurance Platform:
- Check server logs: `tail -f server.log`
- Run diagnostics: `npx tsx scripts/diagnose_whatsapp.ts`
- Review error messages in terminal

For Meta/WhatsApp API issues:
- [Meta Developer Community](https://developers.facebook.com/community/)
- [WhatsApp Business API Support](https://business.facebook.com/business/help)

---

**Built with ❤️ for accessible insurance on Web3**

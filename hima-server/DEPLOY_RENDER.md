# Deploying Hima Server to Render

This guide outlines the steps to deploy the Hima Server to [Render](https://render.com).

## Prerequisites
- A GitHub repository containing the `hima-server` code.
- A [Render](https://render.com) account.
- A MongoDB Atlas connection string (or other MongoDB provider).

## Deployment Steps

1.  **Connect Repository**
    - Log in to Render.
    - Click **New +** and select **Blueprint**.
    - Connect your GitHub account if not already connected.
    - Select the repository containing `hima-server`.

2.  **Service Configuration**
    - Render will automatically detect the `render.yaml` file.
    - Review the service name (`hima-server`) and commands.
    - **Important**: Ensure Build Command is `pnpm install --prod=false && pnpm run build`.
    - Click **Apply**.

3.  **Environment Variables**
    - Once the service is created, go to the **Environment** tab.
    - Add the following environment variables (values from your `.env` file):
        - `MONGO_URI`: Your production MongoDB connection string.
        - `JWT_SECRET`: A secure secret key for JWT tokens.
        - `WHATSAPP_TOKEN`: Your Meta Graph API Token.
        - `PHONE_NUMBER_ID`: Your WhatsApp Phone Number ID.
        - `BUSINESS_ID`: Your WhatsApp Business Account ID.
        - `WEBHOOK_VERIFY_TOKEN`: Your chosen verification token.
        - `ENCRYPTION_KEY`: Key for encrypting sensitive data.
        - `MANTLE_RPC_URL`: RPC URL for Mantle network (if using mainnet/testnet).
        - `PRIVATE_KEY`: Private key for the server wallet.
        - `MPESA_CONSUMER_KEY`: M-Pesa API Key.
        - `MPESA_CONSUMER_SECRET`: M-Pesa API Secret.
        - `MPESA_PASSKEY`: M-Pesa Passkey.
        - `MPESA_CALLBACK_URL`: Your deployed Render URL + `/api/mpesa/callback` (e.g., `https://hima-server.onrender.com/api/mpesa/callback`).

4.  **Finish**
    - Render will automatically deploy your application.
    - Monitor the **Logs** tab for any errors.
    - Once "Live", your server is accessible at the provided `onrender.com` URL.

## Updating the Webhook
- After deployment, copy your Render URL.
- Update your Meta App Dashboard Webhook configuration to point to:
  `https://your-app-name.onrender.com/api/webhook`

# Mistral 7B Integration Guide - HIMA WhatsApp Bot

This document explains how Mistral 7B is integrated into the HIMA server for conversation management, intent detection, and automated fallback.

## 🚀 Overview

The integration uses Mistral AI (or any compatible OpenAI-style API) to:
1.  **Understand Natural Language**: Category user input into actions like buying insurance or filing claims.
2.  **Provide context-aware answers**: Answer general questions about HIMA's blockchain-based insurance.
3.  **Handle Fallbacks**: Gracefully handle messages that don't match the standard numbered menus.

---

## 🛠️ Setup Instructions

### 1. API Configuration
Add the following variables to your `.env` file:

```env
MISTRAL_API_KEY=your_mistral_api_key_here
MISTRAL_API_URL=https://api.mistral.ai/v1
MISTRAL_MODEL=mistral-tiny  # You can use mistral-medium or large for better results
```

> [!TIP]
> You can also use a local instance of Mistral via **Ollama**. Set `MISTRAL_API_URL=http://localhost:11434/v1` and `MISTRAL_API_KEY=ollama`.

### 2. Architecture

The integration consists of two main parts:

#### A. [MistralService.ts](file:///home/masterchiefff/Documents/Hima/hima-server/src/services/MistralService.ts)
This service handles all communication with the Mistral API. It includes:
*   `detectIntent()`: Categorizes user input.
*   `getHimaResponse()`: Generates HIMA-specific answers using a system prompt.

#### B. [BotConversationManager.ts](file:///home/masterchiefff/Documents/Hima/hima-server/src/whatsapp-bot/BotConversationManager.ts)
The conversation manager uses the AI service when:
*   A user is in the `MAIN_MENU` but provides an unrecognized input.
*   The system hits a `default` state in its state machine.

---

## 🧪 Testing

### Automated Test
Run the test script to verify the AI's understanding of insurance concepts:
```bash
npx tsx scripts/test-mistral.ts
```

### Manual Verification
Message the bot with phrases like:
*   *"Sema, naweza kupata bima hapa?"* (Kiswahili query)
*   *"What is comprehensive insurance?"*
*   *"I want to buy insurance"*

---

## 📝 Customization

You can tune the bot's personality and knowledge by modifying the system prompts in `src/services/MistralService.ts`.

### Intent Detection Labels
If you add new features to the bot, update the `systemPrompt` in the `detectIntent` method to include the new labels.

### HIMA Context
Update the `getHimaResponse` system prompt if you change product names, coverage details, or pricing strategies.

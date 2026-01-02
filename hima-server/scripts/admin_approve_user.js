import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hima';

const userSchema = new mongoose.Schema({
    phoneNumber: String,
    kycStatus: String,
    conversationState: String,
    firstName: String
}); // Minimal schema for update

const User = mongoose.model('User', userSchema);

async function approveUser() {
    let phoneNumber = process.argv[2];
    // Strip + if present, to match how TwilioClient stores it
    if (phoneNumber) {
        phoneNumber = phoneNumber.replace('+', '').replace('whatsapp:', '');
    }

    if (!phoneNumber) {
        console.error('❌ Please provide a phone number: node scripts/admin_approve_user.js <phone_number>');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const user = await User.findOne({ phoneNumber });

        if (!user) {
            console.error(`❌ User not found with number: ${phoneNumber}`);
            process.exit(1);
        }

        if (user.kycStatus === 'verified') {
            console.log(`⚠️  User ${user.firstName} is already verified.`);
            process.exit(0);
        }

        user.kycStatus = 'verified';
        // Reset state so they can continue to motorcycle details
        // user.conversationState = 'asking_motorcycle_make'; 
        // Actually, let's keep them in WAITING_FOR_APPROVAL until they message again and the bot checks status
        // OR we can rely on them messaging "Hi" again.
        // The ConversationManager logic checks kycStatus when state is WAITING_FOR_APPROVAL.

        await user.save();

        console.log(`✅ Successfully approved user: ${user.firstName} (${phoneNumber})`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

approveUser();

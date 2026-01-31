import mongoose from "mongoose";
import { User } from "../models/User.js";
import config from "../Configs/configs.js";

async function seedAdmin() {
    try {
        await mongoose.connect(config.dbUrl);
        console.log("Connected to MongoDB for seeding...");

        const adminEmail = config.admin.email;
        const adminPassword = config.admin.password;

        // Use a dummy phone number for the admin since it's required in the schema
        const adminPhone = "0000000000";

        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log("Admin user already exists. Updating role and password...");
            existingAdmin.role = "admin";
            existingAdmin.password = adminPassword;
            await existingAdmin.save();
        } else {
            const admin = new User({
                email: adminEmail,
                phoneNumber: adminPhone,
                firstName: "System",
                lastName: "Admin",
                role: "admin",
                password: adminPassword,
                kycStatus: "verified",
                registrationComplete: true
            });

            await admin.save();
            console.log("Admin user seeded successfully!");
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error seeding admin:", error);
        process.exit(1);
    }
}

seedAdmin();

import mongoose from "mongoose";
import { InsuranceProduct } from "../models/InsuranceProduct.ts";
import config from "../Configs/configs.ts";

const products = [
    {
        name: "Basic Third Party",
        description: "Essential coverage for third-party liability. Protects you against damages to others.",
        premiumAmountKES: 1500,
        sumAssuredKES: 100000,
        coverageType: "trip",
        tier: "basic",
        isActive: true
    },
    {
        name: "Standard Coverage",
        description: "Covers third-party liability plus theft and fire protection for your motorcycle.",
        premiumAmountKES: 3500,
        sumAssuredKES: 250000,
        coverageType: "trip",
        tier: "standard",
        isActive: true
    },
    {
        name: "Hima Plus (Premium)",
        description: "Full comprehensive coverage including third-party, theft, fire, accidents, and 24/7 roadside assistance.",
        premiumAmountKES: 6000,
        sumAssuredKES: 500000,
        coverageType: "trip",
        tier: "plus",
        isActive: true
    }
];

async function seedProducts() {
    try {
        await mongoose.connect(config.dbUrl);
        console.log("🌱 Connected to database for seeding products...");

        // Clear existing products
        await InsuranceProduct.deleteMany({});
        console.log("🧹 Cleared existing insurance products.");

        // Insert new products
        await InsuranceProduct.insertMany(products);
        console.log("✅ Successfully seeded 3 insurance products!");

        await mongoose.disconnect();
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seedProducts();

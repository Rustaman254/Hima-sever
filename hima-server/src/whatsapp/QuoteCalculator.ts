import { User } from "../models/User.js";
import { InsuranceQuote } from "../models/InsuranceQuote.js";
import { CONVERSATION_STATES, COVERAGE_TYPES, MESSAGES } from "./constants.js";

export class QuoteCalculator {
    private BASE_RATES = {
        [COVERAGE_TYPES.BASIC]: 0.05, // 5% of bike value per year
        [COVERAGE_TYPES.COMPREHENSIVE]: 0.08, // 8% of bike value per year
        [COVERAGE_TYPES.PREMIUM]: 0.12, // 12% of bike value per year
    };

    private AGE_DEPRECIATION_RATES = {
        1: 0.95, // 1 year old: 95% of value
        2: 0.9,
        3: 0.85,
        4: 0.8,
        5: 0.75,
        10: 0.6,
        15: 0.4,
        20: 0.25,
    };

    private TAX_RATE = 0.16; // 16% tax

    async calculateQuote(
        userId: string,
        motorcycleMake: string,
        motorcycleModel: string,
        motorcycleYear: number,
        motorcycleValue: number,
        coverageType: string
    ): Promise<any> {
        try {
            // Get depreciation factor based on age
            const currentYear = new Date().getFullYear();
            const bikeAge = currentYear - motorcycleYear;
            const depreciationFactor = this.getDepreciationFactor(bikeAge);
            const adjustedValue = motorcycleValue * depreciationFactor;

            // Calculate base premium
            const lookupRate: number | undefined = this.BASE_RATES[
                coverageType as keyof typeof this.BASE_RATES
            ];
            const baseRateValue = (lookupRate ?? this.BASE_RATES[COVERAGE_TYPES.BASIC]) as number;
            const monthlyBasePremium = (adjustedValue * baseRateValue) / 12;

            // Add risk adjustment (bikes older than 15 years get 20% premium)
            let premiumAdjustment = 1;
            if (bikeAge > 15) {
                premiumAdjustment = 1.2;
            }

            const adjustedMonthlyPremium =
                monthlyBasePremium * premiumAdjustment;

            // Calculate taxes
            const taxes = adjustedMonthlyPremium * this.TAX_RATE;

            // Total price
            const totalPrice = adjustedMonthlyPremium + taxes;

            // Create quote record
            const quote = new InsuranceQuote({
                userId,
                motorcycleMake,
                motorcycleModel,
                motorcycleYear,
                registrationNumber: "PENDING", // Will be filled separately
                motorcycleValue: adjustedValue,
                coverageType,
                basePremium: adjustedMonthlyPremium,
                taxes,
                totalPrice: Math.round(totalPrice * 100) / 100, // Round to 2 decimals
                priceInUSD: Math.round(totalPrice * 100) / 100,
                validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
                isAccepted: false,
            });

            await quote.save();
            return quote;
        } catch (error) {
            console.error("Error calculating quote:", error);
            throw error;
        }
    }

    private getDepreciationFactor(age: number): number {
        const rates = this.AGE_DEPRECIATION_RATES;
        let factor = 0.25; // Minimum value after 20+ years

        if (age <= 1) {
            factor = rates[1];
        } else if (age <= 5) {
            factor = rates[age as keyof typeof rates];
        } else if (age <= 10) {
            // Interpolate between 5 and 10 years
            const progress = (age - 5) / 5;
            factor = rates[5] - (rates[5] - rates[10]) * progress;
        } else if (age <= 15) {
            // Interpolate between 10 and 15 years
            const progress = (age - 10) / 5;
            factor = rates[10] - (rates[10] - rates[15]) * progress;
        } else if (age <= 20) {
            // Interpolate between 15 and 20 years
            const progress = (age - 15) / 5;
            factor = rates[15] - (rates[15] - rates[20]) * progress;
        } else {
            factor = rates[20];
        }

        return Math.max(0.2, Math.min(1, factor)); // Ensure between 0.2 and 1.0
    }

    formatPrice(price: number, currency: string = "USD"): string {
        return `${currency === "USD" ? "$" : ""}${price.toFixed(2)}`;
    }
}

export default new QuoteCalculator();

import axios from "axios";

export class FraudService {
    private static API_KEY = process.env.FRAUD_CHECK_API_KEY;
    private static BASE_URL = process.env.FRAUD_CHECK_BASE_URL;

    /**
     * Checks customer reliability from an external fraud detection service (FraudBD/CheckParcel style).
     * @param phone The customer's phone number.
     * @returns Aggregated statistics about the customer's order history across the network.
     */
    static async checkExternalFraud(phone: string) {
        if (!this.API_KEY || this.API_KEY === "your_api_key_here") {
            console.warn("[FRAUD_CHECK] API Key is not configured. Returning mock/empty data.");
            return {
                success: false,
                message: "Fraud check API key not configured.",
                data: null
            };
        }

        try {
            // Updated to match FraudBD official documentation:
            // Method: POST
            // Header: api_key
            // Body: { phone_number: "..." }
            const response = await axios.post(this.BASE_URL as string,
                { phone_number: phone },
                {
                    headers: {
                        "api_key": this.API_KEY,
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    }
                }
            );

            return response.data;
        } catch (error: any) {
            console.error("[FRAUD_CHECK] External API Error:", error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to fetch fraud data from external service.",
                error: error.message
            };
        }
    }
}

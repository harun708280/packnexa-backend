import axios from "axios";

export class FraudService {
    private static CLIENT_ID = process.env.FRAUD_CHECK_CLIENT_ID;
    private static API_KEY = process.env.FRAUD_CHECK_API_KEY;
    private static BASE_URL = process.env.FRAUD_CHECK_BASE_URL || "https://fraudpeek.com/api/fraud-lookup";


    static async checkExternalFraud(phone: string) {
        if (!this.API_KEY || !this.CLIENT_ID) {
            console.warn("[FRAUD_CHECK] API Credentials semi-configured. Returning error.");
            return {
                success: false,
                message: "FraudPeek API credentials not fully configured.",
                data: null
            };
        }

        try {

            const params = new URLSearchParams();
            params.append('phone', phone);

            const response = await axios.post(this.BASE_URL,
                params,
                {
                    headers: {
                        "X-FP-Client-Id": this.CLIENT_ID,
                        "X-FP-API-Key": this.API_KEY,
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Accept": "application/json"
                    }
                }
            );

            if (response.data.success && response.data.data) {
                const fpData = response.data.data;
                const summary = fpData.summary;


                const mappedData = {
                    totalSummary: {
                        total: summary.total_parcels || 0,
                        success: summary.delivered_parcels || 0,
                        cancel: summary.cancelled_parcels || 0,

                        successRate: summary.delivery_rate || (summary.total_parcels > 0 ? Math.round((summary.delivered_parcels / summary.total_parcels) * 100) : 0),
                        risk_level: summary.risk_level || "unknown",
                        risk_score: summary.risk_score || 0
                    },
                    Summaries: (fpData.couriers || []).reduce((acc: any, curr: any) => {
                        acc[curr.courier] = {
                            total: curr.total_parcels || (curr.delivered_parcels + curr.cancelled_parcels),
                            success: curr.delivered_parcels,
                            cancel: curr.cancelled_parcels,
                            return_rate: curr.return_percentage,
                            rating: curr.customer_rating_score
                        };
                        return acc;
                    }, {})
                };

                return {
                    success: true,
                    data: mappedData
                };
            }

            return response.data;
        } catch (error: any) {
            console.error("[FRAUD_CHECK] FraudPeek API Error:", error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to fetch fraud data from FraudPeek.",
                error: error.message
            };
        }
    }
}

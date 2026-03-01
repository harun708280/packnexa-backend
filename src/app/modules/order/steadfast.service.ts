import config from "../../../config";

const STEADFAST_BASE_URL = "https://portal.packzy.com/api/v1";

interface Order {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    deliveryAddress: string;
    district: string;
    area: string;
    totalPayable: number;
    merchantNote?: string | null;
}

interface SteadfastOrderResponse {
    status: number;
    message: string;
    consignment?: {
        consignment_id: number;
        tracking_code: string;
        status: string;
    };
}

interface SteadfastStatusResponse {
    status: number;
    message?: string;
    delivery_status?: string;
    tracking_code?: string;
}

const createOrder = async (order: Order): Promise<SteadfastOrderResponse | null> => {
    const apiKey = (config.steadfast?.api_key || process.env.STEADFAST_API_KEY || "").toString().trim().replace(/^["'](.+)["']$/, '$1');
    const secretKey = (config.steadfast?.secret_key || process.env.STEADFAST_SECRET_KEY || "").toString().trim().replace(/^["'](.+)["']$/, '$1');

    if (!apiKey || !secretKey) {
        console.error("Steadfast API Key or Secret Key is missing in environment variables.");
        return null;
    }

    const payload = {
        invoice: order.orderNumber,
        recipient_name: order.customerName.slice(0, 100),
        recipient_phone: order.customerPhone.replace(/[^0-9]/g, "").slice(-11),
        recipient_address: `${order.deliveryAddress}, ${order.area}, ${order.district}`.slice(0, 250),
        recipient_email: order.customerEmail || "",
        cod_amount: order.totalPayable,
        note: (order.merchantNote || "").slice(0, 500),
    };

    try {
        const response = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Api-Key": apiKey,
                "Secret-Key": secretKey,
            },
            body: JSON.stringify(payload),
        });

        const text = await response.text();
        try {
            const result = JSON.parse(text) as SteadfastOrderResponse;
            return result;
        } catch (e) {
            console.error(`Failed to parse Steadfast create order response. Raw text: ${text}`);
            return null;
        }
    } catch (error) {
        console.error("Error creating Steadfast order:", error);
        return null;
    }
};

const trackOrder = async (invoice: string): Promise<SteadfastStatusResponse | null> => {
    const apiKey = (config.steadfast?.api_key || process.env.STEADFAST_API_KEY || "").toString().trim().replace(/^["'](.+)["']$/, '$1');
    const secretKey = (config.steadfast?.secret_key || process.env.STEADFAST_SECRET_KEY || "").toString().trim().replace(/^["'](.+)["']$/, '$1');

    if (!apiKey || !secretKey) {
        return null;
    }

    try {
        const response = await fetch(`${STEADFAST_BASE_URL}/status_by_invoice/${encodeURIComponent(invoice)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Api-Key": apiKey,
                "Secret-Key": secretKey,
            },
        });

        const text = await response.text();
        try {
            const result = JSON.parse(text) as SteadfastStatusResponse;
            // Handle cases where API returns 401 for non-existent invoices by returning null
            if (result.status === 401) return null;
            return result;
        } catch (e) {
            return null;
        }
    } catch (error) {
        return null;
    }
};

export const SteadfastService = {
    createOrder,
    trackOrder,
};

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
    paymentMethod?: string | null;
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

interface SteadfastBulkOrderResponse {
    invoice: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    cod_amount: string | number;
    note: string | null;
    consignment_id: number;
    tracking_code: string;
    status: string;
}

const createOrder = async (order: Order, merchantCredentials?: { apiKey?: string | null, secretKey?: string | null }): Promise<SteadfastOrderResponse | null> => {
    const apiKey = merchantCredentials?.apiKey?.toString().trim().replace(/^["'](.+)["']$/, '$1');
    const secretKey = merchantCredentials?.secretKey?.toString().trim().replace(/^["'](.+)["']$/, '$1');

    if (!apiKey || !secretKey) {
        return null;
    }

    const payload = {
        invoice: order.orderNumber,
        recipient_name: order.customerName.slice(0, 100),
        recipient_phone: order.customerPhone.replace(/[^0-9]/g, "").slice(-11),
        recipient_address: `${order.deliveryAddress}, ${order.area}, ${order.district}`.slice(0, 250),
        recipient_email: order.customerEmail || "",
        cod_amount: (() => {
            const method = (order.paymentMethod || "COD").toUpperCase();

            if (method.includes("COD") || method.includes("CASH") || method.includes("HAND") || method === "PAY ON DELIVERY") {
                return order.totalPayable;
            }
            return 0;
        })(),
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

const getBalance = async (merchantCredentials?: { apiKey?: string | null, secretKey?: string | null }): Promise<number | null> => {
    const apiKey = merchantCredentials?.apiKey?.toString().trim().replace(/^["'](.+)["']$/, '$1');
    const secretKey = merchantCredentials?.secretKey?.toString().trim().replace(/^["'](.+)["']$/, '$1');

    if (!apiKey || !secretKey) {
        return null;
    }

    try {
        const response = await fetch(`${STEADFAST_BASE_URL}/get_balance`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Api-Key": apiKey,
                "Secret-Key": secretKey,
            },
        });

        const text = await response.text();
        try {
            const result = JSON.parse(text);
            if (result.status === 200) {
                return result.current_balance;
            }
            return null;
        } catch (e) {
            return null;
        }
    } catch (error) {
        return null;
    }
};

const trackOrder = async (invoice: string, merchantCredentials?: { apiKey?: string | null, secretKey?: string | null }): Promise<SteadfastStatusResponse | null> => {
    const apiKey = merchantCredentials?.apiKey?.toString().trim().replace(/^["'](.+)["']$/, '$1');
    const secretKey = merchantCredentials?.secretKey?.toString().trim().replace(/^["'](.+)["']$/, '$1');

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

            if (result.status === 401) return null;
            return result;
        } catch (e) {
            return null;
        }
    } catch (error) {
        return null;
    }
};

const bulkCreate = async (orders: Order[], merchantCredentials?: { apiKey?: string | null, secretKey?: string | null }): Promise<SteadfastBulkOrderResponse[] | null> => {
    const apiKey = merchantCredentials?.apiKey?.toString().trim().replace(/^["'](.+)["']$/, '$1');
    const secretKey = merchantCredentials?.secretKey?.toString().trim().replace(/^["'](.+)["']$/, '$1');

    if (!apiKey || !secretKey) {
        return null;
    }

    const payloadData = orders.map(order => ({
        invoice: order.orderNumber,
        recipient_name: order.customerName.slice(0, 100),
        recipient_phone: order.customerPhone.replace(/[^0-9]/g, "").slice(-11),
        recipient_address: `${order.deliveryAddress}, ${order.area}, ${order.district}`.slice(0, 250),
        recipient_email: order.customerEmail || "",
        cod_amount: (() => {
            const method = (order.paymentMethod || "COD").toUpperCase();
            if (method.includes("COD") || method.includes("CASH") || method.includes("HAND") || method === "PAY ON DELIVERY") {
                return order.totalPayable;
            }
            return 0;
        })(),
        note: (order.merchantNote || "").slice(0, 500),
    }));

    try {
        const response = await fetch(`${STEADFAST_BASE_URL}/create_order/bulk-order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Api-Key": apiKey,
                "Secret-Key": secretKey,
            },
            body: JSON.stringify({ data: payloadData }),
        });

        const text = await response.text();
        try {
            const result = JSON.parse(text) as SteadfastBulkOrderResponse[];
            return result;
        } catch (e) {
            console.error(`Failed to parse Steadfast bulk order response. Raw text: ${text}`);
            return null;
        }
    } catch (error) {
        console.error("Error creating Steadfast bulk orders:", error);
        return null;
    }
};

export const SteadfastService = {
    createOrder,
    trackOrder,
    getBalance,
    bulkCreate,
};

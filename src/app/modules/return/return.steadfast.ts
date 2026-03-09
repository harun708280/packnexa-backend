import { prisma } from "../../shared/prisma";
import { SteadfastService } from "../order/steadfast-service";
import { ReturnService } from "./return.service";

const syncOrderReturnStatus = async (orderId: string) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
    });

    if (!order || !order.trackingNumber) {
        return null;
    }

    const steadfastStatus = await SteadfastService.trackOrder(order.orderNumber);

    if (!steadfastStatus || !steadfastStatus.delivery_status) {
        return null;
    }

    const status = steadfastStatus.delivery_status.toLowerCase();

    // If status is cancelled or returned, and no return order exists, create one
    if (status.includes("cancelled") || status.includes("returned")) {
        const existingReturn = await prisma.returnOrder.findUnique({
            where: { orderId: order.id },
        });

        if (!existingReturn) {
            // Create automated return request
            return await ReturnService.createReturn(order.merchantDetailsId, {
                orderId: order.id,
                reason: `Automated return from Steadfast (Status: ${steadfastStatus.delivery_status})`,
                items: order.items.map((item) => ({
                    variantId: item.variantId,
                    quantity: item.quantity,
                })),
            }, true); // Pass true for automated/internal call
        }
    }

    return null;
};

export const SteadfastReturnSync = {
    syncOrderReturnStatus,
};

import { OrderService } from "../modules/order/order.service";


export const initCronJobs = () => {
    console.log("[JOB] Initializing background tasks...");

    const STEADFAST_SYNC_INTERVAL = 30 * 60 * 1000;

    setInterval(async () => {
        try {
            await OrderService.syncAllSteadfastOrders();
        } catch (error) {
            console.error("[JOB-CRITICAL] Steadfast sync interval failed:", error);
        }
    }, STEADFAST_SYNC_INTERVAL);


    setTimeout(async () => {
        try {
            await OrderService.syncAllSteadfastOrders();
        } catch (error) {
            console.error("[JOB-CRITICAL] Initial Steadfast sync failed:", error);
        }
    }, 10000);

    console.log(`[JOB] Background tasks scheduled. Steadfast sync every 30 minutes.`);
};

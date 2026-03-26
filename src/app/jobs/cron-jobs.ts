import { OrderService } from "../modules/order/order.service";

/**
 * Initialize all background cron jobs
 */
export const initCronJobs = () => {
    console.log("[JOB] Initializing background tasks...");

    // Sync Steadfast order statuses every 30 minutes
    // 30 minutes = 30 * 60 * 1000 ms
    const STEADFAST_SYNC_INTERVAL = 30 * 60 * 1000;

    setInterval(async () => {
        try {
            await OrderService.syncAllSteadfastOrders();
        } catch (error) {
            console.error("[JOB-CRITICAL] Steadfast sync interval failed:", error);
        }
    }, STEADFAST_SYNC_INTERVAL);

    // Run once immediately on startup (optional, but good for verification)
    // We'll delay it slightly to ensure database connections are fully established
    setTimeout(async () => {
        try {
            await OrderService.syncAllSteadfastOrders();
        } catch (error) {
            console.error("[JOB-CRITICAL] Initial Steadfast sync failed:", error);
        }
    }, 10000); // 10 seconds after startup

    console.log(`[JOB] Background tasks scheduled. Steadfast sync every 30 minutes.`);
};

import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { OrderService } from "./order.service";

const createOrder = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await OrderService.createOrder(user.userId, req.body);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Order created successfully",
        data: result,
    });
});

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await OrderService.getMyOrders(user.userId, req.query as any);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Your orders fetched successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
    const result = await OrderService.getAllOrders(req.query as any);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "All orders fetched successfully",
        meta: result.meta,
        data: result.data,
    });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await OrderService.updateOrderStatus(id, req.body);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Order status updated successfully",
        data: result,
    });
});

const deleteOrder = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await OrderService.deleteOrder(id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Order deleted successfully",
        data: result,
    });
});

const updateOrder = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;
    const result = await OrderService.updateOrder(user.userId, id, req.body);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Order updated successfully",
        data: result,
    });
});

const getSingleOrder = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await OrderService.getSingleOrder(id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Order fetched successfully",
        data: result,
    });
});

export const OrderController = {
    createOrder,
    getMyOrders,
    getAllOrders,
    getSingleOrder,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
};

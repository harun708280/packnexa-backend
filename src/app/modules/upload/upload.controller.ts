import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";

const uploadFiles = catchAsync(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
        throw new Error("No files uploaded");
    }

    const filePaths = files.map(file => {
        const relativePath = file.path.split("uploads/").pop();
        return `uploads/${relativePath}`;
    });

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Files uploaded successfully",
        data: filePaths,
    });
});

export const UploadController = {
    uploadFiles,
};

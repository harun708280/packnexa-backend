import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { fileUploader } from "../../helper/fileUploader";

const uploadFiles = catchAsync(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
        throw new Error("No files uploaded");
    }

    const uploadPromises = files.map(file => fileUploader.uploadToCloudinary(file));
    const uploadResults = await Promise.all(uploadPromises);

    const fileUrls = uploadResults.map(result => result.secure_url);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Files uploaded successfully",
        data: fileUrls,
    });
});

export const UploadController = {
    uploadFiles,
};

import { Response } from 'express';

type SendResponse = {
  statusCode?: number;
  success?: boolean;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  data?: any;
};

const sendResponse = (res: Response, payload: SendResponse) => {
  const { statusCode = 200, success = true, message = '', meta, data = null } = payload;
  return res.status(statusCode).json({ success, message, meta, data });
};

export default sendResponse;

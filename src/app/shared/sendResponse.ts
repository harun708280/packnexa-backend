import { Response } from 'express';

type SendResponse = {
  statusCode?: number;
  success?: boolean;
  message?: string;
  data?: any;
};

const sendResponse = (res: Response, payload: SendResponse) => {
  const { statusCode = 200, success = true, message = '', data = null } = payload;
  return res.status(statusCode).json({ success, message, data });
};

export default sendResponse;

import { Request } from 'express';

export interface ReqWithUser extends Request {
  userId: string;
}

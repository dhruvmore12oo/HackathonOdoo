import { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { sendSuccess, sendNoContent } from '../../lib/response';
import { AuthenticatedRequest } from '../../types';
import * as userService from './user.service';

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const user = await userService.updateProfile(authReq.user!.userId, req.body);
  sendSuccess(res, user, 'Profile updated');
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!req.file) {
    res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
    return;
  }
  const user = await userService.uploadAvatar(authReq.user!.userId, req.file.filename);
  sendSuccess(res, user, 'Avatar updated');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  await userService.changePassword(
    authReq.user!.userId,
    req.body.current_password,
    req.body.new_password
  );
  sendSuccess(res, null, 'Password changed successfully');
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  await userService.deleteAccount(authReq.user!.userId, req.body.password);
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  sendNoContent(res);
});

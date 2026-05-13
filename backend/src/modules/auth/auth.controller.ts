import { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { sendSuccess, sendCreated, sendNoContent } from '../../lib/response';
import { AuthenticatedRequest } from '../../types';
import { env } from '../../config/env';
import * as authService from './auth.service';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
  sendCreated(res, {
    user: result.user,
    accessToken: result.tokens.accessToken,
  }, 'Registration successful');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, {
    user: result.user,
    accessToken: result.tokens.accessToken,
  }, 'Login successful');
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.googleLogin(req.body.idToken, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, {
    user: result.user,
    accessToken: result.tokens.accessToken,
  }, 'Google login successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({
      success: false,
      error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token provided' },
    });
    return;
  }

  const result = await authService.refresh(refreshToken, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, { accessToken: result.tokens.accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (refreshToken) {
    await authService.logout(refreshToken);
  }
  res.clearCookie('refreshToken', { path: '/' });
  sendNoContent(res);
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const user = await authService.getMe(authReq.user!.userId);
  sendSuccess(res, user);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  // Always return success to prevent user enumeration
  sendSuccess(res, null, 'If an account exists with this email, a reset link has been sent');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.clearCookie('refreshToken', { path: '/' });
  sendSuccess(res, null, 'Password has been reset successfully');
});

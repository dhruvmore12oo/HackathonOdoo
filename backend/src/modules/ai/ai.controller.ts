import { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { sendSuccess } from '../../lib/response';
import * as aiService from './ai.service';

export const generateItinerary = asyncHandler(async (req: Request, res: Response) => {
  const { destination, startDate, endDate, budget, currency, interests, travelStyle } = req.body;

  const result = await aiService.generateItinerary({
    tripId: req.params.tripId || '',
    destination,
    startDate,
    endDate,
    budget: budget ? Number(budget) : undefined,
    currency,
    interests,
    travelStyle,
  });

  sendSuccess(res, result);
});

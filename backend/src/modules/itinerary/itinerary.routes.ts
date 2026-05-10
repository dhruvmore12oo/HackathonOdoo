import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import {
  createSectionSchema, updateSectionSchema, reorderSectionsSchema,
  createActivitySchema, updateActivitySchema, reorderActivitiesSchema,
  tripIdParamSchema, sectionIdParamSchema, activityIdParamSchema,
  sectionIdForActivitySchema,
} from './itinerary.schema';
import * as ctrl from './itinerary.controller';

const router = Router();

router.use(authenticate);

// ── Full itinerary ──
router.get('/trips/:tripId/itinerary', validate(tripIdParamSchema, 'params'), ctrl.getItinerary);

// ── Sections ──
router.post('/trips/:tripId/itinerary/sections', validate(tripIdParamSchema, 'params'), validate(createSectionSchema), ctrl.createSection);
router.patch('/itinerary/sections/:id', validate(sectionIdParamSchema, 'params'), validate(updateSectionSchema), ctrl.updateSection);
router.delete('/itinerary/sections/:id', validate(sectionIdParamSchema, 'params'), ctrl.deleteSection);
router.patch('/itinerary/sections/reorder', validate(reorderSectionsSchema), ctrl.reorderSections);

// ── Activities ──
router.post('/itinerary/sections/:sectionId/activities', validate(sectionIdForActivitySchema, 'params'), validate(createActivitySchema), ctrl.createActivity);
router.patch('/itinerary/activities/:id', validate(activityIdParamSchema, 'params'), validate(updateActivitySchema), ctrl.updateActivity);
router.delete('/itinerary/activities/:id', validate(activityIdParamSchema, 'params'), ctrl.deleteActivity);
router.patch('/itinerary/activities/reorder', validate(reorderActivitiesSchema), ctrl.reorderActivities);

// ── Duplicate ──
router.post('/trips/:tripId/itinerary/duplicate', validate(tripIdParamSchema, 'params'), ctrl.duplicateItinerary);

export default router;

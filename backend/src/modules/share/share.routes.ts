import { Router } from 'express';
import { authenticate, optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  createShareLinkSchema, slugParamSchema, shareIdParamSchema,
  inviteCollaboratorSchema, updateCollaboratorSchema, collaboratorIdParamSchema,
  tripIdParamSchema, publicTripsQuerySchema, verifyPasswordSchema,
} from './share.schema';
import * as ctrl from './share.controller';

const router = Router();

// ── Public / optional-auth routes ─────────────────────────────────────────────
router.get('/share/:slug', validate(slugParamSchema, 'params'), optionalAuth, ctrl.getPublicTrip);
router.post('/share/:slug/verify-password', validate(slugParamSchema, 'params'), validate(verifyPasswordSchema), ctrl.verifyPassword);

// ── Community routes (no auth needed) ─────────────────────────────────────────
router.get('/community/public-trips', validate(publicTripsQuerySchema, 'query'), ctrl.getPublicTrips);
router.get('/community/featured-trips', validate(publicTripsQuerySchema, 'query'), ctrl.getPublicTrips);

// ── Authenticated routes ───────────────────────────────────────────────────────
router.use(authenticate);

// Share link management
router.post('/trips/:tripId/share', validate(tripIdParamSchema, 'params'), validate(createShareLinkSchema), ctrl.createShareLink);
router.get('/trips/:tripId/share-links', validate(tripIdParamSchema, 'params'), ctrl.getShareLinks);
router.patch('/shares/:id/revoke', validate(shareIdParamSchema, 'params'), ctrl.revokeShareLink);
router.patch('/shares/:id/regenerate', validate(shareIdParamSchema, 'params'), ctrl.regenerateShareLink);

// Collaborators
router.post('/trips/:tripId/collaborators', validate(tripIdParamSchema, 'params'), validate(inviteCollaboratorSchema), ctrl.inviteCollaborator);
router.get('/trips/:tripId/collaborators', validate(tripIdParamSchema, 'params'), ctrl.listCollaborators);
router.post('/trips/:tripId/collaborators/accept', validate(tripIdParamSchema, 'params'), ctrl.acceptInvitation);
router.patch('/collaborators/:id', validate(collaboratorIdParamSchema, 'params'), validate(updateCollaboratorSchema), ctrl.updateCollaborator);
router.delete('/collaborators/:id', validate(collaboratorIdParamSchema, 'params'), ctrl.removeCollaborator);

// Invitations
router.get('/my-invitations', ctrl.getMyInvitations);
router.post('/trips/:tripId/collaborators/decline', validate(tripIdParamSchema, 'params'), ctrl.declineInvitation);

// Activity feed
router.get('/trips/:tripId/activity-feed', validate(tripIdParamSchema, 'params'), ctrl.getActivityFeed);

export default router;

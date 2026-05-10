import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { uploadSingle } from '../../lib/upload';
import { createTripSchema, updateTripSchema, tripListQuerySchema, tripIdParamSchema } from './trip.schema';
import * as tripCtrl from './trip.controller';

const router = Router();

router.use(authenticate);

// CRUD
router.post('/', validate(createTripSchema), tripCtrl.create);
router.get('/', validate(tripListQuerySchema, 'query'), tripCtrl.list);
router.get('/stats', tripCtrl.stats);
router.get('/:id', validate(tripIdParamSchema, 'params'), tripCtrl.getOne);
router.patch('/:id', validate(tripIdParamSchema, 'params'), validate(updateTripSchema), tripCtrl.update);
router.delete('/:id', validate(tripIdParamSchema, 'params'), tripCtrl.remove);

// Actions
router.patch('/:id/archive', validate(tripIdParamSchema, 'params'), tripCtrl.archiveTrip);
router.patch('/:id/restore', validate(tripIdParamSchema, 'params'), tripCtrl.restoreTrip);
router.post('/:id/duplicate', validate(tripIdParamSchema, 'params'), tripCtrl.duplicate);

// Cover image
router.patch('/:id/cover', validate(tripIdParamSchema, 'params'), uploadSingle('cover'), tripCtrl.uploadCover);

export default router;

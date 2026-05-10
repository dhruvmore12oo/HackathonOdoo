import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { uploadSingle } from '../../lib/upload';
import { updateProfileSchema, changePasswordSchema, deleteAccountSchema } from './user.schema';
import * as userCtrl from './user.controller';

const router = Router();

router.use(authenticate);

router.patch('/profile', validate(updateProfileSchema), userCtrl.updateProfile);
router.patch('/avatar', uploadSingle('avatar'), userCtrl.uploadAvatar);
router.patch('/change-password', validate(changePasswordSchema), userCtrl.changePassword);
router.delete('/account', validate(deleteAccountSchema), userCtrl.deleteAccount);

export default router;

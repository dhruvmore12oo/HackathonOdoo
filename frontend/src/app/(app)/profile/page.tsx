'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Shield, Trash2, AlertTriangle } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Modal, Alert, Avatar } from '@/components/ui';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { useAuthStore } from '@/stores/authStore';
import { useUpdateProfile, useUploadAvatar, useChangePassword, useDeleteAccount, useLogout } from '@/hooks/useAuth';

// ── Profile schema ──
const profileSchema = z.object({
  first_name: z.string().min(1, 'Required').max(80),
  last_name: z.string().min(1, 'Required').max(80),
  phone: z.string().max(20).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  bio: z.string().max(500).optional().or(z.literal('')),
});
type ProfileForm = z.infer<typeof profileSchema>;

// ── Change password schema ──
const passwordSchema = z.object({
  current_password: z.string().min(1, 'Required'),
  new_password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'One uppercase')
    .regex(/[a-z]/, 'One lowercase')
    .regex(/[0-9]/, 'One number')
    .regex(/[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\\/]/, 'One special character'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Passwords do not match', path: ['confirm_password'],
}).refine((d) => d.current_password !== d.new_password, {
  message: 'New password must be different', path: ['new_password'],
});
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user } = useAuthStore();
  const logout = useLogout();
  const { mutate: updateProfile, isPending: profilePending } = useUpdateProfile();
  const { mutate: uploadAvatar, isPending: avatarPending } = useUploadAvatar();
  const { mutate: changePassword, isPending: passwordPending } = useChangePassword();
  const { mutate: deleteAccount, isPending: deletePending } = useDeleteAccount();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      city: user?.city || '',
      country: user?.country || '',
      bio: user?.bio || '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  });

  const onProfileSubmit = (data: ProfileForm) => {
    updateProfile(data);
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    changePassword(
      { current_password: data.current_password, new_password: data.new_password },
      { onSuccess: () => passwordForm.reset() }
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar(file);
  };

  const handleDelete = () => {
    if (deletePassword) {
      deleteAccount(deletePassword);
    }
  };

  if (!user) return null;

  return (
    <div className="animate-in max-w-2xl mx-auto space-y-6">
      <h1 className="section-heading">Profile Settings</h1>

      {/* ── Avatar Section ── */}
      <Card>
        <CardContent className="flex items-center gap-5">
          <div className="relative group">
            <Avatar
              src={user.profile_photo_url}
              firstName={user.first_name}
              lastName={user.last_name}
              size="xl"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarPending}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              aria-label="Change avatar"
            >
              <Camera className="h-6 w-6 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <p className="font-heading font-bold text-lg text-gray-900">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-sm text-muted">{user.email}</p>
            <p className="text-xs text-muted mt-1">
              Member since {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Profile Info ── */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4" id="profile-form">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" {...profileForm.register('first_name')} error={profileForm.formState.errors.first_name?.message} />
              <Input label="Last Name" {...profileForm.register('last_name')} error={profileForm.formState.errors.last_name?.message} />
            </div>
            <Input label="Phone" type="tel" {...profileForm.register('phone')} error={profileForm.formState.errors.phone?.message} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="City" {...profileForm.register('city')} />
              <Input label="Country" {...profileForm.register('country')} />
            </div>
            <div>
              <label className="label-base">Bio</label>
              <textarea
                className="input-base min-h-[80px] resize-none"
                maxLength={500}
                {...profileForm.register('bio')}
              />
            </div>
            <Button type="submit" isLoading={profilePending}>Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Change Password ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand-500" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4" id="password-form">
            <PasswordInput
              label="Current Password"
              {...passwordForm.register('current_password')}
              error={passwordForm.formState.errors.current_password?.message}
              autoComplete="current-password"
            />
            <PasswordInput
              label="New Password"
              {...passwordForm.register('new_password')}
              error={passwordForm.formState.errors.new_password?.message}
              autoComplete="new-password"
            />
            <PasswordInput
              label="Confirm New Password"
              {...passwordForm.register('confirm_password')}
              error={passwordForm.formState.errors.confirm_password?.message}
              autoComplete="new-password"
            />
            <Button type="submit" variant="outline" isLoading={passwordPending}>
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Actions ── */}
      <Card>
        <CardContent className="flex items-center justify-between">
          <Button variant="outline" onClick={logout}>Sign Out</Button>
          <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setShowDeleteModal(true)}>
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* ── Delete Confirmation Modal ── */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account" size="sm">
        <div className="space-y-4">
          <Alert variant="warning" title="This action is irreversible">
            All your trips, itineraries, and data will be permanently deleted.
          </Alert>
          <PasswordInput
            label="Enter your password to confirm"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deletePending}
              disabled={!deletePassword}
            >
              Delete My Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

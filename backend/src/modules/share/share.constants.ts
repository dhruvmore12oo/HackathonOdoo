export const COLLABORATOR_ROLES = ['owner', 'editor', 'viewer'] as const;
export type CollaboratorRoleType = (typeof COLLABORATOR_ROLES)[number];

export const MANAGEABLE_COLLABORATOR_ROLES = ['editor', 'viewer'] as const;
export type ManageableCollaboratorRoleType = (typeof MANAGEABLE_COLLABORATOR_ROLES)[number];

export const FEED_ACTIONS = {
  TRIP_CREATED: 'trip_created',
  TRIP_UPDATED: 'trip_updated',
  TRIP_ARCHIVED: 'trip_archived',
  TRIP_RESTORED: 'trip_restored',
  TRIP_SHARED: 'trip_shared',
  COLLABORATOR_INVITED: 'collaborator_invited',
  COLLABORATOR_ACCEPTED: 'collaborator_accepted',
  COLLABORATOR_REMOVED: 'collaborator_removed',
  COLLABORATOR_ROLE_CHANGED: 'collaborator_role_changed',
  ITINERARY_SECTION_ADDED: 'itinerary_section_added',
  ITINERARY_SECTION_DELETED: 'itinerary_section_deleted',
  ACTIVITY_ADDED: 'activity_added',
  EXPENSE_ADDED: 'expense_added',
  NOTE_ADDED: 'note_added',
} as const;

export type FeedActionType = (typeof FEED_ACTIONS)[keyof typeof FEED_ACTIONS];

export const SLUG_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
export const SLUG_LENGTH = 12;

/** Permissions: which roles can perform which actions */
export const ROLE_PERMISSIONS: Record<CollaboratorRoleType, {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageCollaborators: boolean;
  canManageShare: boolean;
}> = {
  owner: { canView: true, canEdit: true, canDelete: true, canManageCollaborators: true, canManageShare: true },
  editor: { canView: true, canEdit: true, canDelete: false, canManageCollaborators: false, canManageShare: false },
  viewer: { canView: true, canEdit: false, canDelete: false, canManageCollaborators: false, canManageShare: false },
};

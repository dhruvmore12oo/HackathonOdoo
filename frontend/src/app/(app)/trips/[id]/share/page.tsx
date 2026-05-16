'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Share2, Link2, Copy, Check, Trash2, UserPlus,
  Shield, Eye, Edit3, Users, Clock, Globe, Lock, Activity,
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Spinner, Badge, Input, Modal } from '@/components/ui';
import {
  useShareLinks, useCreateShareLink, useRevokeShareLink,
  useCollaborators, useInviteCollaborator, useRemoveCollaborator,
  useUpdateCollaborator, useActivityFeed,
} from '@/hooks/useShare';
import { useTrip } from '@/hooks/useTrips';
import { ROUTES } from '@/lib/constants';
import { canManageCollaboration, getTripRole } from '@/lib/permissions';
import { formatDate, getAssetUrl } from '@/lib/utils';
import type { CollaboratorRole, Collaborator } from '@/types';

type ManagedCollaboratorRole = Exclude<CollaboratorRole, 'owner'>;

const ROLE_ICONS: Record<CollaboratorRole, React.ElementType> = { owner: Shield, editor: Edit3, viewer: Eye };
const ROLE_COLORS: Record<CollaboratorRole, string> = {
  owner: 'bg-purple-100 text-purple-700',
  editor: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
};
const ACTION_LABELS: Record<string, string> = {
  trip_created: '🗺️ Created the trip',
  trip_updated: '✏️ Updated trip details',
  trip_shared: '🔗 Shared the trip',
  collaborator_invited: '👤 Invited a collaborator',
  collaborator_accepted: '✅ Joined as collaborator',
  collaborator_removed: '❌ Removed a collaborator',
  itinerary_section_added: '📅 Added an itinerary section',
  activity_added: '📍 Added an activity',
  expense_added: '💰 Added an expense',
};

function ShareLinksSection({ tripId }: { tripId: string }) {
  const { data: links, isLoading } = useShareLinks(tripId);
  const { mutate: createLink, isPending: creating } = useCreateShareLink(tripId);
  const { mutate: revokeLink } = useRevokeShareLink(tripId);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [expiryDays, setExpiryDays] = useState('');
  const [password, setPassword] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'unlisted'>('public');

  const copyLink = (slug: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${slug}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Link2 className="h-4 w-4 text-brand-500" /> Share Links</CardTitle>
        <Button size="sm" onClick={() => setShowCreate(true)} leftIcon={<Share2 className="h-3.5 w-3.5" />}>Create Link</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <div className="flex justify-center py-4"><Spinner size="sm" /></div>
          : links && links.length > 0 ? links.map((link) => (
            <div key={link.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {link.visibility === 'public' ? <Globe className="h-3.5 w-3.5 text-green-500" /> : <Lock className="h-3.5 w-3.5 text-gray-400" />}
                  <span className="text-sm font-medium text-gray-800 truncate">/share/{link.slug}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {link.expires_at ? `Expires ${formatDate(link.expires_at)}` : 'Never expires'}
                  {link.password_hash && <span className="text-amber-500 ml-1">• Password protected</span>}
                </p>
              </div>
              <button onClick={() => copyLink(link.slug, link.id)} className="p-1.5 rounded-lg hover:bg-brand-50 transition">
                {copiedId === link.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
              </button>
              <button onClick={() => revokeLink(link.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition">
                <Trash2 className="h-4 w-4 text-red-400" />
              </button>
            </div>
          )) : <p className="text-center text-sm text-gray-400 py-4">No share links yet. Create one!</p>}
      </CardContent>
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Share Link" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label-base">Visibility</label>
            <select className="input-base" value={visibility} onChange={(e) => setVisibility(e.target.value as 'public' | 'unlisted')}>
              <option value="public">🌍 Public (discoverable)</option>
              <option value="unlisted">🔒 Unlisted (link only)</option>
            </select>
          </div>
          <Input label="Expires in (days)" type="number" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} placeholder="Leave blank for no expiry" />
          <Input label="Password (optional)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank for no password" />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button isLoading={creating} onClick={() => createLink({ visibility, expires_in_days: expiryDays ? Number(expiryDays) : undefined, password: password || undefined }, { onSuccess: () => { setShowCreate(false); setExpiryDays(''); setPassword(''); } })}>
              Create Link
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

function CollabRow({
  collab, canManage, onRemove, onRoleChange,
}: {
  collab: Collaborator;
  canManage: boolean;
  onRemove: () => void;
  onRoleChange: (role: ManagedCollaboratorRole) => void;
}) {
  const Icon = ROLE_ICONS[collab.role] ?? Eye;
  const initials = `${collab.first_name?.[0] ?? ''}${collab.last_name?.[0] ?? ''}`.toUpperCase() || '?';
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 group">
      <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700 shrink-0">
        {collab.avatar_url ? <img src={getAssetUrl(collab.avatar_url)} className="h-9 w-9 rounded-full object-cover" alt={initials} /> : initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{collab.first_name} {collab.last_name}</p>
        <p className="text-xs text-gray-400">{collab.email}</p>
      </div>
      <Badge className={`text-[10px] flex items-center gap-1 ${ROLE_COLORS[collab.role]}`}>
        <Icon className="h-3 w-3" /> {collab.accepted_at ? collab.role : 'pending'}
      </Badge>
      {canManage && collab.role !== 'owner' && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <select className="text-xs border border-gray-200 rounded-lg px-1.5 py-0.5 bg-white" value={collab.role} onChange={(e) => onRoleChange(e.target.value as ManagedCollaboratorRole)}>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button onClick={onRemove} className="p-1 rounded hover:bg-red-50"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
        </div>
      )}
    </div>
  );
}

function CollaboratorsSection({ tripId, canManage }: { tripId: string; canManage: boolean }) {
  const { data: collaborators, isLoading } = useCollaborators(tripId);
  const { mutate: invite, isPending: inviting } = useInviteCollaborator(tripId);
  const { mutate: remove } = useRemoveCollaborator(tripId);
  const { mutate: updateRole } = useUpdateCollaborator(tripId);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ManagedCollaboratorRole>('viewer');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-brand-500" /> Collaborators</CardTitle>
        {canManage && (
          <Button size="sm" variant="outline" onClick={() => setShowInvite(true)} leftIcon={<UserPlus className="h-3.5 w-3.5" />}>Invite</Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? <div className="flex justify-center py-4"><Spinner size="sm" /></div>
          : collaborators && collaborators.length > 0
          ? collaborators.map((c) => (
            <CollabRow
              key={c.id}
              collab={c}
              canManage={canManage}
              onRemove={() => remove(c.id)}
              onRoleChange={(role) => updateRole({ id: c.id, role })}
            />
          ))
          : <p className="text-center text-sm text-gray-400 py-4">No collaborators yet.</p>}
      </CardContent>
      <Modal isOpen={canManage && showInvite} onClose={() => setShowInvite(false)} title="Invite Collaborator" size="sm">
        <div className="space-y-4">
          <Input label="Email Address" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="collaborator@email.com" />
          <div>
            <label className="label-base">Role</label>
            <select className="input-base" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as ManagedCollaboratorRole)}>
              <option value="viewer">👁️ Viewer — read only</option>
              <option value="editor">✏️ Editor — can edit</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button isLoading={inviting} disabled={!inviteEmail.trim()} onClick={() => invite({ email: inviteEmail, role: inviteRole }, { onSuccess: () => { setShowInvite(false); setInviteEmail(''); } })}>Invite</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

function ActivityFeedSection({ tripId }: { tripId: string }) {
  const { data: feed, isLoading } = useActivityFeed(tripId);
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-brand-500" /> Activity Feed</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <div className="flex justify-center py-4"><Spinner size="sm" /></div>
          : feed && feed.length > 0 ? feed.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="h-7 w-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700 shrink-0 mt-0.5">
                {item.actor_name?.split(' ').map((n) => n[0]).join('').toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="text-sm text-gray-800"><span className="font-medium">{item.actor_name ?? 'Someone'}</span> {ACTION_LABELS[item.action_type] ?? item.action_type}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(item.created_at).toLocaleString()}</p>
              </div>
            </div>
          )) : <p className="text-center text-sm text-gray-400 py-4">No activity yet</p>}
      </CardContent>
    </Card>
  );
}

export default function TripSharePage() {
  const params = useParams();
  const tripId = params.id as string;
  const { data: trip, isLoading } = useTrip(tripId);
  const canManage = canManageCollaboration(getTripRole(trip));

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div className="animate-in space-y-6 max-w-3xl mx-auto">
      <div>
        <Link href={ROUTES.TRIP(tripId)} className="text-sm text-link inline-flex items-center gap-1 mb-2"><ArrowLeft className="h-4 w-4" /> Back to trip</Link>
        <h1 className="section-heading flex items-center gap-2"><Share2 className="h-5 w-5 text-brand-500" /> Share & Collaborate</h1>
        <p className="text-sm text-gray-500 mt-1">
          {canManage ? 'Manage who can see and edit this trip.' : 'View collaborators and recent activity for this trip.'}
        </p>
      </div>
      {canManage && <ShareLinksSection tripId={tripId} />}
      <CollaboratorsSection tripId={tripId} canManage={canManage} />
      <ActivityFeedSection tripId={tripId} />
    </div>
  );
}

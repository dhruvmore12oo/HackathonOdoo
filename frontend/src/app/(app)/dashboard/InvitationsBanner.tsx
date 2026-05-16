'use client';

import { Check, X, MapPin, Calendar as CalendarIcon, Users } from 'lucide-react';
import { Button, Card, CardContent, Avatar } from '@/components/ui';
import { usePendingInvitations, useAcceptInvitation, useDeclineInvitation } from '@/hooks/useShare';
import { formatDate, getAssetUrl } from '@/lib/utils';
import type { PendingInvitation } from '@/types';

function InvitationCard({ invitation }: { invitation: PendingInvitation }) {
  const { mutate: accept, isPending: accepting } = useAcceptInvitation();
  const { mutate: decline, isPending: declining } = useDeclineInvitation();

  return (
    <Card className="border-brand-200 bg-brand-50/50 hover:bg-brand-50 transition-colors">
      <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          {invitation.trip_cover_photo_url ? (
            <img 
              src={getAssetUrl(invitation.trip_cover_photo_url)} 
              alt={invitation.trip_title} 
              className="w-16 h-16 rounded-xl object-cover border border-black/5"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-brand-100 flex items-center justify-center border border-brand-200">
              <MapPin className="h-6 w-6 text-brand-500" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{invitation.trip_title}</h3>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {formatDate(invitation.trip_start_date)}
              </span>
              {invitation.trip_destination_summary && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[150px]">{invitation.trip_destination_summary}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Avatar 
                src={invitation.avatar_url || undefined} 
                firstName={invitation.inviter_first_name}
                lastName={invitation.inviter_last_name}
                size="sm"
              />
              <p className="text-xs text-gray-600">
                <span className="font-medium text-gray-900">{invitation.inviter_first_name} {invitation.inviter_last_name}</span> invited you as an <span className="font-medium capitalize">{invitation.role}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 sm:flex-none border-red-200 hover:bg-red-50 hover:text-red-600"
            onClick={() => decline(invitation.trip_id)}
            disabled={accepting || declining}
            leftIcon={<X className="h-4 w-4" />}
          >
            Decline
          </Button>
          <Button 
            size="sm" 
            className="flex-1 sm:flex-none"
            onClick={() => accept(invitation.trip_id)}
            disabled={accepting || declining}
            isLoading={accepting}
            leftIcon={<Check className="h-4 w-4" />}
          >
            Accept
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function InvitationsBanner() {
  const { data: invitations, isLoading } = usePendingInvitations();

  if (isLoading || !invitations || invitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-5 w-5 text-brand-600" />
        <h2 className="font-heading text-lg font-bold text-gray-900">Pending Invitations</h2>
        <span className="bg-brand-100 text-brand-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          {invitations.length}
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {invitations.map((invitation) => (
          <InvitationCard key={invitation.id} invitation={invitation} />
        ))}
      </div>
    </div>
  );
}

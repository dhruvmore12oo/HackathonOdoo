'use client';

import { useEffect, useState } from 'react';
import { getSocket, RT_EVENTS, type PresenceInfo } from '@/lib/socket';

export function OnlinePresence({ tripId }: { tripId: string }) {
  const [members, setMembers] = useState<PresenceInfo[]>([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handlePresence = (list: PresenceInfo[]) => setMembers(list);
    socket.on(RT_EVENTS.PRESENCE_LIST, handlePresence);
    return () => { socket.off(RT_EVENTS.PRESENCE_LIST, handlePresence); };
  }, [tripId]);

  if (members.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-2">
        {members.slice(0, 5).map((m) => (
          <div
            key={m.userId}
            className="relative h-7 w-7 rounded-full bg-brand-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-brand-700"
            title={`${m.firstName} ${m.lastName}${m.editingSection ? ' (editing)' : ''}`}
          >
            {m.firstName[0]}{m.lastName[0]}
            <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
              m.editingSection ? 'bg-amber-400 animate-pulse' : 'bg-green-400'
            }`} />
          </div>
        ))}
      </div>
      {members.length > 5 && (
        <span className="text-xs text-gray-400">+{members.length - 5}</span>
      )}
      <span className="text-xs text-gray-400 ml-1">
        {members.length} online
      </span>
    </div>
  );
}

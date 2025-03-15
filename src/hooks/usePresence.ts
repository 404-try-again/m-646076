
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;

    // Mark current user as online when they login
    const updateUserStatus = async () => {
      try {
        // Update the user's status to "Online"
        await supabase
          .from('profiles')
          .update({ status: 'Online' })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error updating status:', error);
      }
    };

    // Create a channel for tracking user presence
    const channel = supabase.channel('online_users');

    // Track user presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const onlineUsersMap: Record<string, boolean> = {};
        
        // Convert presence state to a map of user IDs to online status
        Object.keys(newState).forEach(presenceId => {
          const presences = newState[presenceId] as any[];
          presences.forEach(presence => {
            if (presence.user_id) {
              onlineUsersMap[presence.user_id] = true;
            }
          });
        });
        
        setOnlineUsers(onlineUsersMap);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // New user has joined the channel
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // User has left the channel
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track user's presence
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Update user status in the database
    updateUserStatus();

    // Function to update status to "Offline" when user closes the page
    const handleBeforeUnload = async () => {
      try {
        await supabase
          .from('profiles')
          .update({ status: 'Offline' })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error updating status on unload:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Set status to offline and leave the channel when component unmounts
      const cleanup = async () => {
        try {
          await supabase
            .from('profiles')
            .update({ status: 'Offline' })
            .eq('id', user.id);
            
          channel.untrack();
          supabase.removeChannel(channel);
        } catch (error) {
          console.error('Error cleaning up presence:', error);
        }
      };
      
      cleanup();
    };
  }, [user]);

  // Check if a specific user is online
  const isUserOnline = (userId: string) => {
    return !!onlineUsers[userId];
  };

  return {
    onlineUsers,
    isUserOnline
  };
};

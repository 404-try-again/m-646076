
export interface User {
  id: string;
  name: string;
  avatar: string;
  status: string;
  online?: boolean;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id?: string; 
  chat_room_id?: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

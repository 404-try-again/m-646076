export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_room_users: {
        Row: {
          chat_room_id: number
          user_id: number
        }
        Insert: {
          chat_room_id: number
          user_id: number
        }
        Update: {
          chat_room_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_users_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_room_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          id: number
          is_group: boolean | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_group?: boolean | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_group?: boolean | null
          name?: string | null
        }
        Relationships: []
      }
      files: {
        Row: {
          chat_room_id: number | null
          file_path: string
          id: number
          uploaded_at: string | null
          user_id: number | null
        }
        Insert: {
          chat_room_id?: number | null
          file_path: string
          id?: number
          uploaded_at?: string | null
          user_id?: number | null
        }
        Update: {
          chat_room_id?: number | null
          file_path?: string
          id?: number
          uploaded_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "files_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_room_id: number | null
          expiry_time: string | null
          id: number
          message_text: string | null
          message_type: string | null
          read: boolean | null
          sender_id: number | null
          sent_at: string | null
        }
        Insert: {
          chat_room_id?: number | null
          expiry_time?: string | null
          id?: number
          message_text?: string | null
          message_type?: string | null
          read?: boolean | null
          sender_id?: number | null
          sent_at?: string | null
        }
        Update: {
          chat_room_id?: number | null
          expiry_time?: string | null
          id?: number
          message_text?: string | null
          message_type?: string | null
          read?: boolean | null
          sender_id?: number | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          profile_picture: string | null
          status: string | null
          two_factor_auth_method: string | null
          user_id: number
          username: string
        }
        Insert: {
          bio?: string | null
          profile_picture?: string | null
          status?: string | null
          two_factor_auth_method?: string | null
          user_id: number
          username: string
        }
        Update: {
          bio?: string | null
          profile_picture?: string | null
          status?: string | null
          two_factor_auth_method?: string | null
          user_id?: number
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          action: string
          activity_timestamp: string | null
          id: number
          user_id: number | null
        }
        Insert: {
          action: string
          activity_timestamp?: string | null
          id?: number
          user_id?: number | null
        }
        Update: {
          action?: string
          activity_timestamp?: string | null
          id?: number
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: number
          password_hash: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
          password_hash: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
          password_hash?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_file: {
        Args: {
          file_id: number
          p_user_id: number
        }
        Returns: undefined
      }
      enable_two_factor_auth: {
        Args: {
          p_user_id: number
          method: string
        }
        Returns: undefined
      }
      mark_message_as_read: {
        Args: {
          message_id: number
        }
        Returns: undefined
      }
      remove_user_from_group: {
        Args: {
          group_id: number
          p_user_id: number
          removed_by: number
        }
        Returns: undefined
      }
      send_message: {
        Args: {
          sender_id: number
          chat_room_id: number
          message: string
          message_type: string
        }
        Returns: undefined
      }
      set_message_expiry: {
        Args: {
          message_id: number
          expiry: string
        }
        Returns: undefined
      }
      set_user_status: {
        Args: {
          p_user_id: number
          p_status: string
        }
        Returns: undefined
      }
      track_user_activity: {
        Args: {
          user_id: number
          action: string
          activity_timestamp: string
        }
        Returns: undefined
      }
      update_user_profile: {
        Args: {
          p_user_id: number
          new_data: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

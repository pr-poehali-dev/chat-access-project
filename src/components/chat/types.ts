export interface Reaction {
  emoji: string;
  count: number;
}

export interface TypingUser {
  user_token: string;
  author_name?: string | null;
}

export interface Message {
  id: number;
  content: string;
  image_url?: string | null;
  image_urls?: string[];
  author_name?: string | null;
  created_at: string;
  reply_to?: number | null;
  user_token?: string | null;
  email?: string | null;
  is_pinned?: boolean;
  edited_at?: string | null;
  reactions?: Reaction[];
  user_reactions?: string[];
  admin_reacted?: boolean;
}

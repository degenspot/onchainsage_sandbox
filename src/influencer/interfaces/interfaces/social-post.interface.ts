export interface SocialPost {
    id: string;
    influencerId: string;
    content: string;
    timestamp: number;
    asset?: string; // cryptocurrency mentioned
    likes?: number;
    shares?: number;
    comments?: number;
  }
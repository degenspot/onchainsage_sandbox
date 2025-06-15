export interface DiscordGuildData {
    id: string;
    name: string;
    memberCount: number;
    channels: DiscordChannelData[];
    roles: DiscordRoleData[];
  }
  
  export interface DiscordChannelData {
    id: string;
    name: string;
    type: number;
    messageCount?: number;
    lastActivity?: Date;
  }
  
  export interface DiscordRoleData {
    id: string;
    name: string;
    memberCount: number;
  }
  
  export interface TelegramChatData {
    id: number;
    title: string;
    type: string;
    memberCount?: number;
    description?: string;
  }
  
  export interface CommunityHealthData {
    communityId: string;
    platform: PlatformType;
    timestamp: Date;
    metrics: {
      memberCount: number;
      activeMembers: number;
      messageCount: number;
      engagementRate: number;
      growthRate: number;
      retentionRate: number;
    };
    patterns: {
      peakActivity: { hour: number; day: string };
      responseRate: number;
      averageResponseTime: number;
      contentTypes: Record<string, number>;
    };
    healthScore: number;
    healthStatus: HealthStatus;
    alerts: string[];
  }
import { Achievement } from '../entities/achievement.entity';
import { AchievementCategory, AchievementRarity } from '../dto/achievement.dto';

export const achievementSeeds: Partial<Achievement>[] = [
  // Prediction Accuracy Achievements
  {
    name: 'Sharp Shooter',
    description: 'Achieve 80% accuracy on 10 predictions',
    category: AchievementCategory.PREDICTION_ACCURACY,
    rarity: AchievementRarity.COMMON,
    iconUrl: '/icons/sharp-shooter.png',
    pointsReward: 100,
    criteria: { minAccuracy: 0.8, minPredictions: 10 },
  },
  {
    name: 'Crystal Ball',
    description: 'Achieve 95% accuracy on 25 predictions',
    category: AchievementCategory.PREDICTION_ACCURACY,
    rarity: AchievementRarity.EPIC,
    iconUrl: '/icons/crystal-ball.png',
    pointsReward: 500,
    criteria: { minAccuracy: 0.95, minPredictions: 25 },
  },
  
  // Early Trend Achievements
  {
    name: 'Trend Spotter',
    description: 'Identify 5 trends before they become popular',
    category: AchievementCategory.EARLY_TREND,
    rarity: AchievementRarity.RARE,
    iconUrl: '/icons/trend-spotter.png',
    pointsReward: 250,
    criteria: { earlyTrends: 5, timeWindow: 24 }, // 24 hours before trend peaks
  },
  
  // Engagement Achievements
  {
    name: 'Active Participant',
    description: 'Make 50 predictions',
    category: AchievementCategory.ENGAGEMENT,
    rarity: AchievementRarity.COMMON,
    iconUrl: '/icons/active-participant.png',
    pointsReward: 150,
    criteria: { actionType: 'prediction', target: 50 },
  },
  {
    name: 'Social Butterfly',
    description: 'Comment on 25 predictions',
    category: AchievementCategory.SOCIAL,
    rarity: AchievementRarity.COMMON,
    iconUrl: '/icons/social-butterfly.png',
    pointsReward: 100,
    criteria: { actionType: 'comment', target: 25 },
  },
  
  // Streak Achievements
  {
    name: 'On Fire',
    description: 'Maintain a 7-day prediction streak',
    category: AchievementCategory.STREAK,
    rarity: AchievementRarity.RARE,
    iconUrl: '/icons/on-fire.png',
    pointsReward: 300,
    criteria: { targetStreak: 7 },
  },
  {
    name: 'Unstoppable',
    description: 'Maintain a 30-day prediction streak',
    category: AchievementCategory.STREAK,
    rarity: AchievementRarity.LEGENDARY,
    iconUrl: '/icons/unstoppable.png',
    pointsReward: 1000,
    criteria: { targetStreak: 30 },
  },
  
  // Milestone Achievements
  {
    name: 'Welcome Aboard',
    description: 'Complete your first prediction',
    category: AchievementCategory.MILESTONE,
    rarity: AchievementRarity.COMMON,
    iconUrl: '/icons/welcome.png',
    pointsReward: 50,
    criteria: { actionType: 'first_prediction', target: 1 },
  },
];

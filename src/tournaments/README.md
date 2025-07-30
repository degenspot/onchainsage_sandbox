# Tournament System - Competitive Prediction Markets

A comprehensive tournament system for competitive prediction markets with leaderboards, scoring algorithms, and reward distribution.

## 🏆 Features

### Tournament Management
- **Tournament Creation**: Create tournaments with customizable parameters
- **Tournament Types**: Daily, Weekly, Monthly, Seasonal, and Custom tournaments
- **Tournament Formats**: Points-based, Single Elimination, Double Elimination, Round Robin, Swiss System
- **Tournament Lifecycle**: Manage tournament status (Upcoming, Active, Completed, Cancelled)
- **Round Management**: Automatic round progression and management

### Participation System
- **User Registration**: Join tournaments with approval workflows
- **Participant Management**: Track participant status and performance
- **Entry Fees**: Optional entry fees with blockchain integration
- **Approval System**: Optional participant approval for private tournaments

### Prediction System
- **Multiple Prediction Types**: Yes/No, Numeric, Multiple Choice, Custom predictions
- **Confidence Scoring**: Users can express confidence levels in predictions
- **Staking System**: Optional token staking on predictions
- **Prediction Validation**: Automatic validation and scoring

### Scoring & Ranking
- **Advanced Scoring Algorithm**: Multi-factor scoring based on accuracy, confidence, and stakes
- **Real-time Rankings**: Live leaderboard updates
- **Round-based Scoring**: Separate scoring for each tournament round
- **Performance Analytics**: Detailed performance metrics and statistics

### Leaderboard System
- **Overall Leaderboards**: Tournament-wide rankings
- **Round Leaderboards**: Round-specific rankings
- **Historical Data**: Track ranking changes over time
- **Performance Metrics**: Accuracy rates, streaks, and statistics

### Reward System
- **Automatic Distribution**: Automatic reward distribution based on rankings
- **Multiple Reward Types**: Tokens, NFTs, Badges, XP, Custom rewards
- **Prize Pools**: Configurable prize distribution percentages
- **Blockchain Integration**: On-chain reward distribution

### Analytics Dashboard
- **Global Statistics**: Platform-wide tournament statistics
- **Tournament Analytics**: Individual tournament performance metrics
- **User Analytics**: Personal tournament performance tracking
- **Trend Analysis**: Historical trends and patterns
- **Performance Comparison**: Compare multiple tournaments

## 🏗️ Architecture

### Database Schema

#### Core Entities
- **Tournament**: Main tournament entity with configuration and status
- **TournamentParticipant**: User participation in tournaments
- **TournamentRound**: Tournament rounds and their status
- **TournamentPrediction**: Individual predictions made by participants
- **TournamentLeaderboard**: Rankings and scores
- **TournamentReward**: Rewards and prize distribution

#### Key Relationships
```
Tournament (1) → (N) TournamentParticipant
Tournament (1) → (N) TournamentRound
TournamentParticipant (1) → (N) TournamentPrediction
TournamentRound (1) → (N) TournamentPrediction
Tournament (1) → (N) TournamentLeaderboard
Tournament (1) → (N) TournamentReward
```

### Service Layer
- **TournamentService**: Core tournament management
- **TournamentParticipationService**: Participant management
- **TournamentScoringService**: Prediction scoring and validation
- **TournamentLeaderboardService**: Leaderboard generation and management
- **TournamentRewardService**: Reward distribution and management
- **TournamentAnalyticsService**: Analytics and statistics

## 📊 API Endpoints

### Tournament Management
```
POST   /api/tournaments                    # Create tournament
GET    /api/tournaments                    # Get all tournaments
GET    /api/tournaments/active             # Get active tournaments
GET    /api/tournaments/upcoming           # Get upcoming tournaments
GET    /api/tournaments/:id                # Get tournament by ID
PUT    /api/tournaments/:id/status         # Update tournament status
POST   /api/tournaments/:id/advance-round  # Advance tournament round
GET    /api/tournaments/search             # Search tournaments
```

### Participation
```
POST   /api/tournaments/join               # Join tournament
GET    /api/tournaments/:id/participants   # Get tournament participants
POST   /api/tournaments/:id/approve-participant/:participantId  # Approve participant
POST   /api/tournaments/:id/eliminate-participant/:participantId # Eliminate participant
```

### Predictions
```
POST   /api/tournaments/submit-prediction  # Submit prediction
GET    /api/tournaments/:id/predictions    # Get tournament predictions
POST   /api/tournaments/:id/calculate-scores # Calculate round scores
```

### Leaderboards
```
GET    /api/tournaments/:id/leaderboard    # Get tournament leaderboard
GET    /api/tournaments/:id/leaderboard/round/:roundNumber # Get round leaderboard
POST   /api/tournaments/:id/generate-leaderboard # Generate leaderboard
```

### Rewards
```
POST   /api/tournaments/:id/generate-rewards    # Generate rewards
POST   /api/tournaments/:id/distribute-rewards  # Distribute rewards
GET    /api/tournaments/:id/rewards             # Get tournament rewards
```

### Analytics
```
GET    /api/tournaments/:id/analytics           # Get tournament analytics
GET    /api/tournaments/analytics/global        # Get global statistics
GET    /api/tournaments/analytics/trends        # Get tournament trends
GET    /api/tournaments/analytics/top-performers # Get top performers
GET    /api/tournaments/user/:userId/stats      # Get user statistics
GET    /api/tournaments/user/:userId/participations # Get user participations
```

## 🎯 Scoring Algorithm

### Base Scoring
- **Correct Prediction**: +100 points
- **Incorrect Prediction**: -20 points
- **Confidence Bonus**: +50 points for high confidence (0.7+) correct predictions
- **Stake Bonus**: +10 points per token staked on correct predictions
- **Confidence Penalty**: -30 points for high confidence (0.8+) incorrect predictions

### Advanced Features
- **Streak Bonuses**: Consecutive correct predictions
- **Round Multipliers**: Different scoring for different rounds
- **Tournament Type Bonuses**: Special bonuses for different tournament types
- **Performance Decay**: Reduced scoring for repeated incorrect predictions

## 🏆 Reward System

### Prize Distribution
- **1st Place**: 50% of prize pool
- **2nd Place**: 30% of prize pool
- **3rd Place**: 20% of prize pool
- **Additional Rewards**: Badges, XP, NFTs for top performers

### Reward Types
- **Tokens**: Direct token rewards
- **NFTs**: Unique tournament NFTs
- **Badges**: Achievement badges
- **XP**: Experience points for gamification
- **Custom**: Custom reward types

## 📈 Analytics Features

### Global Analytics
- Total tournaments, participants, predictions, rewards
- Tournament type and format distribution
- Average participants and predictions per tournament
- Historical trends and patterns

### Tournament Analytics
- Participant statistics and performance
- Prediction accuracy and volume
- Score distribution and rankings
- Round-by-round analysis

### User Analytics
- Personal tournament performance
- Accuracy rates and rankings
- Reward history and earnings
- Participation trends

## 🎨 Frontend Features

### Modern UI/UX
- **Responsive Design**: Mobile-first responsive design
- **Bootstrap 5**: Modern CSS framework
- **Interactive Charts**: Chart.js integration for analytics
- **Real-time Updates**: Live leaderboard and score updates

### User Interface
- **Tournament Cards**: Visual tournament display
- **Leaderboard Tables**: Real-time ranking display
- **Analytics Dashboard**: Comprehensive statistics
- **Modal Forms**: Intuitive form interactions

### Interactive Features
- **Tournament Creation**: Step-by-step tournament setup
- **Participation Management**: Easy tournament joining
- **Prediction Submission**: User-friendly prediction interface
- **Reward Tracking**: Visual reward progress

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- NestJS framework
- TypeORM

### Installation
```bash
# Install dependencies
npm install

# Set up database
npm run migration:run

# Start development server
npm run start:dev
```

### Configuration
```typescript
// Database configuration
{
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'tournament_user',
  password: 'password',
  database: 'tournament_db',
  entities: [Tournament, TournamentParticipant, ...],
  synchronize: false
}
```

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@localhost:5432/tournament_db
JWT_SECRET=your-jwt-secret
API_PORT=3000
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### API Testing
```bash
# Test tournament creation
curl -X POST http://localhost:3000/api/tournaments \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Tournament",
    "description": "A test tournament",
    "tournamentType": "daily",
    "format": "points_based",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-02T00:00:00Z",
    "maxParticipants": 100,
    "totalRounds": 5
  }'
```

## 🔧 Development

### Project Structure
```
src/tournaments/
├── controllers/          # API controllers
├── services/            # Business logic
├── entities/            # Database entities
├── dto/                 # Data transfer objects
├── public/              # Frontend assets
└── README.md           # Documentation
```

### Adding New Features
1. Create entity in `entities/`
2. Add service methods in appropriate service
3. Create DTOs in `dto/`
4. Add controller endpoints
5. Update frontend if needed
6. Add tests

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository. 
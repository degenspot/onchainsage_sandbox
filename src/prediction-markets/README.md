# OnChainSage Prediction Markets

A comprehensive prediction markets system for cryptocurrency price predictions and event outcomes, built with NestJS and TypeScript.

## 🎯 Features

### Core Functionality
- **Market Creation**: Users can create prediction markets for token prices or events
- **Token Staking**: Users can participate by staking tokens on their predictions
- **Transparent Resolution**: Market outcomes are resolved transparently and on-chain
- **Automatic Distribution**: Winnings are distributed automatically to correct predictors
- **Comprehensive API**: All market data accessible via REST API
- **Modern UI**: Beautiful and responsive web interface

### Market Types
- **Token Price Markets**: Predict if a token will reach a target price
- **Event Outcome Markets**: Predict the outcome of specific events
- **Timeline Event Markets**: Predict when events will occur

### Resolution Methods
- **Oracle Resolution**: Automated resolution using price oracles
- **Manual Resolution**: Admin-controlled resolution
- **Community Vote**: Decentralized community voting

## 🏗️ Architecture

### Backend Structure
```
src/prediction-markets/
├── entities/                 # Database entities
│   ├── prediction-market.entity.ts
│   ├── market-participant.entity.ts
│   ├── market-outcome.entity.ts
│   └── market-resolution.entity.ts
├── dto/                     # Data transfer objects
│   ├── create-market.dto.ts
│   ├── participate-market.dto.ts
│   └── resolve-market.dto.ts
├── services/                # Business logic
│   ├── prediction-market.service.ts
│   ├── market-participation.service.ts
│   ├── market-resolution.service.ts
│   ├── market-analytics.service.ts
│   └── blockchain.service.ts
├── controllers/             # API endpoints
│   └── prediction-market.controller.ts
├── public/                  # Frontend assets
│   ├── index.html
│   └── prediction-markets.js
└── prediction-markets.module.ts
```

### Database Schema

#### PredictionMarket
- Market metadata (title, description, type)
- Timing (start/end dates)
- Financial data (total staked, volume, fees)
- Resolution information
- Status tracking

#### MarketParticipant
- User participation records
- Staked amounts and predictions
- Winnings calculation
- Claim status

#### MarketOutcome
- Possible outcomes (Yes/No/Custom)
- Stake distribution per outcome
- Correct outcome tracking

#### MarketResolution
- Resolution records
- Outcome determination
- Winnings distribution
- Resolution approval workflow

## 🚀 API Endpoints

### Market Management
```
POST   /prediction-markets                    # Create new market
GET    /prediction-markets                    # Get all markets
GET    /prediction-markets/open               # Get open markets
GET    /prediction-markets/search             # Search markets
GET    /prediction-markets/:id                # Get market by ID
GET    /prediction-markets/:id/analytics      # Get market analytics
```

### Participation
```
POST   /prediction-markets/:id/participate    # Participate in market
GET    /prediction-markets/participations/user # Get user participations
GET    /prediction-markets/:id/participations  # Get market participations
POST   /prediction-markets/participations/:id/claim # Claim winnings
```

### Resolution
```
POST   /prediction-markets/:id/resolve        # Resolve market
PUT    /prediction-markets/resolutions/:id/approve # Approve resolution
PUT    /prediction-markets/resolutions/:id/reject  # Reject resolution
POST   /prediction-markets/auto-resolve       # Auto-resolve token markets
```

### Analytics
```
GET    /prediction-markets/analytics/global           # Global statistics
GET    /prediction-markets/analytics/market-types     # Market type analytics
GET    /prediction-markets/analytics/user             # User analytics
GET    /prediction-markets/analytics/trends           # Market trends
GET    /prediction-markets/analytics/top-markets      # Top markets
GET    /prediction-markets/analytics/top-participants # Top participants
GET    /prediction-markets/analytics/accuracy         # Accuracy analytics
```

## 💰 Economic Model

### Staking Mechanism
- Users stake tokens to participate in predictions
- Stakes are locked until market resolution
- Platform collects a small fee (default 2.5%)

### Winnings Distribution
- Correct predictors share the prize pool
- Winnings distributed proportionally to stake amounts
- Platform fees deducted from total pool
- Automatic distribution on resolution

### Risk Management
- Minimum stake requirements
- Maximum stake limits
- Market validation rules
- Dispute resolution system

## 🔗 Blockchain Integration

### Smart Contract Features
- Market creation on-chain
- Token staking and locking
- Automated winnings distribution
- Oracle integration for price feeds

### Supported Networks
- Ethereum Mainnet
- Polygon
- Arbitrum
- Optimism

## 🎨 Frontend Features

### User Interface
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Live market data and statistics
- **Interactive Charts**: Market analytics and trends
- **Wallet Integration**: Connect Web3 wallets
- **Search & Filter**: Find markets easily

### Key Components
- Market creation wizard
- Participation interface
- Analytics dashboard
- User portfolio view
- Market detail pages

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Redis (optional, for caching)

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npm run migration:run

# Start development server
npm run start:dev
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/prediction_markets

# Blockchain
RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m

# Platform
PLATFORM_FEE_PERCENTAGE=2.5
MIN_STAKE_AMOUNT=0.01
MAX_STAKE_AMOUNT=10000
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:e2e
```

### API Testing
```bash
# Start server
npm run start:dev

# Test endpoints
curl http://localhost:3000/prediction-markets
```

## 📊 Analytics & Monitoring

### Key Metrics
- Total markets created
- Total volume traded
- User participation rates
- Market resolution accuracy
- Platform fee revenue

### Monitoring
- Market health indicators
- User engagement metrics
- Blockchain transaction monitoring
- Error tracking and alerting

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- API rate limiting
- Input validation and sanitization

### Blockchain Security
- Smart contract audits
- Multi-signature wallets
- Oracle verification
- Dispute resolution mechanisms

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
docker build -t prediction-markets .

# Run container
docker run -p 3000:3000 prediction-markets
```

### Production Considerations
- Database optimization
- Caching strategies
- Load balancing
- Monitoring and alerting
- Backup and recovery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Join our Discord community
- Email: support@onchainsage.com

---

**OnChainSage Prediction Markets** - Empowering decentralized prediction markets for the crypto ecosystem. 
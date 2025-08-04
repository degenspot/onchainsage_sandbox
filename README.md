# OnChainSage Sandbox

A modular, extensible platform for on-chain analytics, monitoring, and alerting.  
This project is built with [NestJS](https://nestjs.com/) and [TypeORM](https://typeorm.io/), and is designed to support a wide range of blockchain, trading, and social analytics use cases.

---

## Features

- **Authentication & Authorization**: Secure user management, roles, and permissions.
- **Custom Alerts**: Users can create alerts for price, volume, narrative, and whale activity, with notifications via email, SMS, push, or webhook.
- **Comprehensive Monitoring**: System health, metrics, and alerting modules.
- **Portfolio & Trading**: Track assets, simulate strategies, and analyze market data.
- **Narrative & Sentiment Analysis**: Social and news sentiment tracking, narrative detection.
- **Whale & Influencer Tracking**: Monitor large wallet movements and social influencer activity.
- **Governance & Voting**: On-chain polling, voting, and governance analytics.
- **Extensible Modules**: Easily add new analytics, data sources, and alert types.

---

## Directory Structure

```
onchainsage_sandbox/
│
├── Authentication & Authorization Module/   # User, auth, audit, and permissions
├── src/
│   ├── achievements/                        # Achievements and gamification
│   ├── arbitrage/                           # Arbitrage analytics
│   ├── custom-alerts/                       # User-defined alerting system
│   ├── influencer-tracker/                  # Influencer and social analytics
│   ├── narrative/                           # Narrative and sentiment analysis
│   ├── portfolio/                           # Portfolio management
│   ├── whale-tracker/                       # Whale activity monitoring
│   ├── ...                                  # Many more analytics modules
│   └── app.module.ts                        # Main application module
├── test/                                    # End-to-end and integration tests
├── package.json                             # Project dependencies and scripts
└── README.md                                # This file
```

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL (or your preferred TypeORM-compatible DB)
- Yarn or npm

### Installation

```bash
npm install
# or
yarn install
```

### Database Setup

- Configure your database connection in `ormconfig.json` or via environment variables.
- Run migrations to set up tables:

```bash
npm run typeorm migration:run
```

### Running the App

```bash
npm run start:dev
```

### Testing

```bash
npm run test
```

---

## Custom Alerts System

- Users can create, update, and delete custom alerts for price, volume, narrative, and whale activity.
- Alerts can be configured with thresholds and conditions.
- Notifications are sent via email, SMS, push, or webhook.
- Alert history and performance are tracked.
- Alerts can be shared and exported.

See [`src/custom-alerts/README.md`](src/custom-alerts/README.md) for full details.

---

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

---

## License

This project is UNLICENSED. See the `LICENSE` file for details.

---

## Contact

For questions, reach out to the maintainers or open an issue.

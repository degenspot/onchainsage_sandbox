export enum SignalType {
    BUY = 'BUY',
    SELL = 'SELL',
    HOLD = 'HOLD'
  }
  
  export enum SignalStatus {
    ACTIVE = 'ACTIVE',
    EXECUTED = 'EXECUTED',
    CLOSED = 'CLOSED',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED'
  }
  
  export enum TradingPair {
    BTCUSD = 'BTC/USD',
    ETHUSD = 'ETH/USD',
    ADAUSD = 'ADA/USD',
    SOLUSD = 'SOL/USD'
  }
  
  export enum ValidationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    UNDER_REVIEW = 'UNDER_REVIEW'
  }
  
  export enum ValidationType {
    TECHNICAL_ANALYSIS = 'TECHNICAL_ANALYSIS',
    FUNDAMENTAL_ANALYSIS = 'FUNDAMENTAL_ANALYSIS',
    RISK_ASSESSMENT = 'RISK_ASSESSMENT',
    BACKTESTING = 'BACKTESTING'
  }
  
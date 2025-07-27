export interface ComponentDefinition {
  id: string;
  name: string;
  type: ComponentType;
  description: string;
  category: string;
  inputs: ComponentInput[];
  outputs: ComponentOutput[];
  config: ComponentConfig[];
  icon: string;
}

export interface ComponentInput {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'array';
  required: boolean;
  description: string;
}

export interface ComponentOutput {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'array';
  description: string;
}

export interface ComponentConfig {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'select' | 'range';
  defaultValue: any;
  options?: any[];
  min?: number;
  max?: number;
  description: string;
}

export const COMPONENT_LIBRARY: ComponentDefinition[] = [
  // Data Sources
  {
    id: 'price-data',
    name: 'Price Data',
    type: ComponentType.DATA_SOURCE,
    description: 'Provides OHLCV price data for a given symbol',
    category: 'Data Sources',
    inputs: [],
    outputs: [
      { id: 'open', name: 'Open', type: 'number', description: 'Opening price' },
      { id: 'high', name: 'High', type: 'number', description: 'High price' },
      { id: 'low', name: 'Low', type: 'number', description: 'Low price' },
      { id: 'close', name: 'Close', type: 'number', description: 'Closing price' },
      { id: 'volume', name: 'Volume', type: 'number', description: 'Trading volume' },
    ],
    config: [
      {
        id: 'symbol',
        name: 'Symbol',
        type: 'string',
        defaultValue: 'BTCUSDT',
        description: 'Trading pair symbol',
      },
      {
        id: 'timeframe',
        name: 'Timeframe',
        type: 'select',
        defaultValue: '1h',
        options: ['1m', '5m', '15m', '1h', '4h', '1d'],
        description: 'Candlestick timeframe',
      },
    ],
    icon: 'candlestick-chart',
  },
  
  // Technical Indicators
  {
    id: 'rsi',
    name: 'RSI',
    type: ComponentType.INDICATOR,
    description: 'Relative Strength Index momentum oscillator',
    category: 'Technical Indicators',
    inputs: [
      { id: 'price', name: 'Price', type: 'number', required: true, description: 'Input price series' },
    ],
    outputs: [
      { id: 'rsi', name: 'RSI', type: 'number', description: 'RSI value (0-100)' },
    ],
    config: [
      {
        id: 'period',
        name: 'Period',
        type: 'number',
        defaultValue: 14,
        min: 2,
        max: 200,
        description: 'Number of periods for RSI calculation',
      },
    ],
    icon: 'trending-up',
  },

  {
    id: 'moving-average',
    name: 'Moving Average',
    type: ComponentType.INDICATOR,
    description: 'Simple or exponential moving average',
    category: 'Technical Indicators',
    inputs: [
      { id: 'price', name: 'Price', type: 'number', required: true, description: 'Input price series' },
    ],
    outputs: [
      { id: 'ma', name: 'MA', type: 'number', description: 'Moving average value' },
    ],
    config: [
      {
        id: 'period',
        name: 'Period',
        type: 'number',
        defaultValue: 20,
        min: 1,
        max: 500,
        description: 'Number of periods',
      },
      {
        id: 'type',
        name: 'MA Type',
        type: 'select',
        defaultValue: 'sma',
        options: ['sma', 'ema', 'wma'],
        description: 'Type of moving average',
      },
    ],
    icon: 'activity',
  },

  // Conditions
  {
    id: 'price-crossover',
    name: 'Price Crossover',
    type: ComponentType.CONDITION,
    description: 'Detects when one price series crosses above/below another',
    category: 'Conditions',
    inputs: [
      { id: 'series1', name: 'Series 1', type: 'number', required: true, description: 'First price series' },
      { id: 'series2', name: 'Series 2', type: 'number', required: true, description: 'Second price series' },
    ],
    outputs: [
      { id: 'crossover', name: 'Crossover', type: 'boolean', description: 'True when series1 crosses above series2' },
      { id: 'crossunder', name: 'Crossunder', type: 'boolean', description: 'True when series1 crosses below series2' },
    ],
    config: [],
    icon: 'intersection',
  },

  {
    id: 'threshold-condition',
    name: 'Threshold',
    type: ComponentType.CONDITION,
    description: 'Checks if a value is above/below a threshold',
    category: 'Conditions',
    inputs: [
      { id: 'value', name: 'Value', type: 'number', required: true, description: 'Input value to check' },
    ],
    outputs: [
      { id: 'above', name: 'Above', type: 'boolean', description: 'True when value is above threshold' },
      { id: 'below', name: 'Below', type: 'boolean', description: 'True when value is below threshold' },
    ],
    config: [
      {
        id: 'threshold',
        name: 'Threshold',
        type: 'number',
        defaultValue: 50,
        description: 'Threshold value',
      },
    ],
    icon: 'minus',
  },

  // Actions
  {
    id: 'buy-order',
    name: 'Buy Order',
    type: ComponentType.ACTION,
    description: 'Places a buy order when triggered',
    category: 'Actions',
    inputs: [
      { id: 'trigger', name: 'Trigger', type: 'boolean', required: true, description: 'Signal to execute buy' },
      { id: 'price', name: 'Price', type: 'number', required: false, description: 'Optional limit price' },
    ],
    outputs: [],
    config: [
      {
        id: 'orderType',
        name: 'Order Type',
        type: 'select',
        defaultValue: 'market',
        options: ['market', 'limit'],
        description: 'Type of buy order',
      },
      {
        id: 'quantity',
        name: 'Quantity',
        type: 'number',
        defaultValue: 100,
        min: 0.01,
        description: 'Order quantity',
      },
    ],
    icon: 'arrow-up-circle',
  },

  {
    id: 'sell-order',
    name: 'Sell Order',
    type: ComponentType.ACTION,
    description: 'Places a sell order when triggered',
    category: 'Actions',
    inputs: [
      { id: 'trigger', name: 'Trigger', type: 'boolean', required: true, description: 'Signal to execute sell' },
      { id: 'price', name: 'Price', type: 'number', required: false, description: 'Optional limit price' },
    ],
    outputs: [],
    config: [
      {
        id: 'orderType',
        name: 'Order Type',
        type: 'select',
        defaultValue: 'market',
        options: ['market', 'limit'],
        description: 'Type of sell order',
      },
      {
        id: 'quantity',
        name: 'Quantity',
        type: 'number',
        defaultValue: 100,
        min: 0.01,
        description: 'Order quantity',
      },
    ],
    icon: 'arrow-down-circle',
  },
];
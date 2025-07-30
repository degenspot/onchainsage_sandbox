export class WalletHealthResponseDto {
  id: string;
  address: string;
  ensName?: string;
  overallScore: number;
  exposureScore: number;
  diversificationScore: number;
  liquidityScore: number;
  riskLevel: string;
  totalValue: number;
  tokenBreakdown: {
    symbol: string;
    balance: string;
    value: number;
    percentage: number;
    riskScore: number;
    isSuspicious: boolean;
  }[];
  recommendations: {
    type: string;
    severity: string;
    message: string;
    action: string;
  }[];
  alerts: {
    id: string;
    type: string;
    title: string;
    description: string;
    severity: string;
    isRead: boolean;
    createdAt: Date;
  }[];
}
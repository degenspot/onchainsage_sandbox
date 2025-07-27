import { Injectable } from '@nestjs/common';
import { ApiEndpointDto } from './dto/api-endpoint.dto';

@Injectable()
export class ApiDocsService {
  private readonly endpoints: ApiEndpointDto[] = [
    {
      id: 'blockchain-info',
      path: '/api/v1/blockchain/info',
      method: 'GET',
      title: 'Get Blockchain Information',
      description: 'Retrieve current blockchain network information',
      category: 'blockchain',
      parameters: [],
      responses: {
        200: {
          description: 'Successful response',
          example: {
            network: 'mainnet',
            blockHeight: 12345,
            difficulty: '0x1234abcd'
          }
        }
      },
      authentication: true,
      rateLimit: { requests: 100, window: '1h' }
    },
    {
      id: 'wallet-balance',
      path: '/api/v1/wallet/{address}/balance',
      method: 'GET',
      title: 'Get Wallet Balance',
      description: 'Get balance for a specific wallet address',
      category: 'wallet',
      parameters: [
        {
          name: 'address',
          in: 'path',
          required: true,
          type: 'string',
          description: 'Wallet address'
        }
      ],
      responses: {
        200: {
          description: 'Wallet balance',
          example: {
            address: '0x123...abc',
            balance: '1.5',
            currency: 'ETH'
          }
        }
      },
      authentication: true,
      rateLimit: { requests: 50, window: '1h' }
    },
    {
      id: 'transaction-send',
      path: '/api/v1/transactions/send',
      method: 'POST',
      title: 'Send Transaction',
      description: 'Send a blockchain transaction',
      category: 'transactions',
      parameters: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                from: { type: 'string' },
                to: { type: 'string' },
                amount: { type: 'string' },
                gasPrice: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Transaction sent',
          example: {
            txHash: '0xabc123...',
            status: 'pending'
          }
        }
      },
      authentication: true,
      rateLimit: { requests: 10, window: '1h' }
    }
  ];

  async getAllEndpoints(): Promise<ApiEndpointDto[]> {
    return this.endpoints;
  }

  async searchEndpoints(query: string): Promise<ApiEndpointDto[]> {
    const lowerQuery = query.toLowerCase();
    return this.endpoints.filter(endpoint => 
      endpoint.title.toLowerCase().includes(lowerQuery) ||
      endpoint.description.toLowerCase().includes(lowerQuery) ||
      endpoint.category.toLowerCase().includes(lowerQuery)
    );
  }

  async getEndpoint(id: string): Promise<ApiEndpointDto> {
    const endpoint = this.endpoints.find(e => e.id === id);
    if (!endpoint) {
      throw new Error('Endpoint not found');
    }
    return endpoint;
  }

  async getEndpointsByCategory(category: string): Promise<ApiEndpointDto[]> {
    return this.endpoints.filter(endpoint => endpoint.category === category);
  }

  async getCategories(): Promise<string[]> {
    return [...new Set(this.endpoints.map(e => e.category))];
  }
}
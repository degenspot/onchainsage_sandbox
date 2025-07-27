import { Injectable } from '@nestjs/common';
import { ExecuteRequestDto } from './dto/execute-request.dto';
import axios, { AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface TestResult {
  id: string;
  timestamp: Date;
  request: ExecuteRequestDto;
  response: {
    status: number;
    statusText: string;
    headers: any;
    data: any;
    duration: number;
  };
  success: boolean;
  error?: string;
}

@Injectable()
export class TestingService {
  private testHistory: TestResult[] = [];

  async executeRequest(executeRequestDto: ExecuteRequestDto): Promise<TestResult> {
    const startTime = Date.now();
    const testId = uuidv4();
    
    try {
      const validation = await this.validateRequest(executeRequestDto);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const axiosConfig = {
        method: executeRequestDto.method.toLowerCase() as any,
        url: this.buildUrl(executeRequestDto),
        headers: executeRequestDto.headers || {},
        timeout: 30000,
      };

      if (['post', 'put', 'patch'].includes(executeRequestDto.method.toLowerCase())) {
        axiosConfig['data'] = executeRequestDto.body;
      }

      const response: AxiosResponse = await axios(axiosConfig);
      const duration = Date.now() - startTime;

      const testResult: TestResult = {
        id: testId,
        timestamp: new Date(),
        request: executeRequestDto,
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          duration,
        },
        success: true,
      };

      this.testHistory.unshift(testResult);
      if (this.testHistory.length > 100) {
        this.testHistory = this.testHistory.slice(0, 100);
      }

      return testResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const testResult: TestResult = {
        id: testId,
        timestamp: new Date(),
        request: executeRequestDto,
        response: {
          status: error.response?.status || 0,
          statusText: error.response?.statusText || 'Error',
          headers: error.response?.headers || {},
          data: error.response?.data || null,
          duration,
        },
        success: false,
        error: error.message,
      };

      this.testHistory.unshift(testResult);
      return testResult;
    }
  }
async validateRequest(executeRequestDto: ExecuteRequestDto): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate URL
    try {
      new URL(this.buildUrl(executeRequestDto));
    } catch {
      errors.push('Invalid URL format');
    }

    // Validate method
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    if (!validMethods.includes(executeRequestDto.method.toUpperCase())) {
      errors.push('Invalid HTTP method');
    }

    // Validate headers
    if (executeRequestDto.headers) {
      Object.keys(executeRequestDto.headers).forEach(key => {
        if (typeof key !== 'string' || key.trim() === '') {
          errors.push('Invalid header key format');
        }
      });
    }

    // Validate body for methods that support it
    const methodsWithBody = ['POST', 'PUT', 'PATCH'];
    if (methodsWithBody.includes(executeRequestDto.method.toUpperCase()) && executeRequestDto.body) {
      try {
        if (typeof executeRequestDto.body === 'string') {
          JSON.parse(executeRequestDto.body);
        }
      } catch {
        // If it's not valid JSON, that's okay - it might be form data or other format
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async getTestHistory(): Promise<TestResult[]> {
    return this.testHistory;
  }

  async getTestResult(id: string): Promise<TestResult | null> {
    return this.testHistory.find(result => result.id === id) || null;
  }

  private buildUrl(request: ExecuteRequestDto): string {
    let url = request.url;
    
    if (request.pathParams) {
      Object.entries(request.pathParams).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
      });
    }

    if (request.queryParams && Object.keys(request.queryParams).length > 0) {
      const queryString = new URLSearchParams(
        Object.entries(request.queryParams).map(([key, value]) => [key, String(value)])
      ).toString();
      url += (url.includes('?') ? '&' : '?') + queryString;
    }

    return url;
  }
}
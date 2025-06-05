import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class LabsService {
  constructor(private readonly auditService: AuditService) {}
  
  private readonly availableFeatures = [
    {
      id: 'ai-assistant',
      name: 'AI Assistant',
      description: 'Advanced AI-powered assistance',
      enabled: false,
    },
    {
      id: 'advanced-analytics',
      name: 'Advanced Analytics',
      description: 'Experimental analytics dashboard',
      enabled: false,
    },
    {
      id: 'beta-ui',
      name: 'Beta UI Components',
      description: 'New user interface components',
      enabled: false,
    },
  ];

  async getAvailableFeatures(user: any) {
    await this.auditService.log({
      userId: user.id,
      action: 'LABS_FEATURES_VIEWED',
      details: { timestamp: new Date().toISOString() },
    });

    return {
      features: this.availableFeatures,
      userRole: user.role,
      permissions: user.permissions,
    };
  }

  async enableFeature(featureName: string, user: any) {
    const feature = this.availableFeatures.find(f => f.id === featureName);
    
    if (!feature) {
      throw new Error('Feature not found');
    }

    await this.auditService.log({
      userId: user.id,
      action: 'LABS_FEATURE_ENABLED',
      details: { 
        featureName,
        featureDescription: feature.description,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: `Feature ${feature.name} has been enabled for your account`,
      feature: feature,
    };
  }

  async getUserExperiments(user: any) {
    await this.auditService.log({
      userId: user.id,
      action: 'LABS_EXPERIMENTS_VIEWED',
      details: { timestamp: new Date().toISOString() },
    });

    return {
      experiments: [
        {
          id: 'exp-1',
          name: 'Performance Optimization',
          status: 'active',
          description: 'Testing new performance improvements',
        },
        {
          id: 'exp-2',
          name: 'Enhanced Security',
          status: 'pending',
          description: 'Advanced security features testing',
        },
      ],
      userRole: user.role,
    };
  }
}
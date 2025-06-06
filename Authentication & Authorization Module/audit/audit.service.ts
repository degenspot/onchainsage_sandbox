import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

interface AuditLogData {
  userId: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: AuditLogData): Promise<void> {
    const auditLog = this.auditLogRepository.create(data);
    await this.auditLogRepository.save(auditLog);
  }

  async getUserActions(userId: string, limit = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }
}
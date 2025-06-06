import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateAchievementsTables1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create achievements table
    await queryRunner.createTable(
      new Table({
        name: 'achievements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['prediction_accuracy', 'early_trend', 'engagement', 'streak', 'social', 'milestone'],
          },
          {
            name: 'rarity',
            type: 'enum',
            enum: ['common', 'rare', 'epic', 'legendary'],
          },
          {
            name: 'iconUrl',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'pointsReward',
            type: 'int',
          },
          {
            name: 'criteria',
            type: 'json',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Create user_achievements table
    await queryRunner.createTable(
      new Table({
        name: 'user_achievements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'achievementId',
            type: 'uuid',
          },
          {
            name: 'progress',
            type: 'int',
            default: 0,
          },
          {
            name: 'maxProgress',
            type: 'int',
            default: 1,
          },
          {
            name: 'isCompleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['achievementId'],
            referencedTableName: 'achievements',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    // Create user_points table
    await queryRunner.createTable(
      new Table({
        name: 'user_points',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'totalPoints',
            type: 'int',
            default: 0,
          },
          {
            name: 'currentStreak',
            type: 'int',
            default: 0,
          },
          {
            name: 'longestStreak',
            type: 'int',
            default: 0,
          },
          {
            name: 'lastActivityAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'user_achievements',
      new Index('IDX_user_achievement_unique', ['userId', 'achievementId'], { isUnique: true }),
    );

    await queryRunner.createIndex(
      'user_points',
      new Index('IDX_user_points_user', ['userId']),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_achievements');
    await queryRunner.dropTable('user_points');
    await queryRunner.dropTable('achievements');
  }
}

import type { MigrationInterface, QueryRunner } from "typeorm"

export class CreateInitialSchema1703001000000 implements MigrationInterface {
  name = "CreateInitialSchema1703001000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create blockchains table
    await queryRunner.query(`
      CREATE TABLE "blockchains" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "chainId" character varying NOT NULL,
        "type" character varying NOT NULL,
        "nativeCurrency" character varying NOT NULL,
        "rpcUrl" character varying,
        "explorerUrl" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_blockchain_name" UNIQUE ("name"),
        CONSTRAINT "UQ_blockchain_chainId" UNIQUE ("chainId"),
        CONSTRAINT "PK_blockchains" PRIMARY KEY ("id")
      )
    `)

    // Create tokens table
    await queryRunner.query(`
      CREATE TABLE "tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "symbol" character varying NOT NULL,
        "contractAddress" character varying NOT NULL,
        "decimals" integer NOT NULL DEFAULT 18,
        "description" text,
        "logoUrl" character varying,
        "websiteUrl" character varying,
        "totalSupply" bigint NOT NULL DEFAULT 0,
        "circulatingSupply" bigint NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "blockchainId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tokens_blockchain" FOREIGN KEY ("blockchainId") REFERENCES "blockchains"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `)

    // Create unique index for blockchain + contract address
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_tokens_blockchain_contract" ON "tokens" ("blockchainId", "contractAddress")
    `)

    // Create token_analytics table
    await queryRunner.query(`
      CREATE TABLE "token_analytics" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "price" decimal(20,8) NOT NULL DEFAULT 0,
        "volume24h" decimal(20,8) NOT NULL DEFAULT 0,
        "marketCap" decimal(20,8) NOT NULL DEFAULT 0,
        "liquidity" decimal(20,8) NOT NULL DEFAULT 0,
        "holderCount" integer NOT NULL DEFAULT 0,
        "priceChange24h" decimal(10,4) NOT NULL DEFAULT 0,
        "volumeChange24h" decimal(10,4) NOT NULL DEFAULT 0,
        "timestamp" TIMESTAMP NOT NULL,
        "tokenId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_token_analytics" PRIMARY KEY ("id"),
        CONSTRAINT "FK_token_analytics_token" FOREIGN KEY ("tokenId") REFERENCES "tokens"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `)

    // Create index for analytics queries
    await queryRunner.query(`
      CREATE INDEX "IDX_token_analytics_token_timestamp" ON "token_analytics" ("tokenId", "timestamp")
    `)

    // Create token_transactions table
    await queryRunner.query(`
      CREATE TABLE "token_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "transactionHash" character varying NOT NULL,
        "fromAddress" character varying NOT NULL,
        "toAddress" character varying NOT NULL,
        "amount" decimal(30,18) NOT NULL,
        "valueUsd" decimal(20,8),
        "type" character varying NOT NULL,
        "blockNumber" bigint NOT NULL,
        "timestamp" TIMESTAMP NOT NULL,
        "gasUsed" decimal(20,8) NOT NULL DEFAULT 0,
        "gasPrice" decimal(20,8) NOT NULL DEFAULT 0,
        "tokenId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_transaction_hash" UNIQUE ("transactionHash"),
        CONSTRAINT "PK_token_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_token_transactions_token" FOREIGN KEY ("tokenId") REFERENCES "tokens"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `)

    // Create indexes for transaction queries
    await queryRunner.query(`
      CREATE INDEX "IDX_token_transactions_token_timestamp" ON "token_transactions" ("tokenId", "timestamp")
    `)

    // Create token_holders table
    await queryRunner.query(`
      CREATE TABLE "token_holders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "address" character varying NOT NULL,
        "balance" decimal(30,18) NOT NULL,
        "percentage" decimal(10,6) NOT NULL DEFAULT 0,
        "firstTransactionAt" TIMESTAMP,
        "lastTransactionAt" TIMESTAMP,
        "transactionCount" integer NOT NULL DEFAULT 0,
        "tokenId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_token_holders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_token_holders_token" FOREIGN KEY ("tokenId") REFERENCES "tokens"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `)

    // Create unique index for token + address
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_token_holders_token_address" ON "token_holders" ("tokenId", "address")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "token_holders"`)
    await queryRunner.query(`DROP TABLE "token_transactions"`)
    await queryRunner.query(`DROP TABLE "token_analytics"`)
    await queryRunner.query(`DROP TABLE "tokens"`)
    await queryRunner.query(`DROP TABLE "blockchains"`)
  }
}

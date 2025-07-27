import { Injectable, Logger } from "@nestjs/common";
import { ethers } from "ethers";

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor() {
    // Initialize provider and contract
    this.provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || "https://mainnet.infura.io/v3/your-key"
    );

    // ERC20 token contract ABI (simplified)
    const tokenAbi = [
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
    ];

    this.contract = new ethers.Contract(
      process.env.TOKEN_CONTRACT_ADDRESS || "0x...",
      tokenAbi,
      this.provider
    );
  }

  async getTokenBalance(address: string): Promise<number> {
    try {
      const balance = await this.contract.balanceOf(address);
      const decimals = await this.contract.decimals();
      return parseFloat(ethers.formatUnits(balance, decimals));
    } catch (error) {
      this.logger.error(`Error getting token balance for ${address}:`, error);
      return 0;
    }
  }

  async verifySignature(
    message: string,
    signature: string,
    address: string
  ): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      this.logger.error("Error verifying signature:", error);
      return false;
    }
  }

  async getBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      this.logger.error("Error getting block number:", error);
      return 0;
    }
  }

  async getTransactionReceipt(txHash: string) {
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      this.logger.error(
        `Error getting transaction receipt for ${txHash}:`,
        error
      );
      return null;
    }
  }
}

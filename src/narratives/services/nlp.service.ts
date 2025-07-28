import { Injectable, Logger } from "@nestjs/common"

@Injectable()
export class NLPService {
  private readonly logger = new Logger(NLPService.name)

  // In a real application, this would use an NLP library (e.g., natural, compromise)
  // or an external NLP API (e.g., Google Cloud NLP, AWS Comprehend).

  async analyzeSentiment(text: string): Promise<number> {
    this.logger.debug(`Analyzing sentiment for text: "${text.substring(0, 50)}..."`)
    // Simplified sentiment analysis: count positive/negative keywords
    const positiveKeywords = [
      "good",
      "great",
      "excellent",
      "positive",
      "strong",
      "bullish",
      "support",
      "gain",
      "rise",
      "innovative",
      "future",
    ]
    const negativeKeywords = [
      "bad",
      "terrible",
      "negative",
      "weak",
      "bearish",
      "oppose",
      "loss",
      "fall",
      "scam",
      "rug pull",
      "fud",
    ]

    let score = 0
    const words = text.toLowerCase().split(/\s+/)

    for (const word of words) {
      if (positiveKeywords.includes(word)) {
        score += 1
      } else if (negativeKeywords.includes(word)) {
        score -= 1
      }
    }

    // Normalize score to a range of -1 to 1
    const maxPossibleScore = Math.max(positiveKeywords.length, negativeKeywords.length)
    return maxPossibleScore > 0 ? score / maxPossibleScore : 0
  }

  async extractTopics(text: string): Promise<string[]> {
    this.logger.debug(`Extracting topics from text: "${text.substring(0, 50)}..."`)
    // Simplified topic extraction: look for predefined keywords
    const topics = new Set<string>()
    const lowerText = text.toLowerCase()

    if (lowerText.includes("defi") || lowerText.includes("decentralized finance")) {
      topics.add("DeFi")
    }
    if (lowerText.includes("nft") || lowerText.includes("non-fungible token")) {
      topics.add("NFTs")
    }
    if (
      lowerText.includes("layer 2") ||
      lowerText.includes("l2") ||
      lowerText.includes("arbitrum") ||
      lowerText.includes("optimism") ||
      lowerText.includes("zksync")
    ) {
      topics.add("Layer 2")
    }
    if (lowerText.includes("ai") || lowerText.includes("artificial intelligence") || lowerText.includes("ai token")) {
      topics.add("AI Crypto")
    }
    if (lowerText.includes("privacy coin") || lowerText.includes("monero") || lowerText.includes("zcash")) {
      topics.add("Privacy Coins")
    }
    if (lowerText.includes("gamefi") || lowerText.includes("web3 gaming")) {
      topics.add("Web3 Gaming")
    }
    if (lowerText.includes("bitcoin") || lowerText.includes("btc") || lowerText.includes("halving")) {
      topics.add("Bitcoin")
    }
    if (lowerText.includes("ethereum") || lowerText.includes("eth") || lowerText.includes("eip-")) {
      topics.add("Ethereum Ecosystem")
    }
    if (lowerText.includes("decentralized social") || lowerText.includes("deso") || lowerText.includes("web3 social")) {
      topics.add("Decentralized Social")
    }
    if (lowerText.includes("rwa") || lowerText.includes("real world asset")) {
      topics.add("Real World Assets")
    }
    if (lowerText.includes("solana") || lowerText.includes("sol")) {
      topics.add("Solana Ecosystem")
    }
    if (lowerText.includes("institutional adoption")) {
      topics.add("Institutional Adoption")
    }

    return Array.from(topics)
  }

  async extractKeywords(text: string): Promise<string[]> {
    this.logger.debug(`Extracting keywords from text: "${text.substring(0, 50)}..."`)
    // Simplified keyword extraction: split by space and filter common words
    const commonWords = new Set([
      "a",
      "an",
      "the",
      "is",
      "are",
      "and",
      "or",
      "of",
      "in",
      "on",
      "for",
      "with",
      "to",
      "from",
      "by",
      "it",
      "its",
      "that",
      "this",
      "what",
      "who",
      "where",
      "when",
      "why",
      "how",
    ])
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2 && !commonWords.has(word))
    // Return unique words
    return Array.from(new Set(words)).slice(0, 10) // Limit to top 10 for brevity
  }
}

import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { AlertService } from "../services/alert.service"
import { GovernanceAlert, AlertType, AlertSeverity } from "../entities/governance-alert.entity"
import type { Proposal } from "../entities/proposal.entity"
import { type Vote, VoteChoice } from "../entities/vote.entity"
import { jest } from "@jest/globals" // Import jest to declare it

describe("AlertService", () => {
  let service: AlertService
  let repository: Repository<GovernanceAlert>

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertService,
        {
          provide: getRepositoryToken(GovernanceAlert),
          useValue: mockRepository,
        },
      ],
    }).compile()

    service = module.get<AlertService>(AlertService)
    repository = module.get<Repository<GovernanceAlert>>(getRepositoryToken(GovernanceAlert))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("createHighImpactProposalAlert", () => {
    it("should create a high impact proposal alert", async () => {
      const proposal = {
        id: "prop-1",
        protocol: "compound",
        title: "Important Governance Change",
        proposer: "0x123",
        endTime: new Date("2024-01-07"),
      } as Proposal

      const expectedAlert = {
        id: "alert-1",
        type: AlertType.HIGH_IMPACT_PROPOSAL,
        severity: AlertSeverity.HIGH,
        protocol: "compound",
        title: "High Impact Proposal: Important Governance Change",
        description: "A high-impact governance proposal has been created in compound",
        data: {
          proposalId: "prop-1",
          proposer: "0x123",
          endTime: proposal.endTime,
        },
      }

      mockRepository.create.mockReturnValue(expectedAlert)
      mockRepository.save.mockResolvedValue(expectedAlert)

      const result = await service.createHighImpactProposalAlert(proposal)

      expect(mockRepository.create).toHaveBeenCalledWith({
        type: AlertType.HIGH_IMPACT_PROPOSAL,
        severity: AlertSeverity.HIGH,
        protocol: "compound",
        title: "High Impact Proposal: Important Governance Change",
        description: "A high-impact governance proposal has been created in compound",
        data: {
          proposalId: "prop-1",
          proposer: "0x123",
          endTime: proposal.endTime,
        },
      })
      expect(result).toEqual(expectedAlert)
    })
  })

  describe("createLargeVoteAlert", () => {
    it("should create a large vote alert", async () => {
      const vote = {
        id: "vote-1",
        voter: "0x123",
        votingPower: 5000000,
        choice: VoteChoice.FOR,
      } as Vote

      const proposal = {
        id: "prop-1",
        protocol: "aave",
        title: "Protocol Upgrade",
      } as Proposal

      const expectedAlert = {
        id: "alert-1",
        type: AlertType.LARGE_VOTE,
        severity: AlertSeverity.MEDIUM,
        protocol: "aave",
        title: "Large Vote Cast: 5,000,000 tokens",
        description: 'A large vote has been cast on proposal "Protocol Upgrade"',
        data: {
          proposalId: "prop-1",
          voter: "0x123",
          votingPower: 5000000,
          choice: VoteChoice.FOR,
        },
      }

      mockRepository.create.mockReturnValue(expectedAlert)
      mockRepository.save.mockResolvedValue(expectedAlert)

      const result = await service.createLargeVoteAlert(vote, proposal)

      expect(result).toEqual(expectedAlert)
    })
  })

  describe("createCloseVoteAlert", () => {
    it("should create alert for close vote", async () => {
      const proposal = {
        id: "prop-1",
        protocol: "compound",
        title: "Close Vote Proposal",
        forVotes: 1000000,
        againstVotes: 980000,
      } as Proposal

      const expectedAlert = {
        id: "alert-1",
        type: AlertType.CLOSE_VOTE,
        severity: AlertSeverity.HIGH,
        protocol: "compound",
        title: "Close Vote: Close Vote Proposal",
        description: "Proposal has a very close vote margin (1.0%)",
        data: {
          proposalId: "prop-1",
          forVotes: 1000000,
          againstVotes: 980000,
          margin: expect.any(Number),
        },
      }

      mockRepository.create.mockReturnValue(expectedAlert)
      mockRepository.save.mockResolvedValue(expectedAlert)

      const result = await service.createCloseVoteAlert(proposal)

      expect(result).toEqual(expectedAlert)
    })

    it("should return null for non-close votes", async () => {
      const proposal = {
        id: "prop-1",
        protocol: "compound",
        title: "Decisive Vote Proposal",
        forVotes: 1000000,
        againstVotes: 200000,
      } as Proposal

      const result = await service.createCloseVoteAlert(proposal)

      expect(result).toBeNull()
      expect(mockRepository.create).not.toHaveBeenCalled()
    })
  })

  describe("createSentimentShiftAlert", () => {
    it("should create alert for significant sentiment shift", async () => {
      const proposalId = "prop-1"
      const protocol = "compound"
      const oldSentiment = 0.2
      const newSentiment = -0.4

      const expectedAlert = {
        id: "alert-1",
        type: AlertType.SENTIMENT_SHIFT,
        severity: AlertSeverity.HIGH,
        protocol,
        title: "Sentiment Shift Detected",
        description: "Significant sentiment change detected in proposal discussions",
        data: {
          proposalId,
          oldSentiment,
          newSentiment,
          shift: 0.6,
        },
      }

      mockRepository.create.mockReturnValue(expectedAlert)
      mockRepository.save.mockResolvedValue(expectedAlert)

      const result = await service.createSentimentShiftAlert(proposalId, protocol, oldSentiment, newSentiment)

      expect(result).toEqual(expectedAlert)
    })

    it("should return null for minor sentiment changes", async () => {
      const result = await service.createSentimentShiftAlert("prop-1", "compound", 0.2, 0.3)

      expect(result).toBeNull()
      expect(mockRepository.create).not.toHaveBeenCalled()
    })
  })

  describe("getAlerts", () => {
    it("should return all alerts when no filters provided", async () => {
      const expectedAlerts = [
        { id: "1", type: AlertType.HIGH_IMPACT_PROPOSAL },
        { id: "2", type: AlertType.LARGE_VOTE },
      ]

      mockRepository.find.mockResolvedValue(expectedAlerts)

      const result = await service.getAlerts()

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: "DESC" },
      })
      expect(result).toEqual(expectedAlerts)
    })

    it("should filter alerts by protocol and read status", async () => {
      const protocol = "compound"
      const isRead = false
      const expectedAlerts = [{ id: "1", protocol: "compound", isRead: false }]

      mockRepository.find.mockResolvedValue(expectedAlerts)

      const result = await service.getAlerts(protocol, isRead)

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { protocol: "compound", isRead: false },
        order: { createdAt: "DESC" },
      })
      expect(result).toEqual(expectedAlerts)
    })
  })

  describe("markAsRead", () => {
    it("should mark alert as read", async () => {
      const alertId = "alert-1"
      const updatedAlert = { id: alertId, isRead: true }

      mockRepository.update.mockResolvedValue({ affected: 1 })
      mockRepository.findOne.mockResolvedValue(updatedAlert)

      const result = await service.markAsRead(alertId)

      expect(mockRepository.update).toHaveBeenCalledWith(alertId, { isRead: true })
      expect(result).toEqual(updatedAlert)
    })
  })

  describe("getUnreadCount", () => {
    it("should return unread count for all protocols", async () => {
      mockRepository.count.mockResolvedValue(5)

      const result = await service.getUnreadCount()

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { isRead: false },
      })
      expect(result).toBe(5)
    })

    it("should return unread count for specific protocol", async () => {
      const protocol = "compound"
      mockRepository.count.mockResolvedValue(3)

      const result = await service.getUnreadCount(protocol)

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { isRead: false, protocol: "compound" },
      })
      expect(result).toBe(3)
    })
  })
})

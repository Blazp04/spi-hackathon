// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IProjectLifecycle
 * @notice Interface for the Project Lifecycle management contract
 */
interface IProjectLifecycle {
    // Enums
    enum ProjectStatus {
        MINTING, // Active fundraising
        BUILDING, // Construction in progress
        TRADING, // Post-construction pre-sale
        FINAL_SALE, // Property selling phase
        COMPLETED, // Project closed and archived
        CANCELLED // Project terminated with refunds
    }

    enum MilestoneStatus {
        PENDING, // Not yet started
        SUBMITTED, // Contractor submitted for verification
        DISPUTED, // Under dispute
        VERIFIED, // Verified by threshold verifiers
        PAID // Payment released
    }

    // Structs
    struct Project {
        uint256 projectId;
        uint256 tokenId;
        string metadataUri;
        uint256 hardCap;
        uint256 softCap;
        uint256 totalRaised;
        uint256 tokenPrice;
        address contractor;
        uint256 mintingDeadline;
        uint256 projectDeadline;
        ProjectStatus status;
        uint256 milestoneCount;
        uint256 completedMilestones;
        uint256 contingencyPercent;
        uint256 platformFeePercent;
    }

    struct Milestone {
        string description;
        uint256 budgetPercent; // Percentage of total budget (basis points, 10000 = 100%)
        uint256 verificationThreshold; // Number of verifiers needed
        MilestoneStatus status;
        uint256 submissionTimestamp;
        uint256 completionTimestamp;
        string documentationUri;
        uint256 verifierApprovals;
    }

    // Events
    event ProjectCreated(
        uint256 indexed projectId,
        uint256 indexed tokenId,
        address contractor,
        uint256 hardCap,
        uint256 softCap
    );
    event ProjectStatusChanged(
        uint256 indexed projectId,
        ProjectStatus oldStatus,
        ProjectStatus newStatus
    );
    event MilestoneAdded(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        string description,
        uint256 budgetPercent
    );
    event MilestoneSubmitted(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        string documentationUri
    );
    event MilestoneVerified(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        address indexed verifier
    );
    event MilestoneDisputed(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        address indexed disputer,
        string reason
    );
    event MilestonePaid(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        uint256 amount
    );
    event DisputeResolved(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        bool approved
    );
    event InvestmentMade(
        uint256 indexed projectId,
        address indexed investor,
        uint256 amount,
        uint256 tokens
    );
    event RefundClaimed(
        uint256 indexed projectId,
        address indexed investor,
        uint256 amount
    );

    // View functions
    function getProject(
        uint256 projectId
    ) external view returns (Project memory);
    function getMilestone(
        uint256 projectId,
        uint256 milestoneIndex
    ) external view returns (Milestone memory);
    function getInvestorBalance(
        uint256 projectId,
        address investor
    ) external view returns (uint256);
    function canClaimRefund(
        uint256 projectId,
        address investor
    ) external view returns (bool);

    // Project management
    function createProject(
        uint256 hardCap,
        uint256 softCap,
        uint256 tokenPrice,
        address contractor,
        uint256 mintingDeadline,
        uint256 projectDeadline,
        uint256 contingencyPercent,
        uint256 platformFeePercent,
        string calldata metadataUri
    ) external returns (uint256 projectId);

    function addMilestone(
        uint256 projectId,
        string calldata description,
        uint256 budgetPercent,
        uint256 verificationThreshold
    ) external;

    function startBuilding(uint256 projectId) external;
    function startTrading(uint256 projectId) external;
    function startFinalSale(uint256 projectId) external;
    function completeProject(uint256 projectId, uint256 salePrice) external;
    function cancelProject(uint256 projectId) external;

    // Milestone management
    function submitMilestone(
        uint256 projectId,
        uint256 milestoneIndex,
        string calldata documentationUri
    ) external;
    function verifyMilestone(
        uint256 projectId,
        uint256 milestoneIndex
    ) external;
    function disputeMilestone(
        uint256 projectId,
        uint256 milestoneIndex,
        string calldata reason
    ) external;
    function resolveDispute(
        uint256 projectId,
        uint256 milestoneIndex,
        bool approved
    ) external;

    // Investment
    function invest(uint256 projectId, uint256 amount) external;
    function claimRefund(uint256 projectId) external;
}

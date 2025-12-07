// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IProjectLifecycle} from "./interfaces/IProjectLifecycle.sol";
import {IEscrow} from "./interfaces/IEscrow.sol";
import {PropertyBuildToken} from "./PropertyBuildToken.sol";

/**
 * @title ProjectLifecycle
 * @author PropertyBuild Platform
 * @notice Manages complete project workflow from initialization through closure
 * @dev Handles project creation, milestone management, status transitions, and investor interactions
 */
contract ProjectLifecycle is
    AccessControl,
    ReentrancyGuard,
    Pausable,
    IProjectLifecycle
{
    using SafeERC20 for IERC20;

    // ============ Role Definitions ============

    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant CONTRACTOR_ROLE = keccak256("CONTRACTOR_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant PROJECT_ADMIN_ROLE =
        keccak256("PROJECT_ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ============ State Variables ============

    /// @notice PropertyBuild token contract
    PropertyBuildToken public immutable TOKEN;

    /// @notice Escrow contract for fund management
    IEscrow public escrow;

    /// @notice Payment token (stablecoin)
    IERC20 public immutable PAYMENT_TOKEN;

    /// @notice Project counter for unique IDs
    uint256 private _projectIdCounter;

    /// @notice Mapping from project ID to Project struct
    mapping(uint256 => Project) private _projects;

    /// @notice Mapping from project ID to milestone index to Milestone struct
    mapping(uint256 => mapping(uint256 => Milestone)) private _milestones;

    /// @notice Mapping from project ID to milestone index to verifier to approved status
    mapping(uint256 => mapping(uint256 => mapping(address => bool)))
        private _verifierApprovals;

    /// @notice Mapping from project ID to investor to token balance
    mapping(uint256 => mapping(address => uint256)) private _investorBalances;

    /// @notice Mapping from project ID to investor to amount invested (in payment token)
    mapping(uint256 => mapping(address => uint256)) private _investorDeposits;

    /// @notice Mapping from project ID to assigned verifiers
    mapping(uint256 => address[]) private _projectVerifiers;

    /// @notice Final sale price per project
    mapping(uint256 => uint256) private _salePrices;

    // ============ Constants ============

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_MILESTONES = 20;
    uint256 public constant MIN_SOFT_CAP_PERCENT = 5000; // 50% minimum

    // ============ Errors ============

    error InvalidProject();
    error InvalidStatus(ProjectStatus current, ProjectStatus required);
    error InvalidMilestone();
    error HardCapExceeded();
    error SoftCapNotMet();
    error MintingDeadlinePassed();
    error MintingDeadlineNotPassed();
    error InvalidAmount();
    error InvalidAddress();
    error MilestoneNotPreviouslyVerified();
    error AlreadyVerified();
    error VerificationThresholdNotMet();
    error NotContractor();
    error TotalBudgetExceeds100Percent();
    error MaxMilestonesReached();
    error UnauthorizedVerifier();
    error NoRefundAvailable();
    error MilestoneNotDisputed();
    error InvalidPercentage();

    // ============ Constructor ============

    /**
     * @notice Initializes the ProjectLifecycle contract
     * @param _token PropertyBuildToken contract address
     * @param _paymentToken Payment token (stablecoin) address
     * @param admin Admin address
     */
    constructor(address _token, address _paymentToken, address admin) {
        if (
            _token == address(0) ||
            _paymentToken == address(0) ||
            admin == address(0)
        ) {
            revert InvalidAddress();
        }

        TOKEN = PropertyBuildToken(_token);
        PAYMENT_TOKEN = IERC20(_paymentToken);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PROJECT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(TREASURY_ROLE, admin);

        _projectIdCounter = 1;
    }

    // ============ Configuration ============

    /**
     * @notice Sets the escrow contract address
     * @param _escrow Escrow contract address
     */
    function setEscrow(address _escrow) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_escrow == address(0)) revert InvalidAddress();
        escrow = IEscrow(_escrow);
    }

    // ============ Project Creation ============

    /**
     * @notice Creates a new construction project
     * @param hardCap Maximum funding amount
     * @param softCap Minimum funding threshold
     * @param tokenPrice Price per token in payment token units
     * @param contractor Contractor wallet address
     * @param mintingDeadline Timestamp for minting deadline
     * @param projectDeadline Timestamp for project completion deadline
     * @param contingencyPercent Percentage reserved for contingencies (basis points)
     * @param platformFeePercent Platform fee percentage (basis points)
     * @param metadataUri IPFS URI for project metadata
     * @return projectId The newly created project ID
     */
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
    )
        external
        override
        onlyRole(PROJECT_ADMIN_ROLE)
        returns (uint256 projectId)
    {
        if (hardCap == 0 || tokenPrice == 0) revert InvalidAmount();
        if (contractor == address(0)) revert InvalidAddress();
        if (softCap > hardCap) revert InvalidAmount();
        if (softCap < (hardCap * MIN_SOFT_CAP_PERCENT) / BASIS_POINTS)
            revert InvalidAmount();
        if (mintingDeadline <= block.timestamp) revert InvalidAmount();
        if (projectDeadline <= mintingDeadline) revert InvalidAmount();
        if (contingencyPercent > 2000) revert InvalidPercentage(); // Max 20%
        if (platformFeePercent > 1000) revert InvalidPercentage(); // Max 10%

        projectId = _projectIdCounter++;

        // Create token for this project
        uint256 tokenId = TOKEN.createProjectToken(projectId, metadataUri);

        _projects[projectId] = Project({
            projectId: projectId,
            tokenId: tokenId,
            metadataUri: metadataUri,
            hardCap: hardCap,
            softCap: softCap,
            totalRaised: 0,
            tokenPrice: tokenPrice,
            contractor: contractor,
            mintingDeadline: mintingDeadline,
            projectDeadline: projectDeadline,
            status: ProjectStatus.MINTING,
            milestoneCount: 0,
            completedMilestones: 0,
            contingencyPercent: contingencyPercent,
            platformFeePercent: platformFeePercent
        });

        // Grant contractor role
        _grantRole(CONTRACTOR_ROLE, contractor);

        emit ProjectCreated(projectId, tokenId, contractor, hardCap, softCap);
    }

    /**
     * @notice Adds a milestone to a project
     * @param projectId Project ID
     * @param description Milestone description
     * @param budgetPercent Percentage of budget for this milestone (basis points)
     * @param verificationThreshold Number of verifiers needed
     */
    function addMilestone(
        uint256 projectId,
        string calldata description,
        uint256 budgetPercent,
        uint256 verificationThreshold
    ) external override onlyRole(PROJECT_ADMIN_ROLE) {
        Project storage project = _projects[projectId];
        if (project.projectId == 0) revert InvalidProject();
        if (project.status != ProjectStatus.MINTING) {
            revert InvalidStatus(project.status, ProjectStatus.MINTING);
        }
        if (project.milestoneCount >= MAX_MILESTONES)
            revert MaxMilestonesReached();
        if (verificationThreshold == 0) revert InvalidAmount();

        // Calculate total budget allocation
        uint256 totalBudget = budgetPercent;
        for (uint256 i = 0; i < project.milestoneCount; i++) {
            totalBudget += _milestones[projectId][i].budgetPercent;
        }

        // Account for contingency
        uint256 maxAllowable = BASIS_POINTS -
            project.contingencyPercent -
            project.platformFeePercent;
        if (totalBudget > maxAllowable) revert TotalBudgetExceeds100Percent();

        uint256 milestoneIndex = project.milestoneCount;

        _milestones[projectId][milestoneIndex] = Milestone({
            description: description,
            budgetPercent: budgetPercent,
            verificationThreshold: verificationThreshold,
            status: MilestoneStatus.PENDING,
            submissionTimestamp: 0,
            completionTimestamp: 0,
            documentationUri: "",
            verifierApprovals: 0
        });

        project.milestoneCount++;

        emit MilestoneAdded(
            projectId,
            milestoneIndex,
            description,
            budgetPercent
        );
    }

    /**
     * @notice Adds a verifier to a project
     * @param projectId Project ID
     * @param verifier Verifier address
     */
    function addProjectVerifier(
        uint256 projectId,
        address verifier
    ) external onlyRole(PROJECT_ADMIN_ROLE) {
        if (_projects[projectId].projectId == 0) revert InvalidProject();
        if (verifier == address(0)) revert InvalidAddress();

        _projectVerifiers[projectId].push(verifier);
        _grantRole(VERIFIER_ROLE, verifier);
    }

    // ============ Investment ============

    /**
     * @notice Allows investors to purchase tokens
     * @param projectId Project ID to invest in
     * @param amount Amount of payment token to invest
     */
    function invest(
        uint256 projectId,
        uint256 amount
    ) external override nonReentrant whenNotPaused {
        Project storage project = _projects[projectId];
        if (project.projectId == 0) revert InvalidProject();
        if (project.status != ProjectStatus.MINTING) {
            revert InvalidStatus(project.status, ProjectStatus.MINTING);
        }
        if (block.timestamp > project.mintingDeadline)
            revert MintingDeadlinePassed();
        if (amount == 0) revert InvalidAmount();

        // Check hard cap
        if (project.totalRaised + amount > project.hardCap) {
            revert HardCapExceeded();
        }

        // Calculate tokens to mint
        uint256 tokensToMint = (amount * 1e18) / project.tokenPrice;

        // Transfer payment token from investor to escrow
        PAYMENT_TOKEN.safeTransferFrom(msg.sender, address(escrow), amount);

        // Record deposit in escrow
        escrow.deposit(projectId, msg.sender, amount);

        // Mint tokens to investor
        TOKEN.mint(msg.sender, project.tokenId, tokensToMint, "");

        // Update project state
        project.totalRaised += amount;
        _investorBalances[projectId][msg.sender] += tokensToMint;
        _investorDeposits[projectId][msg.sender] += amount;

        emit InvestmentMade(projectId, msg.sender, amount, tokensToMint);
    }

    // ============ Status Transitions ============

    /**
     * @notice Transitions project to BUILDING status
     * @param projectId Project ID
     */
    function startBuilding(
        uint256 projectId
    ) external override onlyRole(PROJECT_ADMIN_ROLE) {
        Project storage project = _projects[projectId];
        if (project.projectId == 0) revert InvalidProject();
        if (project.status != ProjectStatus.MINTING) {
            revert InvalidStatus(project.status, ProjectStatus.MINTING);
        }
        if (project.totalRaised < project.softCap) revert SoftCapNotMet();
        if (project.milestoneCount == 0) revert InvalidMilestone();

        ProjectStatus oldStatus = project.status;
        project.status = ProjectStatus.BUILDING;

        emit ProjectStatusChanged(projectId, oldStatus, ProjectStatus.BUILDING);
    }

    /**
     * @notice Transitions project to TRADING status
     * @param projectId Project ID
     */
    function startTrading(
        uint256 projectId
    ) external override onlyRole(PROJECT_ADMIN_ROLE) {
        Project storage project = _projects[projectId];
        if (project.projectId == 0) revert InvalidProject();
        if (project.status != ProjectStatus.BUILDING) {
            revert InvalidStatus(project.status, ProjectStatus.BUILDING);
        }
        // All milestones must be completed
        if (project.completedMilestones != project.milestoneCount) {
            revert InvalidMilestone();
        }

        ProjectStatus oldStatus = project.status;
        project.status = ProjectStatus.TRADING;

        emit ProjectStatusChanged(projectId, oldStatus, ProjectStatus.TRADING);
    }

    /**
     * @notice Transitions project to FINAL_SALE status
     * @param projectId Project ID
     */
    function startFinalSale(
        uint256 projectId
    ) external override onlyRole(PROJECT_ADMIN_ROLE) {
        Project storage project = _projects[projectId];
        if (project.projectId == 0) revert InvalidProject();
        if (project.status != ProjectStatus.TRADING) {
            revert InvalidStatus(project.status, ProjectStatus.TRADING);
        }

        ProjectStatus oldStatus = project.status;
        project.status = ProjectStatus.FINAL_SALE;

        emit ProjectStatusChanged(
            projectId,
            oldStatus,
            ProjectStatus.FINAL_SALE
        );
    }

    /**
     * @notice Completes project with sale price
     * @param projectId Project ID
     * @param salePrice Final property sale price
     */
    function completeProject(
        uint256 projectId,
        uint256 salePrice
    ) external override onlyRole(PROJECT_ADMIN_ROLE) {
        Project storage project = _projects[projectId];
        if (project.projectId == 0) revert InvalidProject();
        if (project.status != ProjectStatus.FINAL_SALE) {
            revert InvalidStatus(project.status, ProjectStatus.FINAL_SALE);
        }
        if (salePrice == 0) revert InvalidAmount();

        ProjectStatus oldStatus = project.status;
        project.status = ProjectStatus.COMPLETED;
        _salePrices[projectId] = salePrice;

        emit ProjectStatusChanged(
            projectId,
            oldStatus,
            ProjectStatus.COMPLETED
        );
    }

    /**
     * @notice Cancels a project
     * @param projectId Project ID
     */
    function cancelProject(
        uint256 projectId
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        Project storage project = _projects[projectId];
        if (project.projectId == 0) revert InvalidProject();
        if (
            project.status == ProjectStatus.COMPLETED ||
            project.status == ProjectStatus.CANCELLED
        ) {
            revert InvalidStatus(project.status, ProjectStatus.MINTING);
        }

        ProjectStatus oldStatus = project.status;
        project.status = ProjectStatus.CANCELLED;

        emit ProjectStatusChanged(
            projectId,
            oldStatus,
            ProjectStatus.CANCELLED
        );
    }

    // ============ Milestone Management ============

    /**
     * @notice Contractor submits milestone for verification
     * @param projectId Project ID
     * @param milestoneIndex Index of milestone
     * @param documentationUri IPFS URI for documentation
     */
    function submitMilestone(
        uint256 projectId,
        uint256 milestoneIndex,
        string calldata documentationUri
    ) external override {
        Project storage project = _projects[projectId];
        if (project.projectId == 0) revert InvalidProject();
        if (msg.sender != project.contractor) revert NotContractor();
        if (project.status != ProjectStatus.BUILDING) {
            revert InvalidStatus(project.status, ProjectStatus.BUILDING);
        }
        if (milestoneIndex >= project.milestoneCount) revert InvalidMilestone();

        // Check previous milestone is completed (sequential enforcement)
        if (milestoneIndex > 0) {
            Milestone storage prevMilestone = _milestones[projectId][
                milestoneIndex - 1
            ];
            if (prevMilestone.status != MilestoneStatus.PAID) {
                revert MilestoneNotPreviouslyVerified();
            }
        }

        Milestone storage milestone = _milestones[projectId][milestoneIndex];
        if (milestone.status != MilestoneStatus.PENDING) {
            revert InvalidMilestone();
        }

        milestone.status = MilestoneStatus.SUBMITTED;
        milestone.submissionTimestamp = block.timestamp;
        milestone.documentationUri = documentationUri;

        emit MilestoneSubmitted(projectId, milestoneIndex, documentationUri);
    }

    /**
     * @notice Verifier approves a milestone
     * @param projectId Project ID
     * @param milestoneIndex Index of milestone
     */
    function verifyMilestone(
        uint256 projectId,
        uint256 milestoneIndex
    ) external override onlyRole(VERIFIER_ROLE) {
        Project storage project = _projects[projectId];
        if (project.projectId == 0) revert InvalidProject();
        if (milestoneIndex >= project.milestoneCount) revert InvalidMilestone();

        // Check if verifier is assigned to this project
        bool isAssigned = false;
        for (uint256 i = 0; i < _projectVerifiers[projectId].length; i++) {
            if (_projectVerifiers[projectId][i] == msg.sender) {
                isAssigned = true;
                break;
            }
        }
        if (!isAssigned) revert UnauthorizedVerifier();

        Milestone storage milestone = _milestones[projectId][milestoneIndex];
        if (milestone.status != MilestoneStatus.SUBMITTED) {
            revert InvalidMilestone();
        }

        // Check if verifier already approved
        if (_verifierApprovals[projectId][milestoneIndex][msg.sender]) {
            revert AlreadyVerified();
        }

        _verifierApprovals[projectId][milestoneIndex][msg.sender] = true;
        milestone.verifierApprovals++;

        emit MilestoneVerified(projectId, milestoneIndex, msg.sender);

        // Check if threshold is met
        if (milestone.verifierApprovals >= milestone.verificationThreshold) {
            milestone.status = MilestoneStatus.VERIFIED;
            milestone.completionTimestamp = block.timestamp;

            // Release payment
            _releaseMilestonePayment(projectId, milestoneIndex);
        }
    }

    /**
     * @notice Disputes a milestone
     * @param projectId Project ID
     * @param milestoneIndex Index of milestone
     * @param reason Dispute reason
     */
    function disputeMilestone(
        uint256 projectId,
        uint256 milestoneIndex,
        string calldata reason
    ) external override {
        Project storage project = _projects[projectId];
        if (project.projectId == 0) revert InvalidProject();
        if (milestoneIndex >= project.milestoneCount) revert InvalidMilestone();

        // Only contractor or verifiers can dispute
        bool canDispute = (msg.sender == project.contractor) ||
            hasRole(VERIFIER_ROLE, msg.sender);
        if (!canDispute) revert Unauthorized();

        Milestone storage milestone = _milestones[projectId][milestoneIndex];
        if (milestone.status != MilestoneStatus.SUBMITTED) {
            revert InvalidMilestone();
        }

        milestone.status = MilestoneStatus.DISPUTED;

        emit MilestoneDisputed(projectId, milestoneIndex, msg.sender, reason);
    }

    /**
     * @notice Admin resolves a disputed milestone
     * @param projectId Project ID
     * @param milestoneIndex Index of milestone
     * @param approved Whether to approve the milestone
     */
    function resolveDispute(
        uint256 projectId,
        uint256 milestoneIndex,
        bool approved
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        Project storage project = _projects[projectId];
        if (project.projectId == 0) revert InvalidProject();
        if (milestoneIndex >= project.milestoneCount) revert InvalidMilestone();

        Milestone storage milestone = _milestones[projectId][milestoneIndex];
        if (milestone.status != MilestoneStatus.DISPUTED) {
            revert MilestoneNotDisputed();
        }

        if (approved) {
            milestone.status = MilestoneStatus.VERIFIED;
            milestone.completionTimestamp = block.timestamp;
            _releaseMilestonePayment(projectId, milestoneIndex);
        } else {
            milestone.status = MilestoneStatus.PENDING;
            milestone.verifierApprovals = 0;
            // Reset verifier approvals
            for (uint256 i = 0; i < _projectVerifiers[projectId].length; i++) {
                _verifierApprovals[projectId][milestoneIndex][
                    _projectVerifiers[projectId][i]
                ] = false;
            }
        }

        emit DisputeResolved(projectId, milestoneIndex, approved);
    }

    /**
     * @dev Releases payment for a verified milestone
     * @param projectId Project ID
     * @param milestoneIndex Index of milestone
     */
    function _releaseMilestonePayment(
        uint256 projectId,
        uint256 milestoneIndex
    ) internal {
        Project storage project = _projects[projectId];
        Milestone storage milestone = _milestones[projectId][milestoneIndex];

        uint256 paymentAmount = (project.totalRaised *
            milestone.budgetPercent) / BASIS_POINTS;

        milestone.status = MilestoneStatus.PAID;
        project.completedMilestones++;

        escrow.releaseMilestonePayment(
            projectId,
            milestoneIndex,
            project.contractor,
            paymentAmount
        );

        emit MilestonePaid(projectId, milestoneIndex, paymentAmount);
    }

    // ============ Refunds ============

    /**
     * @notice Allows investors to claim refund for cancelled/failed projects
     * @param projectId Project ID
     */
    function claimRefund(uint256 projectId) external override nonReentrant {
        Project storage project = _projects[projectId];
        if (project.projectId == 0) revert InvalidProject();

        bool canRefund = false;

        // Refund if cancelled
        if (project.status == ProjectStatus.CANCELLED) {
            canRefund = true;
        }
        // Refund if minting deadline passed and soft cap not met
        else if (
            project.status == ProjectStatus.MINTING &&
            block.timestamp > project.mintingDeadline &&
            project.totalRaised < project.softCap
        ) {
            canRefund = true;
        }

        if (!canRefund) revert NoRefundAvailable();

        uint256 investorDeposit = _investorDeposits[projectId][msg.sender];
        if (investorDeposit == 0) revert NoRefundAvailable();

        // Calculate refund amount based on project status
        uint256 refundAmount;
        if (
            project.status == ProjectStatus.MINTING ||
            project.completedMilestones == 0
        ) {
            // Full refund minus platform fee
            refundAmount =
                investorDeposit -
                ((investorDeposit * project.platformFeePercent) / BASIS_POINTS);
        } else {
            // Proportional refund based on remaining funds
            uint256 remainingFunds = escrow.getRemainingFunds(projectId);
            uint256 totalDeposits = project.totalRaised;
            refundAmount = (investorDeposit * remainingFunds) / totalDeposits;
        }

        // Clear investor records
        uint256 tokenBalance = _investorBalances[projectId][msg.sender];
        _investorBalances[projectId][msg.sender] = 0;
        _investorDeposits[projectId][msg.sender] = 0;

        // Burn investor's tokens
        if (tokenBalance > 0) {
            TOKEN.burn(msg.sender, project.tokenId, tokenBalance);
        }

        // Process refund through escrow
        escrow.processRefund(projectId, msg.sender, refundAmount);

        emit RefundClaimed(projectId, msg.sender, refundAmount);
    }

    // ============ View Functions ============

    /**
     * @notice Gets project details
     * @param projectId Project ID
     * @return Project struct
     */
    function getProject(
        uint256 projectId
    ) external view override returns (Project memory) {
        return _projects[projectId];
    }

    /**
     * @notice Gets milestone details
     * @param projectId Project ID
     * @param milestoneIndex Milestone index
     * @return Milestone struct
     */
    function getMilestone(
        uint256 projectId,
        uint256 milestoneIndex
    ) external view override returns (Milestone memory) {
        return _milestones[projectId][milestoneIndex];
    }

    /**
     * @notice Gets investor token balance for a project
     * @param projectId Project ID
     * @param investor Investor address
     * @return Token balance
     */
    function getInvestorBalance(
        uint256 projectId,
        address investor
    ) external view override returns (uint256) {
        return _investorBalances[projectId][investor];
    }

    /**
     * @notice Gets investor deposit amount for a project
     * @param projectId Project ID
     * @param investor Investor address
     * @return Deposit amount
     */
    function getInvestorDeposit(
        uint256 projectId,
        address investor
    ) external view returns (uint256) {
        return _investorDeposits[projectId][investor];
    }

    /**
     * @notice Checks if investor can claim refund
     * @param projectId Project ID
     * @param investor Investor address
     * @return True if refund is available
     */
    function canClaimRefund(
        uint256 projectId,
        address investor
    ) external view override returns (bool) {
        Project storage project = _projects[projectId];
        if (project.projectId == 0) return false;
        if (_investorDeposits[projectId][investor] == 0) return false;

        if (project.status == ProjectStatus.CANCELLED) return true;
        if (
            project.status == ProjectStatus.MINTING &&
            block.timestamp > project.mintingDeadline &&
            project.totalRaised < project.softCap
        ) return true;

        return false;
    }

    /**
     * @notice Gets project verifiers
     * @param projectId Project ID
     * @return Array of verifier addresses
     */
    function getProjectVerifiers(
        uint256 projectId
    ) external view returns (address[] memory) {
        return _projectVerifiers[projectId];
    }

    /**
     * @notice Gets sale price for completed project
     * @param projectId Project ID
     * @return Sale price
     */
    function getSalePrice(uint256 projectId) external view returns (uint256) {
        return _salePrices[projectId];
    }

    /**
     * @notice Checks if verifier has approved milestone
     * @param projectId Project ID
     * @param milestoneIndex Milestone index
     * @param verifier Verifier address
     * @return True if approved
     */
    function hasVerifierApproved(
        uint256 projectId,
        uint256 milestoneIndex,
        address verifier
    ) external view returns (bool) {
        return _verifierApprovals[projectId][milestoneIndex][verifier];
    }

    // ============ Pausability ============

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ Internal ============

    error Unauthorized();
}

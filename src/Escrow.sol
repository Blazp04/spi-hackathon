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
import {IEscrow} from "./interfaces/IEscrow.sol";

/**
 * @title Escrow
 * @author PropertyBuild Platform
 * @notice Secure escrow contract for managing project funds
 * @dev Handles fund deposits, milestone payments, refunds, and contingency management
 */
contract Escrow is AccessControl, ReentrancyGuard, Pausable, IEscrow {
    using SafeERC20 for IERC20;

    // ============ Role Definitions ============

    bytes32 public constant LIFECYCLE_ROLE = keccak256("LIFECYCLE_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ============ State Variables ============

    /// @notice Payment token (stablecoin)
    IERC20 public immutable PAYMENT_TOKEN;

    /// @notice Treasury wallet address
    address public treasury;

    /// @notice Project fund tracking
    struct ProjectFunds {
        uint256 totalDeposited;
        uint256 totalPaidOut;
        uint256 contingencyUsed;
        uint256 platformFeeCollected;
        uint256 contingencyPercent;
        bool initialized;
    }

    /// @notice Mapping from project ID to fund tracking
    mapping(uint256 => ProjectFunds) private _projectFunds;

    /// @notice Mapping from project ID to investor to deposit amount
    mapping(uint256 => mapping(address => uint256)) private _investorDeposits;

    /// @notice Mapping from project ID to milestone index to payment amount
    mapping(uint256 => mapping(uint256 => uint256)) private _milestonePayments;

    // ============ Constants ============

    uint256 public constant BASIS_POINTS = 10000;

    // ============ Errors ============

    error InvalidAddress();
    error InvalidAmount();
    error InsufficientFunds();
    error ProjectNotInitialized();
    error ProjectAlreadyInitialized();
    error UnauthorizedCaller();

    // ============ Constructor ============

    /**
     * @notice Initializes the Escrow contract
     * @param _paymentToken Payment token address
     * @param _treasury Treasury wallet address
     * @param admin Admin address
     */
    constructor(address _paymentToken, address _treasury, address admin) {
        if (
            _paymentToken == address(0) ||
            _treasury == address(0) ||
            admin == address(0)
        ) {
            revert InvalidAddress();
        }

        PAYMENT_TOKEN = IERC20(_paymentToken);
        treasury = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(TREASURY_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    // ============ Configuration ============

    /**
     * @notice Sets the lifecycle contract address
     * @param lifecycle Lifecycle contract address
     */
    function setLifecycleContract(
        address lifecycle
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (lifecycle == address(0)) revert InvalidAddress();
        _grantRole(LIFECYCLE_ROLE, lifecycle);
    }

    /**
     * @notice Updates treasury address
     * @param _treasury New treasury address
     */
    function setTreasury(
        address _treasury
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_treasury == address(0)) revert InvalidAddress();
        treasury = _treasury;
    }

    /**
     * @notice Initializes escrow for a project
     * @param projectId Project ID
     * @param contingencyPercent Contingency percentage (basis points)
     */
    function initializeProject(
        uint256 projectId,
        uint256 contingencyPercent
    ) external onlyRole(LIFECYCLE_ROLE) {
        if (_projectFunds[projectId].initialized)
            revert ProjectAlreadyInitialized();

        _projectFunds[projectId] = ProjectFunds({
            totalDeposited: 0,
            totalPaidOut: 0,
            contingencyUsed: 0,
            platformFeeCollected: 0,
            contingencyPercent: contingencyPercent,
            initialized: true
        });
    }

    // ============ Fund Management ============

    /**
     * @notice Records a deposit for a project
     * @param projectId Project ID
     * @param investor Investor address
     * @param amount Deposit amount
     */
    function deposit(
        uint256 projectId,
        address investor,
        uint256 amount
    ) external override onlyRole(LIFECYCLE_ROLE) whenNotPaused {
        if (investor == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        // Auto-initialize if needed
        if (!_projectFunds[projectId].initialized) {
            _projectFunds[projectId].initialized = true;
        }

        _projectFunds[projectId].totalDeposited += amount;
        _investorDeposits[projectId][investor] += amount;

        emit FundsDeposited(projectId, investor, amount);
    }

    /**
     * @notice Releases payment for a verified milestone
     * @param projectId Project ID
     * @param milestoneIndex Milestone index
     * @param contractor Contractor address
     * @param amount Payment amount
     */
    function releaseMilestonePayment(
        uint256 projectId,
        uint256 milestoneIndex,
        address contractor,
        uint256 amount
    ) external override onlyRole(LIFECYCLE_ROLE) nonReentrant whenNotPaused {
        if (contractor == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        ProjectFunds storage funds = _projectFunds[projectId];
        if (!funds.initialized) revert ProjectNotInitialized();

        uint256 available = _getAvailableFunds(projectId);
        if (amount > available) revert InsufficientFunds();

        funds.totalPaidOut += amount;
        _milestonePayments[projectId][milestoneIndex] = amount;

        PAYMENT_TOKEN.safeTransfer(contractor, amount);

        emit MilestonePaymentReleased(
            projectId,
            milestoneIndex,
            contractor,
            amount
        );
    }

    /**
     * @notice Uses contingency funds
     * @param projectId Project ID
     * @param amount Amount to use
     * @param reason Reason for using contingency
     */
    function useContingency(
        uint256 projectId,
        uint256 amount,
        string calldata reason
    ) external override onlyRole(TREASURY_ROLE) nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();

        ProjectFunds storage funds = _projectFunds[projectId];
        if (!funds.initialized) revert ProjectNotInitialized();

        uint256 contingencyTotal = (funds.totalDeposited *
            funds.contingencyPercent) / BASIS_POINTS;
        uint256 contingencyAvailable = contingencyTotal - funds.contingencyUsed;

        if (amount > contingencyAvailable) revert InsufficientFunds();

        funds.contingencyUsed += amount;
        funds.totalPaidOut += amount;

        emit ContingencyUsed(projectId, amount, reason);
    }

    /**
     * @notice Processes refund to an investor
     * @param projectId Project ID
     * @param investor Investor address
     * @param amount Refund amount
     */
    function processRefund(
        uint256 projectId,
        address investor,
        uint256 amount
    ) external override onlyRole(LIFECYCLE_ROLE) nonReentrant whenNotPaused {
        if (investor == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        ProjectFunds storage funds = _projectFunds[projectId];
        if (!funds.initialized) revert ProjectNotInitialized();

        uint256 available = _getAvailableFunds(projectId);
        if (amount > available) revert InsufficientFunds();

        funds.totalPaidOut += amount;
        _investorDeposits[projectId][investor] = 0;

        PAYMENT_TOKEN.safeTransfer(investor, amount);

        emit RefundProcessed(projectId, investor, amount);
    }

    /**
     * @notice Collects platform fee
     * @param projectId Project ID
     * @param amount Fee amount
     */
    function collectPlatformFee(
        uint256 projectId,
        uint256 amount
    ) external override onlyRole(LIFECYCLE_ROLE) nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();

        ProjectFunds storage funds = _projectFunds[projectId];
        if (!funds.initialized) revert ProjectNotInitialized();

        uint256 available = _getAvailableFunds(projectId);
        if (amount > available) revert InsufficientFunds();

        funds.platformFeeCollected += amount;
        funds.totalPaidOut += amount;

        PAYMENT_TOKEN.safeTransfer(treasury, amount);

        emit PlatformFeeCollected(projectId, amount);
    }

    /**
     * @notice Emergency withdrawal (admin only)
     * @param projectId Project ID
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        uint256 projectId,
        address to,
        uint256 amount
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        ProjectFunds storage funds = _projectFunds[projectId];
        if (!funds.initialized) revert ProjectNotInitialized();

        uint256 available = _getAvailableFunds(projectId);
        if (amount > available) revert InsufficientFunds();

        funds.totalPaidOut += amount;

        PAYMENT_TOKEN.safeTransfer(to, amount);

        emit EmergencyWithdrawal(projectId, to, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Gets project balance
     * @param projectId Project ID
     * @return Current balance
     */
    function getProjectBalance(
        uint256 projectId
    ) external view override returns (uint256) {
        return _getAvailableFunds(projectId);
    }

    /**
     * @notice Gets contingency balance
     * @param projectId Project ID
     * @return Available contingency
     */
    function getContingencyBalance(
        uint256 projectId
    ) external view override returns (uint256) {
        ProjectFunds storage funds = _projectFunds[projectId];
        if (!funds.initialized) return 0;

        uint256 contingencyTotal = (funds.totalDeposited *
            funds.contingencyPercent) / BASIS_POINTS;
        return contingencyTotal - funds.contingencyUsed;
    }

    /**
     * @notice Gets milestone payment amount
     * @param projectId Project ID
     * @param milestoneIndex Milestone index
     * @return Payment amount
     */
    function getMilestonePayment(
        uint256 projectId,
        uint256 milestoneIndex
    ) external view override returns (uint256) {
        return _milestonePayments[projectId][milestoneIndex];
    }

    /**
     * @notice Gets total paid out for a project
     * @param projectId Project ID
     * @return Total paid out
     */
    function getTotalPaidOut(
        uint256 projectId
    ) external view override returns (uint256) {
        return _projectFunds[projectId].totalPaidOut;
    }

    /**
     * @notice Gets investor deposit amount
     * @param projectId Project ID
     * @param investor Investor address
     * @return Deposit amount
     */
    function getInvestorDeposit(
        uint256 projectId,
        address investor
    ) external view override returns (uint256) {
        return _investorDeposits[projectId][investor];
    }

    /**
     * @notice Gets remaining funds in escrow
     * @param projectId Project ID
     * @return Remaining funds
     */
    function getRemainingFunds(
        uint256 projectId
    ) external view override returns (uint256) {
        return _getAvailableFunds(projectId);
    }

    /**
     * @notice Gets project fund details
     * @param projectId Project ID
     * @return totalDeposited Total deposited
     * @return totalPaidOut Total paid out
     * @return contingencyUsed Contingency used
     * @return platformFeeCollected Platform fee collected
     */
    function getProjectFundDetails(
        uint256 projectId
    )
        external
        view
        returns (
            uint256 totalDeposited,
            uint256 totalPaidOut,
            uint256 contingencyUsed,
            uint256 platformFeeCollected
        )
    {
        ProjectFunds storage funds = _projectFunds[projectId];
        return (
            funds.totalDeposited,
            funds.totalPaidOut,
            funds.contingencyUsed,
            funds.platformFeeCollected
        );
    }

    // ============ Internal Functions ============

    /**
     * @dev Gets available funds for a project
     * @param projectId Project ID
     * @return Available funds
     */
    function _getAvailableFunds(
        uint256 projectId
    ) internal view returns (uint256) {
        ProjectFunds storage funds = _projectFunds[projectId];
        if (!funds.initialized) return 0;

        if (funds.totalDeposited <= funds.totalPaidOut) return 0;
        return funds.totalDeposited - funds.totalPaidOut;
    }

    // ============ Pausability ============

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}

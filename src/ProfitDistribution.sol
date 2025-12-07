// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IProfitDistribution.sol";
import "./interfaces/IProjectLifecycle.sol";
import "./PropertyBuildToken.sol";

/**
 * @title ProfitDistribution
 * @author PropertyBuild Platform
 * @notice Handles profit distribution to token holders after property sale
 * @dev Implements snapshot-based distribution with claim mechanism
 */
contract ProfitDistribution is
    AccessControl,
    ReentrancyGuard,
    Pausable,
    IProfitDistribution
{
    using SafeERC20 for IERC20;

    // ============ Role Definitions ============

    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ============ State Variables ============

    /// @notice PropertyBuild token contract
    PropertyBuildToken public immutable token;

    /// @notice Project lifecycle contract
    IProjectLifecycle public immutable lifecycle;

    /// @notice Payment token (stablecoin)
    IERC20 public immutable paymentToken;

    /// @notice Treasury address
    address public treasury;

    /// @notice Mapping from project ID to distribution
    mapping(uint256 => Distribution) private _distributions;

    /// @notice Mapping from project ID to investor to claimed status
    mapping(uint256 => mapping(address => bool)) private _hasClaimed;

    /// @notice Mapping from project ID to investor to token balance at snapshot
    mapping(uint256 => mapping(address => uint256)) private _snapshotBalances;

    /// @notice Mapping from project ID to list of investors
    mapping(uint256 => address[]) private _projectInvestors;

    /// @notice Mapping from project ID to investor to registered status
    mapping(uint256 => mapping(address => bool)) private _isRegisteredInvestor;

    // ============ Constants ============

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_CLAIM_PERIOD_DAYS = 30;
    uint256 public constant MAX_CLAIM_PERIOD_DAYS = 365;

    // ============ Errors ============

    error InvalidProject();
    error DistributionNotActive();
    error DistributionAlreadyInitiated();
    error AlreadyClaimed();
    error NothingToClaim();
    error ClaimPeriodExpired();
    error ClaimPeriodNotExpired();
    error DistributionNotCompleted();
    error InvalidAmount();
    error InvalidAddress();
    error InvalidClaimPeriod();
    error ProjectNotCompleted();
    error InsufficientFunds();

    // ============ Constructor ============

    /**
     * @notice Initializes the ProfitDistribution contract
     * @param _token PropertyBuildToken address
     * @param _lifecycle ProjectLifecycle address
     * @param _paymentToken Payment token address
     * @param _treasury Treasury address
     * @param admin Admin address
     */
    constructor(
        address _token,
        address _lifecycle,
        address _paymentToken,
        address _treasury,
        address admin
    ) {
        if (
            _token == address(0) ||
            _lifecycle == address(0) ||
            _paymentToken == address(0) ||
            _treasury == address(0) ||
            admin == address(0)
        ) {
            revert InvalidAddress();
        }

        token = PropertyBuildToken(_token);
        lifecycle = IProjectLifecycle(_lifecycle);
        paymentToken = IERC20(_paymentToken);
        treasury = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(DISTRIBUTOR_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    // ============ Investor Registration ============

    /**
     * @notice Registers an investor for a project (called during investment)
     * @param projectId Project ID
     * @param investor Investor address
     */
    function registerInvestor(
        uint256 projectId,
        address investor
    ) external onlyRole(DISTRIBUTOR_ROLE) {
        if (!_isRegisteredInvestor[projectId][investor]) {
            _isRegisteredInvestor[projectId][investor] = true;
            _projectInvestors[projectId].push(investor);
        }
    }

    // ============ Distribution Management ============

    /**
     * @notice Initiates profit distribution for a completed project
     * @param projectId Project ID
     * @param salePrice Final property sale price
     * @param totalCosts Total project costs
     * @param claimPeriodDays Number of days for claim period
     */
    function initiateDistribution(
        uint256 projectId,
        uint256 salePrice,
        uint256 totalCosts,
        uint256 claimPeriodDays
    ) external override onlyRole(DISTRIBUTOR_ROLE) nonReentrant {
        // Validate project status
        IProjectLifecycle.Project memory project = lifecycle.getProject(
            projectId
        );
        if (project.projectId == 0) revert InvalidProject();
        if (project.status != IProjectLifecycle.ProjectStatus.COMPLETED)
            revert ProjectNotCompleted();

        // Check distribution not already initiated
        if (_distributions[projectId].isActive)
            revert DistributionAlreadyInitiated();

        // Validate claim period
        if (
            claimPeriodDays < MIN_CLAIM_PERIOD_DAYS ||
            claimPeriodDays > MAX_CLAIM_PERIOD_DAYS
        ) {
            revert InvalidClaimPeriod();
        }

        // Calculate profit
        uint256 totalProfit = salePrice > totalCosts
            ? salePrice - totalCosts
            : 0;

        // Get total token supply at this block
        uint256 totalSupply = token.totalSupply(project.tokenId);
        if (totalSupply == 0) revert InvalidAmount();

        // Take snapshot of all investor balances
        _takeSnapshot(projectId, project.tokenId);

        // Create distribution record
        _distributions[projectId] = Distribution({
            projectId: projectId,
            salePrice: salePrice,
            totalCosts: totalCosts,
            totalProfit: totalProfit,
            snapshotBlock: block.number,
            totalTokenSupply: totalSupply,
            distributedAmount: 0,
            claimDeadline: block.timestamp + (claimPeriodDays * 1 days),
            isActive: true,
            isCompleted: false
        });

        emit DistributionInitiated(projectId, salePrice, totalProfit);
        emit SnapshotTaken(projectId, block.number, totalSupply);
    }

    /**
     * @dev Takes snapshot of all investor balances
     * @param projectId Project ID
     * @param tokenId Token ID
     */
    function _takeSnapshot(uint256 projectId, uint256 tokenId) internal {
        address[] memory investors = _projectInvestors[projectId];
        for (uint256 i = 0; i < investors.length; i++) {
            address investor = investors[i];
            uint256 balance = token.balanceOf(investor, tokenId);
            _snapshotBalances[projectId][investor] = balance;
        }
    }

    /**
     * @notice Claims profit for the caller
     * @param projectId Project ID
     * @return amount Profit amount claimed
     */
    function claimProfit(
        uint256 projectId
    ) external override nonReentrant whenNotPaused returns (uint256 amount) {
        Distribution storage dist = _distributions[projectId];
        if (!dist.isActive) revert DistributionNotActive();
        if (block.timestamp > dist.claimDeadline) revert ClaimPeriodExpired();
        if (_hasClaimed[projectId][msg.sender]) revert AlreadyClaimed();

        uint256 investorBalance = _snapshotBalances[projectId][msg.sender];
        if (investorBalance == 0) revert NothingToClaim();

        // Calculate profit share
        amount = (dist.totalProfit * investorBalance) / dist.totalTokenSupply;
        if (amount == 0) revert NothingToClaim();

        // Mark as claimed before transfer
        _hasClaimed[projectId][msg.sender] = true;
        dist.distributedAmount += amount;

        // Get project info for token burning
        IProjectLifecycle.Project memory project = lifecycle.getProject(
            projectId
        );

        // Burn investor's tokens
        token.burn(msg.sender, project.tokenId, investorBalance);

        // Transfer profit
        paymentToken.safeTransfer(msg.sender, amount);

        emit ProfitClaimed(projectId, msg.sender, amount, investorBalance);
    }

    /**
     * @notice Claims profit for multiple investors (batch operation)
     * @param projectId Project ID
     * @param investors Array of investor addresses
     */
    function batchClaimProfit(
        uint256 projectId,
        address[] calldata investors
    ) external override onlyRole(DISTRIBUTOR_ROLE) nonReentrant whenNotPaused {
        Distribution storage dist = _distributions[projectId];
        if (!dist.isActive) revert DistributionNotActive();
        if (block.timestamp > dist.claimDeadline) revert ClaimPeriodExpired();

        IProjectLifecycle.Project memory project = lifecycle.getProject(
            projectId
        );

        for (uint256 i = 0; i < investors.length; i++) {
            address investor = investors[i];

            if (_hasClaimed[projectId][investor]) continue;

            uint256 investorBalance = _snapshotBalances[projectId][investor];
            if (investorBalance == 0) continue;

            uint256 amount = (dist.totalProfit * investorBalance) /
                dist.totalTokenSupply;
            if (amount == 0) continue;

            _hasClaimed[projectId][investor] = true;
            dist.distributedAmount += amount;

            // Burn investor's tokens
            token.burn(investor, project.tokenId, investorBalance);

            // Transfer profit
            paymentToken.safeTransfer(investor, amount);

            emit ProfitClaimed(projectId, investor, amount, investorBalance);
        }
    }

    /**
     * @notice Completes the distribution after claim period
     * @param projectId Project ID
     */
    function completeDistribution(
        uint256 projectId
    ) external override onlyRole(DISTRIBUTOR_ROLE) {
        Distribution storage dist = _distributions[projectId];
        if (!dist.isActive) revert DistributionNotActive();
        if (dist.isCompleted) revert DistributionNotCompleted();
        if (block.timestamp <= dist.claimDeadline)
            revert ClaimPeriodNotExpired();

        dist.isCompleted = true;

        emit DistributionCompleted(projectId, dist.distributedAmount);
    }

    /**
     * @notice Recovers uncollected funds after claim period
     * @param projectId Project ID
     * @return amount Amount recovered
     */
    function recoverUncollectedFunds(
        uint256 projectId
    )
        external
        override
        onlyRole(DISTRIBUTOR_ROLE)
        nonReentrant
        returns (uint256 amount)
    {
        Distribution storage dist = _distributions[projectId];
        if (!dist.isCompleted) revert DistributionNotCompleted();

        amount = dist.totalProfit - dist.distributedAmount;
        if (amount == 0) return 0;

        // Mark all as distributed to prevent double recovery
        dist.distributedAmount = dist.totalProfit;

        paymentToken.safeTransfer(treasury, amount);

        emit UncollectedFundsRecovered(projectId, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Gets distribution details
     * @param projectId Project ID
     * @return Distribution struct
     */
    function getDistribution(
        uint256 projectId
    ) external view override returns (Distribution memory) {
        return _distributions[projectId];
    }

    /**
     * @notice Calculates claimable amount for an investor
     * @param projectId Project ID
     * @param investor Investor address
     * @return Claimable amount
     */
    function getClaimableAmount(
        uint256 projectId,
        address investor
    ) external view override returns (uint256) {
        Distribution storage dist = _distributions[projectId];
        if (!dist.isActive) return 0;
        if (_hasClaimed[projectId][investor]) return 0;
        if (block.timestamp > dist.claimDeadline) return 0;

        uint256 investorBalance = _snapshotBalances[projectId][investor];
        if (investorBalance == 0) return 0;

        return (dist.totalProfit * investorBalance) / dist.totalTokenSupply;
    }

    /**
     * @notice Checks if investor has claimed
     * @param projectId Project ID
     * @param investor Investor address
     * @return True if claimed
     */
    function hasClaimed(
        uint256 projectId,
        address investor
    ) external view override returns (bool) {
        return _hasClaimed[projectId][investor];
    }

    /**
     * @notice Gets token balance at snapshot
     * @param projectId Project ID
     * @param investor Investor address
     * @return Token balance
     */
    function getTokenBalanceAtSnapshot(
        uint256 projectId,
        address investor
    ) external view override returns (uint256) {
        return _snapshotBalances[projectId][investor];
    }

    /**
     * @notice Gets list of project investors
     * @param projectId Project ID
     * @return Array of investor addresses
     */
    function getProjectInvestors(
        uint256 projectId
    ) external view returns (address[] memory) {
        return _projectInvestors[projectId];
    }

    /**
     * @notice Gets investor count for a project
     * @param projectId Project ID
     * @return Investor count
     */
    function getInvestorCount(
        uint256 projectId
    ) external view returns (uint256) {
        return _projectInvestors[projectId].length;
    }

    // ============ Admin Functions ============

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
     * @notice Deposits funds for distribution
     * @param projectId Project ID
     * @param amount Amount to deposit
     */
    function depositFunds(
        uint256 projectId,
        uint256 amount
    ) external onlyRole(DISTRIBUTOR_ROLE) {
        if (amount == 0) revert InvalidAmount();
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    // ============ Pausability ============

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}

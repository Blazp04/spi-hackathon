// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IProfitDistribution
 * @notice Interface for the Profit Distribution contract
 */
interface IProfitDistribution {
    // Events
    event DistributionInitiated(
        uint256 indexed projectId,
        uint256 salePrice,
        uint256 totalProfit
    );
    event SnapshotTaken(
        uint256 indexed projectId,
        uint256 snapshotBlock,
        uint256 totalSupply
    );
    event ProfitClaimed(
        uint256 indexed projectId,
        address indexed investor,
        uint256 amount,
        uint256 tokensBurned
    );
    event DistributionCompleted(
        uint256 indexed projectId,
        uint256 totalDistributed
    );
    event UncollectedFundsRecovered(uint256 indexed projectId, uint256 amount);

    // Structs
    struct Distribution {
        uint256 projectId;
        uint256 salePrice;
        uint256 totalCosts;
        uint256 totalProfit;
        uint256 snapshotBlock;
        uint256 totalTokenSupply;
        uint256 distributedAmount;
        uint256 claimDeadline;
        bool isActive;
        bool isCompleted;
    }

    // View functions
    function getDistribution(
        uint256 projectId
    ) external view returns (Distribution memory);
    function getClaimableAmount(
        uint256 projectId,
        address investor
    ) external view returns (uint256);
    function hasClaimed(
        uint256 projectId,
        address investor
    ) external view returns (bool);
    function getTokenBalanceAtSnapshot(
        uint256 projectId,
        address investor
    ) external view returns (uint256);

    // Distribution management
    function initiateDistribution(
        uint256 projectId,
        uint256 salePrice,
        uint256 totalCosts,
        uint256 claimPeriodDays
    ) external;

    function claimProfit(uint256 projectId) external returns (uint256);
    function batchClaimProfit(
        uint256 projectId,
        address[] calldata investors
    ) external;
    function completeDistribution(uint256 projectId) external;
    function recoverUncollectedFunds(
        uint256 projectId
    ) external returns (uint256);
}

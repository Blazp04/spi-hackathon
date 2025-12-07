// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ILiquidityPool
 * @notice Interface for the AMM Liquidity Pool contract
 */
interface ILiquidityPool {
    // Events
    event PoolCreated(
        uint256 indexed projectId,
        uint256 initialTokens,
        uint256 initialStable
    );
    event LiquidityAdded(
        uint256 indexed projectId,
        address indexed provider,
        uint256 tokens,
        uint256 stable
    );
    event LiquidityRemoved(
        uint256 indexed projectId,
        address indexed provider,
        uint256 tokens,
        uint256 stable
    );
    event TokensSwapped(
        uint256 indexed projectId,
        address indexed trader,
        bool tokenToStable,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    );
    event FeesCollected(uint256 indexed projectId, uint256 amount);
    event TradingPaused(uint256 indexed projectId);
    event TradingResumed(uint256 indexed projectId);
    event CircuitBreakerTriggered(uint256 indexed projectId, string reason);

    // View functions
    function getPoolReserves(
        uint256 projectId
    ) external view returns (uint256 tokenReserve, uint256 stableReserve);
    function getSpotPrice(uint256 projectId) external view returns (uint256);
    function getAmountOut(
        uint256 projectId,
        bool tokenToStable,
        uint256 amountIn
    ) external view returns (uint256);
    function getLiquidityProviderShare(
        uint256 projectId,
        address provider
    ) external view returns (uint256);
    function isTradingActive(uint256 projectId) external view returns (bool);
    function getAccumulatedFees(
        uint256 projectId
    ) external view returns (uint256);

    // Pool management
    function createPool(
        uint256 projectId,
        uint256 initialTokens,
        uint256 initialStable
    ) external;
    function addLiquidity(
        uint256 projectId,
        uint256 tokenAmount,
        uint256 stableAmount
    ) external returns (uint256 lpTokens);
    function removeLiquidity(
        uint256 projectId,
        uint256 lpTokens
    ) external returns (uint256 tokens, uint256 stable);

    // Trading
    function swapTokensForStable(
        uint256 projectId,
        uint256 tokenAmount,
        uint256 minStableOut
    ) external returns (uint256);
    function swapStableForTokens(
        uint256 projectId,
        uint256 stableAmount,
        uint256 minTokensOut
    ) external returns (uint256);

    // Admin functions
    function pauseTrading(uint256 projectId) external;
    function resumeTrading(uint256 projectId) external;
    function collectFees(uint256 projectId) external returns (uint256);
    function emergencyWithdrawLiquidity(uint256 projectId) external;
}

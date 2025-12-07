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
import {ILiquidityPool} from "./interfaces/ILiquidityPool.sol";
import {PropertyBuildToken} from "./PropertyBuildToken.sol";

/**
 * @title LiquidityPool
 * @author PropertyBuild Platform
 * @notice AMM Liquidity Pool for project token trading
 * @dev Implements constant product AMM with fees, slippage protection, and circuit breakers
 */
contract LiquidityPool is
    AccessControl,
    ReentrancyGuard,
    Pausable,
    ILiquidityPool
{
    using SafeERC20 for IERC20;

    // ============ Role Definitions ============

    bytes32 public constant POOL_ADMIN_ROLE = keccak256("POOL_ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    // ============ State Variables ============

    /// @notice PropertyBuild token contract
    PropertyBuildToken public immutable TOKEN;

    /// @notice Stablecoin for trading
    IERC20 public immutable STABLECOIN;

    /// @notice Treasury address for fee collection
    address public treasury;

    /// @notice Pool data structure
    struct Pool {
        uint256 tokenReserve; // Project token reserve
        uint256 stableReserve; // Stablecoin reserve
        uint256 totalLpTokens; // Total LP tokens issued
        uint256 accumulatedFees; // Fees accumulated
        uint256 lastPriceUpdate; // Last price update timestamp
        uint256 lastPrice; // Last recorded price
        bool tradingActive; // Trading status
        bool initialized; // Pool initialization status
    }

    /// @notice Pool configuration
    struct PoolConfig {
        uint256 swapFee; // Swap fee in basis points (e.g., 30 = 0.3%)
        uint256 lpFeeShare; // LP share of fees in basis points
        uint256 treasuryFeeShare; // Treasury share of fees in basis points
        uint256 maxSlippage; // Maximum slippage allowed in basis points
        uint256 maxTransactionPercent; // Max transaction as % of reserve (basis points)
        uint256 circuitBreakerThreshold; // Price change threshold for circuit breaker (basis points)
        uint256 cooldownPeriod; // Blocks between circuit breaker triggers
    }

    /// @notice Mapping from project ID to pool
    mapping(uint256 => Pool) private _pools;

    /// @notice Mapping from project ID to pool config
    mapping(uint256 => PoolConfig) private _poolConfigs;

    /// @notice Mapping from project ID to provider to LP token balance
    mapping(uint256 => mapping(address => uint256)) private _lpBalances;

    /// @notice Circuit breaker state
    mapping(uint256 => uint256) private _lastCircuitBreakerBlock;

    // ============ Constants ============

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    uint256 public constant DEFAULT_SWAP_FEE = 30; // 0.3%
    uint256 public constant DEFAULT_LP_FEE_SHARE = 8000; // 80% to LPs
    uint256 public constant DEFAULT_TREASURY_FEE_SHARE = 2000; // 20% to treasury
    uint256 public constant DEFAULT_MAX_SLIPPAGE = 500; // 5%
    uint256 public constant DEFAULT_MAX_TX_PERCENT = 1000; // 10%
    uint256 public constant DEFAULT_CIRCUIT_BREAKER = 1500; // 15% price change
    uint256 public constant DEFAULT_COOLDOWN = 100; // 100 blocks

    // ============ Errors ============

    error PoolNotInitialized();
    error PoolAlreadyInitialized();
    error TradingNotActive();
    error InsufficientLiquidity();
    error SlippageExceeded();
    error TransactionTooLarge();
    error CircuitBreakerActive();
    error InvalidAmount();
    error InvalidAddress();
    error InsufficientLpTokens();
    error ZeroOutput();

    // ============ Constructor ============

    /**
     * @notice Initializes the LiquidityPool contract
     * @param _token PropertyBuildToken address
     * @param _stablecoin Stablecoin address
     * @param _treasury Treasury address
     * @param admin Admin address
     */
    constructor(
        address _token,
        address _stablecoin,
        address _treasury,
        address admin
    ) {
        if (
            _token == address(0) ||
            _stablecoin == address(0) ||
            _treasury == address(0) ||
            admin == address(0)
        ) {
            revert InvalidAddress();
        }

        TOKEN = PropertyBuildToken(_token);
        STABLECOIN = IERC20(_stablecoin);
        treasury = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(POOL_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(TREASURY_ROLE, admin);
    }

    // ============ Pool Creation ============

    /**
     * @notice Creates a new liquidity pool for a project
     * @param projectId Project ID
     * @param initialTokens Initial project tokens
     * @param initialStable Initial stablecoins
     */
    function createPool(
        uint256 projectId,
        uint256 initialTokens,
        uint256 initialStable
    ) external override onlyRole(POOL_ADMIN_ROLE) nonReentrant {
        if (_pools[projectId].initialized) revert PoolAlreadyInitialized();
        if (initialTokens == 0 || initialStable == 0) revert InvalidAmount();

        uint256 tokenId = TOKEN.getProjectTokenId(projectId);
        if (tokenId == 0) revert InvalidAmount();

        // Transfer initial liquidity
        TOKEN.safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            initialTokens,
            ""
        );
        STABLECOIN.safeTransferFrom(msg.sender, address(this), initialStable);

        // Calculate initial LP tokens (geometric mean minus minimum liquidity)
        uint256 lpTokens = _sqrt(initialTokens * initialStable) -
            MINIMUM_LIQUIDITY;

        _pools[projectId] = Pool({
            tokenReserve: initialTokens,
            stableReserve: initialStable,
            totalLpTokens: lpTokens + MINIMUM_LIQUIDITY,
            accumulatedFees: 0,
            lastPriceUpdate: block.timestamp,
            lastPrice: (initialStable * 1e18) / initialTokens,
            tradingActive: true,
            initialized: true
        });

        // Set default config
        _poolConfigs[projectId] = PoolConfig({
            swapFee: DEFAULT_SWAP_FEE,
            lpFeeShare: DEFAULT_LP_FEE_SHARE,
            treasuryFeeShare: DEFAULT_TREASURY_FEE_SHARE,
            maxSlippage: DEFAULT_MAX_SLIPPAGE,
            maxTransactionPercent: DEFAULT_MAX_TX_PERCENT,
            circuitBreakerThreshold: DEFAULT_CIRCUIT_BREAKER,
            cooldownPeriod: DEFAULT_COOLDOWN
        });

        // Assign LP tokens to creator (minus minimum locked)
        _lpBalances[projectId][msg.sender] = lpTokens;

        emit PoolCreated(projectId, initialTokens, initialStable);
    }

    // ============ Liquidity Management ============

    /**
     * @notice Adds liquidity to a pool
     * @param projectId Project ID
     * @param tokenAmount Token amount to add
     * @param stableAmount Stablecoin amount to add
     * @return lpTokens LP tokens received
     */
    function addLiquidity(
        uint256 projectId,
        uint256 tokenAmount,
        uint256 stableAmount
    ) external override nonReentrant whenNotPaused returns (uint256 lpTokens) {
        Pool storage pool = _pools[projectId];
        if (!pool.initialized) revert PoolNotInitialized();
        if (tokenAmount == 0 || stableAmount == 0) revert InvalidAmount();

        uint256 tokenId = TOKEN.getProjectTokenId(projectId);

        // Calculate optimal amounts to maintain ratio
        uint256 optimalStable = (tokenAmount * pool.stableReserve) /
            pool.tokenReserve;
        uint256 optimalToken = (stableAmount * pool.tokenReserve) /
            pool.stableReserve;

        uint256 actualToken;
        uint256 actualStable;

        if (optimalStable <= stableAmount) {
            actualToken = tokenAmount;
            actualStable = optimalStable;
        } else {
            actualToken = optimalToken;
            actualStable = stableAmount;
        }

        // Calculate LP tokens to mint
        lpTokens = (actualToken * pool.totalLpTokens) / pool.tokenReserve;

        // Transfer tokens
        TOKEN.safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            actualToken,
            ""
        );
        STABLECOIN.safeTransferFrom(msg.sender, address(this), actualStable);

        // Update pool state
        pool.tokenReserve += actualToken;
        pool.stableReserve += actualStable;
        pool.totalLpTokens += lpTokens;
        _lpBalances[projectId][msg.sender] += lpTokens;

        emit LiquidityAdded(projectId, msg.sender, actualToken, actualStable);
    }

    /**
     * @notice Removes liquidity from a pool
     * @param projectId Project ID
     * @param lpTokenAmount LP tokens to burn
     * @return tokens Tokens received
     * @return stable Stablecoins received
     */
    function removeLiquidity(
        uint256 projectId,
        uint256 lpTokenAmount
    )
        external
        override
        nonReentrant
        whenNotPaused
        returns (uint256 tokens, uint256 stable)
    {
        Pool storage pool = _pools[projectId];
        if (!pool.initialized) revert PoolNotInitialized();
        if (lpTokenAmount == 0) revert InvalidAmount();
        if (_lpBalances[projectId][msg.sender] < lpTokenAmount)
            revert InsufficientLpTokens();

        uint256 tokenId = TOKEN.getProjectTokenId(projectId);

        // Calculate amounts to return
        tokens = (lpTokenAmount * pool.tokenReserve) / pool.totalLpTokens;
        stable = (lpTokenAmount * pool.stableReserve) / pool.totalLpTokens;

        if (tokens == 0 || stable == 0) revert ZeroOutput();

        // Update state before transfers
        _lpBalances[projectId][msg.sender] -= lpTokenAmount;
        pool.totalLpTokens -= lpTokenAmount;
        pool.tokenReserve -= tokens;
        pool.stableReserve -= stable;

        // Transfer tokens
        TOKEN.safeTransferFrom(address(this), msg.sender, tokenId, tokens, "");
        STABLECOIN.safeTransfer(msg.sender, stable);

        emit LiquidityRemoved(projectId, msg.sender, tokens, stable);
    }

    // ============ Trading ============

    /**
     * @notice Swaps project tokens for stablecoins
     * @param projectId Project ID
     * @param tokenAmount Amount of tokens to swap
     * @param minStableOut Minimum stablecoins to receive
     * @return stableOut Stablecoins received
     */
    function swapTokensForStable(
        uint256 projectId,
        uint256 tokenAmount,
        uint256 minStableOut
    ) external override nonReentrant whenNotPaused returns (uint256 stableOut) {
        Pool storage pool = _pools[projectId];
        PoolConfig storage config = _poolConfigs[projectId];

        if (!pool.initialized) revert PoolNotInitialized();
        if (!pool.tradingActive) revert TradingNotActive();
        if (tokenAmount == 0) revert InvalidAmount();

        // Check transaction size limit
        uint256 maxTx = (pool.tokenReserve * config.maxTransactionPercent) /
            BASIS_POINTS;
        if (tokenAmount > maxTx) revert TransactionTooLarge();

        // Check circuit breaker
        _checkCircuitBreaker(projectId);

        uint256 tokenId = TOKEN.getProjectTokenId(projectId);

        // Calculate output with fee
        uint256 tokenAmountWithFee = tokenAmount *
            (BASIS_POINTS - config.swapFee);
        stableOut =
            (tokenAmountWithFee * pool.stableReserve) /
            (pool.tokenReserve * BASIS_POINTS + tokenAmountWithFee);

        if (stableOut < minStableOut) revert SlippageExceeded();
        if (stableOut == 0) revert ZeroOutput();

        // Calculate fees
        uint256 fee = (tokenAmount * config.swapFee) / BASIS_POINTS;
        uint256 stableFee = (fee * pool.stableReserve) / pool.tokenReserve;
        pool.accumulatedFees += stableFee;

        // Transfer tokens
        TOKEN.safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            tokenAmount,
            ""
        );
        STABLECOIN.safeTransfer(msg.sender, stableOut);

        // Update reserves
        pool.tokenReserve += tokenAmount;
        pool.stableReserve -= stableOut;

        // Update price tracking
        _updatePrice(projectId);

        emit TokensSwapped(
            projectId,
            msg.sender,
            true,
            tokenAmount,
            stableOut,
            stableFee
        );
    }

    /**
     * @notice Swaps stablecoins for project tokens
     * @param projectId Project ID
     * @param stableAmount Amount of stablecoins to swap
     * @param minTokensOut Minimum tokens to receive
     * @return tokensOut Tokens received
     */
    function swapStableForTokens(
        uint256 projectId,
        uint256 stableAmount,
        uint256 minTokensOut
    ) external override nonReentrant whenNotPaused returns (uint256 tokensOut) {
        Pool storage pool = _pools[projectId];
        PoolConfig storage config = _poolConfigs[projectId];

        if (!pool.initialized) revert PoolNotInitialized();
        if (!pool.tradingActive) revert TradingNotActive();
        if (stableAmount == 0) revert InvalidAmount();

        // Check transaction size limit
        uint256 maxTx = (pool.stableReserve * config.maxTransactionPercent) /
            BASIS_POINTS;
        if (stableAmount > maxTx) revert TransactionTooLarge();

        // Check circuit breaker
        _checkCircuitBreaker(projectId);

        uint256 tokenId = TOKEN.getProjectTokenId(projectId);

        // Calculate output with fee
        uint256 stableAmountWithFee = stableAmount *
            (BASIS_POINTS - config.swapFee);
        tokensOut =
            (stableAmountWithFee * pool.tokenReserve) /
            (pool.stableReserve * BASIS_POINTS + stableAmountWithFee);

        if (tokensOut < minTokensOut) revert SlippageExceeded();
        if (tokensOut == 0) revert ZeroOutput();

        // Calculate fees
        uint256 fee = (stableAmount * config.swapFee) / BASIS_POINTS;
        pool.accumulatedFees += fee;

        // Transfer tokens
        STABLECOIN.safeTransferFrom(msg.sender, address(this), stableAmount);
        TOKEN.safeTransferFrom(
            address(this),
            msg.sender,
            tokenId,
            tokensOut,
            ""
        );

        // Update reserves
        pool.stableReserve += stableAmount;
        pool.tokenReserve -= tokensOut;

        // Update price tracking
        _updatePrice(projectId);

        emit TokensSwapped(
            projectId,
            msg.sender,
            false,
            stableAmount,
            tokensOut,
            fee
        );
    }

    // ============ Admin Functions ============

    /**
     * @notice Pauses trading for a project
     * @param projectId Project ID
     */
    function pauseTrading(
        uint256 projectId
    ) external override onlyRole(PAUSER_ROLE) {
        Pool storage pool = _pools[projectId];
        if (!pool.initialized) revert PoolNotInitialized();

        pool.tradingActive = false;
        emit TradingPaused(projectId);
    }

    /**
     * @notice Resumes trading for a project
     * @param projectId Project ID
     */
    function resumeTrading(
        uint256 projectId
    ) external override onlyRole(PAUSER_ROLE) {
        Pool storage pool = _pools[projectId];
        if (!pool.initialized) revert PoolNotInitialized();

        pool.tradingActive = true;
        emit TradingResumed(projectId);
    }

    /**
     * @notice Collects accumulated fees
     * @param projectId Project ID
     * @return amount Fees collected
     */
    function collectFees(
        uint256 projectId
    )
        external
        override
        onlyRole(TREASURY_ROLE)
        nonReentrant
        returns (uint256 amount)
    {
        Pool storage pool = _pools[projectId];
        PoolConfig storage config = _poolConfigs[projectId];
        if (!pool.initialized) revert PoolNotInitialized();

        amount = pool.accumulatedFees;
        if (amount == 0) return 0;

        pool.accumulatedFees = 0;

        // Split fees between LPs (stays in pool) and treasury
        uint256 treasuryShare = (amount * config.treasuryFeeShare) /
            BASIS_POINTS;

        if (treasuryShare > 0) {
            STABLECOIN.safeTransfer(treasury, treasuryShare);
        }

        emit FeesCollected(projectId, amount);
    }

    /**
     * @notice Emergency withdrawal of liquidity (admin only)
     * @param projectId Project ID
     */
    function emergencyWithdrawLiquidity(
        uint256 projectId
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        Pool storage pool = _pools[projectId];
        if (!pool.initialized) revert PoolNotInitialized();

        uint256 tokenId = TOKEN.getProjectTokenId(projectId);
        uint256 tokenBalance = pool.tokenReserve;
        uint256 stableBalance = pool.stableReserve;

        pool.tokenReserve = 0;
        pool.stableReserve = 0;
        pool.tradingActive = false;

        if (tokenBalance > 0) {
            TOKEN.safeTransferFrom(
                address(this),
                treasury,
                tokenId,
                tokenBalance,
                ""
            );
        }
        if (stableBalance > 0) {
            STABLECOIN.safeTransfer(treasury, stableBalance);
        }
    }

    /**
     * @notice Updates pool configuration
     * @param projectId Project ID
     * @param swapFee New swap fee (basis points)
     * @param maxSlippage New max slippage (basis points)
     * @param maxTxPercent New max transaction percent (basis points)
     * @param circuitBreakerThreshold New circuit breaker threshold (basis points)
     */
    function updatePoolConfig(
        uint256 projectId,
        uint256 swapFee,
        uint256 maxSlippage,
        uint256 maxTxPercent,
        uint256 circuitBreakerThreshold
    ) external onlyRole(POOL_ADMIN_ROLE) {
        if (!_pools[projectId].initialized) revert PoolNotInitialized();

        PoolConfig storage config = _poolConfigs[projectId];
        config.swapFee = swapFee;
        config.maxSlippage = maxSlippage;
        config.maxTransactionPercent = maxTxPercent;
        config.circuitBreakerThreshold = circuitBreakerThreshold;
    }

    // ============ View Functions ============

    /**
     * @notice Gets pool reserves
     * @param projectId Project ID
     * @return tokenReserve Token reserve
     * @return stableReserve Stablecoin reserve
     */
    function getPoolReserves(
        uint256 projectId
    )
        external
        view
        override
        returns (uint256 tokenReserve, uint256 stableReserve)
    {
        Pool storage pool = _pools[projectId];
        return (pool.tokenReserve, pool.stableReserve);
    }

    /**
     * @notice Gets spot price (stablecoin per token)
     * @param projectId Project ID
     * @return Price in 18 decimals
     */
    function getSpotPrice(
        uint256 projectId
    ) external view override returns (uint256) {
        Pool storage pool = _pools[projectId];
        if (!pool.initialized || pool.tokenReserve == 0) return 0;
        return (pool.stableReserve * 1e18) / pool.tokenReserve;
    }

    /**
     * @notice Calculates output amount for a swap
     * @param projectId Project ID
     * @param tokenToStable Direction of swap
     * @param amountIn Input amount
     * @return Output amount
     */
    function getAmountOut(
        uint256 projectId,
        bool tokenToStable,
        uint256 amountIn
    ) external view override returns (uint256) {
        Pool storage pool = _pools[projectId];
        PoolConfig storage config = _poolConfigs[projectId];
        if (!pool.initialized) return 0;

        uint256 amountInWithFee = amountIn * (BASIS_POINTS - config.swapFee);

        if (tokenToStable) {
            return
                (amountInWithFee * pool.stableReserve) /
                (pool.tokenReserve * BASIS_POINTS + amountInWithFee);
        } else {
            return
                (amountInWithFee * pool.tokenReserve) /
                (pool.stableReserve * BASIS_POINTS + amountInWithFee);
        }
    }

    /**
     * @notice Gets LP token balance for a provider
     * @param projectId Project ID
     * @param provider Provider address
     * @return LP token balance
     */
    function getLiquidityProviderShare(
        uint256 projectId,
        address provider
    ) external view override returns (uint256) {
        return _lpBalances[projectId][provider];
    }

    /**
     * @notice Checks if trading is active
     * @param projectId Project ID
     * @return True if trading is active
     */
    function isTradingActive(
        uint256 projectId
    ) external view override returns (bool) {
        return _pools[projectId].tradingActive;
    }

    /**
     * @notice Gets accumulated fees
     * @param projectId Project ID
     * @return Accumulated fees
     */
    function getAccumulatedFees(
        uint256 projectId
    ) external view override returns (uint256) {
        return _pools[projectId].accumulatedFees;
    }

    /**
     * @notice Gets pool configuration
     * @param projectId Project ID
     * @return swapFee Swap fee
     * @return lpFeeShare LP fee share
     * @return treasuryFeeShare Treasury fee share
     * @return maxSlippage Max slippage
     * @return maxTransactionPercent Max transaction percent
     * @return circuitBreakerThreshold Circuit breaker threshold
     */
    function getPoolConfig(
        uint256 projectId
    )
        external
        view
        returns (
            uint256 swapFee,
            uint256 lpFeeShare,
            uint256 treasuryFeeShare,
            uint256 maxSlippage,
            uint256 maxTransactionPercent,
            uint256 circuitBreakerThreshold
        )
    {
        PoolConfig storage config = _poolConfigs[projectId];
        return (
            config.swapFee,
            config.lpFeeShare,
            config.treasuryFeeShare,
            config.maxSlippage,
            config.maxTransactionPercent,
            config.circuitBreakerThreshold
        );
    }

    // ============ Internal Functions ============

    /**
     * @dev Updates price tracking
     * @param projectId Project ID
     */
    function _updatePrice(uint256 projectId) internal {
        Pool storage pool = _pools[projectId];
        pool.lastPrice = (pool.stableReserve * 1e18) / pool.tokenReserve;
        pool.lastPriceUpdate = block.timestamp;
    }

    /**
     * @dev Checks circuit breaker conditions
     * @param projectId Project ID
     */
    function _checkCircuitBreaker(uint256 projectId) internal {
        Pool storage pool = _pools[projectId];
        PoolConfig storage config = _poolConfigs[projectId];

        if (
            _lastCircuitBreakerBlock[projectId] + config.cooldownPeriod >
            block.number
        ) {
            revert CircuitBreakerActive();
        }

        uint256 currentPrice = (pool.stableReserve * 1e18) / pool.tokenReserve;
        uint256 priceDiff;

        if (currentPrice > pool.lastPrice) {
            priceDiff =
                ((currentPrice - pool.lastPrice) * BASIS_POINTS) /
                pool.lastPrice;
        } else {
            priceDiff =
                ((pool.lastPrice - currentPrice) * BASIS_POINTS) /
                pool.lastPrice;
        }

        if (priceDiff > config.circuitBreakerThreshold) {
            _lastCircuitBreakerBlock[projectId] = block.number;
            pool.tradingActive = false;
            emit CircuitBreakerTriggered(
                projectId,
                "Price volatility exceeded threshold"
            );
        }
    }

    /**
     * @dev Square root function using Babylonian method
     * @param x Input value
     * @return y Square root
     */
    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    // ============ Pausability ============

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ ERC1155 Receiver ============

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}

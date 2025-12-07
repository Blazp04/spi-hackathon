// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IPropertyBuildToken.sol";

/**
 * @title PropertyBuildToken
 * @author PropertyBuild Platform
 * @notice ERC1155 Multi-Token contract for tokenized real estate construction financing
 * @dev Implements ERC1155 with access control, pausability, supply tracking, and rate limiting
 *
 * Each project gets a unique token ID representing fungible investment shares.
 * Tokens are utility-like financial instruments during project lifecycle.
 */
contract PropertyBuildToken is
    ERC1155,
    ERC1155Burnable,
    ERC1155Pausable,
    ERC1155Supply,
    AccessControl,
    ReentrancyGuard,
    IPropertyBuildToken
{
    // ============ Role Definitions ============

    /// @notice Role for minting tokens during fundraising
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Role for burning tokens during profit distribution
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /// @notice Role for pausing contract in emergencies
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Role for project administration
    bytes32 public constant PROJECT_ADMIN_ROLE =
        keccak256("PROJECT_ADMIN_ROLE");

    // ============ State Variables ============

    /// @notice Mapping from project ID to token ID
    mapping(uint256 => uint256) private _projectTokenIds;

    /// @notice Mapping from token ID to project ID
    mapping(uint256 => uint256) private _tokenProjectIds;

    /// @notice Token URI storage per token ID
    mapping(uint256 => string) private _tokenURIs;

    /// @notice Counter for generating unique token IDs
    uint256 private _tokenIdCounter;

    // ============ Rate Limiting ============

    /// @notice Rate limit configuration per token
    struct RateLimitConfig {
        uint256 maxPerBlock; // Maximum tokens mintable per block
        uint256 cooldownBlocks; // Blocks between large mints
        uint256 largeMintThreshold; // Threshold for triggering cooldown
    }

    /// @notice Minting statistics per token
    struct MintingState {
        uint256 totalMinted;
        uint256 lastMintBlock;
        uint256 mintedThisBlock;
        uint256 lastLargeMintBlock;
    }

    /// @notice Rate limit configurations
    mapping(uint256 => RateLimitConfig) private _rateLimits;

    /// @notice Minting state tracking
    mapping(uint256 => MintingState) private _mintingState;

    // ============ Constants ============

    /// @notice Default rate limit: max tokens per block
    uint256 public constant DEFAULT_MAX_PER_BLOCK = 1_000_000 * 10 ** 18;

    /// @notice Default cooldown blocks
    uint256 public constant DEFAULT_COOLDOWN_BLOCKS = 10;

    /// @notice Large mint threshold (triggers cooldown)
    uint256 public constant DEFAULT_LARGE_MINT_THRESHOLD = 100_000 * 10 ** 18;

    // ============ Errors ============

    error TokenDoesNotExist(uint256 tokenId);
    error ProjectTokenAlreadyExists(uint256 projectId);
    error RateLimitExceeded(uint256 requested, uint256 available);
    error CooldownNotMet(uint256 blocksRemaining);
    error InvalidAmount();
    error ZeroAddress();
    error Unauthorized();

    // ============ Constructor ============

    /**
     * @notice Initializes the PropertyBuildToken contract
     * @param defaultUri Default URI for metadata
     * @param admin Address to receive DEFAULT_ADMIN_ROLE
     */
    constructor(string memory defaultUri, address admin) ERC1155(defaultUri) {
        if (admin == address(0)) revert ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(PROJECT_ADMIN_ROLE, admin);

        // Start token IDs at 1 (0 is reserved)
        _tokenIdCounter = 1;
    }

    // ============ Token Creation ============

    /**
     * @notice Creates a new token ID for a project
     * @param projectId The unique project identifier
     * @param tokenUri IPFS URI for token metadata
     * @return tokenId The newly created token ID
     */
    function createProjectToken(
        uint256 projectId,
        string calldata tokenUri
    ) external override onlyRole(PROJECT_ADMIN_ROLE) returns (uint256) {
        if (_projectTokenIds[projectId] != 0) {
            revert ProjectTokenAlreadyExists(projectId);
        }

        uint256 tokenId = _tokenIdCounter++;

        _projectTokenIds[projectId] = tokenId;
        _tokenProjectIds[tokenId] = projectId;
        _tokenURIs[tokenId] = tokenUri;

        // Set default rate limits
        _rateLimits[tokenId] = RateLimitConfig({
            maxPerBlock: DEFAULT_MAX_PER_BLOCK,
            cooldownBlocks: DEFAULT_COOLDOWN_BLOCKS,
            largeMintThreshold: DEFAULT_LARGE_MINT_THRESHOLD
        });

        emit ProjectTokenCreated(projectId, tokenId, tokenUri);

        return tokenId;
    }

    // ============ Minting ============

    /**
     * @notice Mints tokens to an address with rate limiting
     * @param to Recipient address
     * @param tokenId Token ID to mint
     * @param amount Amount to mint
     * @param data Additional data
     */
    function mint(
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes calldata data
    ) external override onlyRole(MINTER_ROLE) nonReentrant whenNotPaused {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();
        if (!_tokenExists(tokenId)) revert TokenDoesNotExist(tokenId);

        _enforceRateLimit(tokenId, amount);
        _updateMintingState(tokenId, amount);

        _mint(to, tokenId, amount, data);

        emit TokensMinted(tokenId, to, amount);
    }

    /**
     * @notice Batch mints tokens to an address
     * @param to Recipient address
     * @param tokenIds Array of token IDs
     * @param amounts Array of amounts
     * @param data Additional data
     */
    function mintBatch(
        address to,
        uint256[] calldata tokenIds,
        uint256[] calldata amounts,
        bytes calldata data
    ) external onlyRole(MINTER_ROLE) nonReentrant whenNotPaused {
        if (to == address(0)) revert ZeroAddress();

        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (!_tokenExists(tokenIds[i]))
                revert TokenDoesNotExist(tokenIds[i]);
            if (amounts[i] == 0) revert InvalidAmount();

            _enforceRateLimit(tokenIds[i], amounts[i]);
            _updateMintingState(tokenIds[i], amounts[i]);
        }

        _mintBatch(to, tokenIds, amounts, data);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            emit TokensMinted(tokenIds[i], to, amounts[i]);
        }
    }

    // ============ Burning ============

    /**
     * @notice Burns tokens from an address (for profit distribution)
     * @param from Address to burn from
     * @param tokenId Token ID to burn
     * @param amount Amount to burn
     */
    function burn(
        address from,
        uint256 tokenId,
        uint256 amount
    ) public override(ERC1155Burnable, IPropertyBuildToken) {
        if (!hasRole(BURNER_ROLE, msg.sender) && from != msg.sender) {
            if (!isApprovedForAll(from, msg.sender)) {
                revert Unauthorized();
            }
        }

        _burn(from, tokenId, amount);

        emit TokensBurned(tokenId, from, amount);
    }

    /**
     * @notice Burns batch of tokens
     * @param from Address to burn from
     * @param tokenIds Array of token IDs
     * @param amounts Array of amounts
     */
    function burnBatch(
        address from,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) public override {
        if (!hasRole(BURNER_ROLE, msg.sender) && from != msg.sender) {
            if (!isApprovedForAll(from, msg.sender)) {
                revert Unauthorized();
            }
        }

        _burnBatch(from, tokenIds, amounts);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            emit TokensBurned(tokenIds[i], from, amounts[i]);
        }
    }

    // ============ URI Management ============

    /**
     * @notice Returns the URI for a token
     * @param tokenId Token ID to query
     * @return URI string
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        if (!_tokenExists(tokenId)) revert TokenDoesNotExist(tokenId);

        string memory tokenUri = _tokenURIs[tokenId];
        if (bytes(tokenUri).length > 0) {
            return tokenUri;
        }

        return super.uri(tokenId);
    }

    /**
     * @notice Updates the URI for a token
     * @param tokenId Token ID to update
     * @param newUri New URI string
     */
    function setURI(
        uint256 tokenId,
        string calldata newUri
    ) external override onlyRole(PROJECT_ADMIN_ROLE) {
        if (!_tokenExists(tokenId)) revert TokenDoesNotExist(tokenId);

        _tokenURIs[tokenId] = newUri;

        emit URIUpdated(tokenId, newUri);
        emit URI(newUri, tokenId);
    }

    // ============ Rate Limiting ============

    /**
     * @notice Sets rate limiting parameters for a token
     * @param tokenId Token ID to configure
     * @param maxPerBlock Maximum mintable per block
     * @param cooldownBlocks Blocks between large mints
     */
    function setMintingRateLimit(
        uint256 tokenId,
        uint256 maxPerBlock,
        uint256 cooldownBlocks
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!_tokenExists(tokenId)) revert TokenDoesNotExist(tokenId);

        _rateLimits[tokenId].maxPerBlock = maxPerBlock;
        _rateLimits[tokenId].cooldownBlocks = cooldownBlocks;

        emit MintingRateLimitUpdated(tokenId, maxPerBlock, cooldownBlocks);
    }

    /**
     * @dev Enforces rate limiting on minting
     * @param tokenId Token ID being minted
     * @param amount Amount being minted
     */
    function _enforceRateLimit(uint256 tokenId, uint256 amount) internal view {
        MintingState storage state = _mintingState[tokenId];
        RateLimitConfig storage config = _rateLimits[tokenId];

        // Check per-block limit
        uint256 mintedThisBlock = state.lastMintBlock == block.number
            ? state.mintedThisBlock
            : 0;
        if (mintedThisBlock + amount > config.maxPerBlock) {
            revert RateLimitExceeded(
                amount,
                config.maxPerBlock - mintedThisBlock
            );
        }

        // Check cooldown for large mints
        if (amount >= config.largeMintThreshold) {
            if (
                block.number < state.lastLargeMintBlock + config.cooldownBlocks
            ) {
                revert CooldownNotMet(
                    state.lastLargeMintBlock +
                        config.cooldownBlocks -
                        block.number
                );
            }
        }
    }

    /**
     * @dev Updates minting state after successful mint
     * @param tokenId Token ID minted
     * @param amount Amount minted
     */
    function _updateMintingState(uint256 tokenId, uint256 amount) internal {
        MintingState storage state = _mintingState[tokenId];
        RateLimitConfig storage config = _rateLimits[tokenId];

        state.totalMinted += amount;

        if (state.lastMintBlock == block.number) {
            state.mintedThisBlock += amount;
        } else {
            state.lastMintBlock = block.number;
            state.mintedThisBlock = amount;
        }

        if (amount >= config.largeMintThreshold) {
            state.lastLargeMintBlock = block.number;
        }
    }

    // ============ Pausability ============

    /**
     * @notice Pauses all token transfers
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses all token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ View Functions ============

    /**
     * @notice Returns total supply of a token
     * @param tokenId Token ID to query
     * @return Total supply
     */
    function totalSupply(
        uint256 tokenId
    )
        public
        view
        override(ERC1155Supply, IPropertyBuildToken)
        returns (uint256)
    {
        return super.totalSupply(tokenId);
    }

    /**
     * @notice Checks if a token exists
     * @param tokenId Token ID to check
     * @return True if token exists
     */
    function exists(
        uint256 tokenId
    ) public view override(ERC1155Supply, IPropertyBuildToken) returns (bool) {
        return _tokenExists(tokenId);
    }

    /**
     * @notice Gets the token ID for a project
     * @param projectId Project ID to query
     * @return Token ID
     */
    function getProjectTokenId(
        uint256 projectId
    ) external view override returns (uint256) {
        return _projectTokenIds[projectId];
    }

    /**
     * @notice Gets the project ID for a token
     * @param tokenId Token ID to query
     * @return Project ID
     */
    function getTokenProjectId(
        uint256 tokenId
    ) external view returns (uint256) {
        return _tokenProjectIds[tokenId];
    }

    /**
     * @notice Gets minting statistics for a token
     * @param tokenId Token ID to query
     * @return totalMinted Total tokens minted
     * @return lastMintBlock Last block with mint
     * @return mintedThisBlock Amount minted in current block
     */
    function getMintingStats(
        uint256 tokenId
    )
        external
        view
        override
        returns (
            uint256 totalMinted,
            uint256 lastMintBlock,
            uint256 mintedThisBlock
        )
    {
        MintingState storage state = _mintingState[tokenId];
        return (
            state.totalMinted,
            state.lastMintBlock,
            state.lastMintBlock == block.number ? state.mintedThisBlock : 0
        );
    }

    /**
     * @notice Gets rate limit configuration for a token
     * @param tokenId Token ID to query
     * @return maxPerBlock Maximum mintable per block
     * @return cooldownBlocks Blocks between large mints
     * @return largeMintThreshold Threshold triggering cooldown
     */
    function getRateLimitConfig(
        uint256 tokenId
    )
        external
        view
        returns (
            uint256 maxPerBlock,
            uint256 cooldownBlocks,
            uint256 largeMintThreshold
        )
    {
        RateLimitConfig storage config = _rateLimits[tokenId];
        return (
            config.maxPerBlock,
            config.cooldownBlocks,
            config.largeMintThreshold
        );
    }

    // ============ Internal Functions ============

    /**
     * @dev Checks if a token exists
     * @param tokenId Token ID to check
     * @return True if token exists
     */
    function _tokenExists(uint256 tokenId) internal view returns (bool) {
        return tokenId > 0 && tokenId < _tokenIdCounter;
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Pausable, ERC1155Supply) {
        super._update(from, to, ids, values);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

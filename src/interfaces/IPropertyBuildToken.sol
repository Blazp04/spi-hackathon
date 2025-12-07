// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IPropertyBuildToken
 * @notice Interface for the PropertyBuild ERC1155 token contract
 */
interface IPropertyBuildToken {
    // Events
    event ProjectTokenCreated(
        uint256 indexed projectId,
        uint256 indexed tokenId,
        string uri
    );
    event TokensMinted(
        uint256 indexed tokenId,
        address indexed to,
        uint256 amount
    );
    event TokensBurned(
        uint256 indexed tokenId,
        address indexed from,
        uint256 amount
    );
    event URIUpdated(uint256 indexed tokenId, string newUri);
    event MintingRateLimitUpdated(
        uint256 indexed tokenId,
        uint256 maxPerBlock,
        uint256 cooldown
    );

    // View functions
    function totalSupply(uint256 tokenId) external view returns (uint256);
    function exists(uint256 tokenId) external view returns (bool);
    function getProjectTokenId(
        uint256 projectId
    ) external view returns (uint256);
    function getMintingStats(
        uint256 tokenId
    )
        external
        view
        returns (
            uint256 totalMinted,
            uint256 lastMintBlock,
            uint256 mintedThisBlock
        );

    // Token management
    function createProjectToken(
        uint256 projectId,
        string calldata tokenUri
    ) external returns (uint256);
    function mint(
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes calldata data
    ) external;
    function burn(address from, uint256 tokenId, uint256 amount) external;
    function setURI(uint256 tokenId, string calldata newUri) external;
    function setMintingRateLimit(
        uint256 tokenId,
        uint256 maxPerBlock,
        uint256 cooldownBlocks
    ) external;
}

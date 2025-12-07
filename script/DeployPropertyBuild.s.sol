// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PropertyBuildToken} from "../src/PropertyBuildToken.sol";
import {ProjectLifecycle} from "../src/ProjectLifecycle.sol";
import {Escrow} from "../src/Escrow.sol";
import {LiquidityPool} from "../src/LiquidityPool.sol";
import {ProfitDistribution} from "../src/ProfitDistribution.sol";

/**
 * @title DeployPropertyBuild
 * @notice Deployment script for PropertyBuild platform contracts
 * @dev Run with: forge script script/DeployPropertyBuild.s.sol:DeployPropertyBuild --rpc-url $RPC_URL --broadcast --verify
 */
contract DeployPropertyBuild is Script {
    // Deployed contract addresses
    PropertyBuildToken public token;
    ProjectLifecycle public lifecycle;
    Escrow public escrow;
    LiquidityPool public liquidityPool;
    ProfitDistribution public profitDistribution;

    // Configuration
    string public constant DEFAULT_URI =
        "https://propertybuild.io/api/metadata/{id}.json";

    function run() external {
        // Get deployment private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Get configuration from environment (or use defaults for testing)
        address admin = vm.envOr("ADMIN_ADDRESS", deployer);
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);
        address paymentToken = vm.envAddress("PAYMENT_TOKEN"); // USDC/USDT address

        console.log("Deploying PropertyBuild Platform...");
        console.log("Deployer:", deployer);
        console.log("Admin:", admin);
        console.log("Treasury:", treasury);
        console.log("Payment Token:", paymentToken);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy PropertyBuildToken
        token = new PropertyBuildToken(DEFAULT_URI, admin);
        console.log("PropertyBuildToken deployed at:", address(token));

        // 2. Deploy Escrow
        escrow = new Escrow(paymentToken, treasury, admin);
        console.log("Escrow deployed at:", address(escrow));

        // 3. Deploy ProjectLifecycle
        lifecycle = new ProjectLifecycle(address(token), paymentToken, admin);
        console.log("ProjectLifecycle deployed at:", address(lifecycle));

        // 4. Deploy LiquidityPool
        liquidityPool = new LiquidityPool(
            address(token),
            paymentToken,
            treasury,
            admin
        );
        console.log("LiquidityPool deployed at:", address(liquidityPool));

        // 5. Deploy ProfitDistribution
        profitDistribution = new ProfitDistribution(
            address(token),
            address(lifecycle),
            paymentToken,
            treasury,
            admin
        );
        console.log(
            "ProfitDistribution deployed at:",
            address(profitDistribution)
        );

        // 6. Configure contract connections
        console.log("Configuring contract connections...");

        // Set escrow in lifecycle
        lifecycle.setEscrow(address(escrow));

        // Grant LIFECYCLE_ROLE to lifecycle in escrow
        escrow.setLifecycleContract(address(lifecycle));

        // Grant MINTER_ROLE to lifecycle in token
        token.grantRole(token.MINTER_ROLE(), address(lifecycle));

        // Grant BURNER_ROLE to profitDistribution in token
        token.grantRole(token.BURNER_ROLE(), address(profitDistribution));

        // Grant BURNER_ROLE to lifecycle for refunds
        token.grantRole(token.BURNER_ROLE(), address(lifecycle));

        // Grant PROJECT_ADMIN_ROLE to lifecycle in token
        token.grantRole(token.PROJECT_ADMIN_ROLE(), address(lifecycle));

        vm.stopBroadcast();

        // Output deployment summary
        console.log("\n========== Deployment Summary ==========");
        console.log("PropertyBuildToken:", address(token));
        console.log("ProjectLifecycle:", address(lifecycle));
        console.log("Escrow:", address(escrow));
        console.log("LiquidityPool:", address(liquidityPool));
        console.log("ProfitDistribution:", address(profitDistribution));
        console.log("==========================================\n");
    }
}

/**
 * @title DeployPropertyBuildLocal
 * @notice Deployment script for local testing with mock tokens
 * @dev Run with: forge script script/DeployPropertyBuild.s.sol:DeployPropertyBuildLocal --rpc-url http://localhost:8545 --broadcast
 */
contract DeployPropertyBuildLocal is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(
                0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
            )
        );
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying PropertyBuild Platform (Local)...");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy mock USDC for testing
        MockUSDC usdc = new MockUSDC();
        console.log("Mock USDC deployed at:", address(usdc));

        // Deploy PropertyBuildToken
        PropertyBuildToken token = new PropertyBuildToken(
            "https://propertybuild.io/api/metadata/{id}.json",
            deployer
        );
        console.log("PropertyBuildToken deployed at:", address(token));

        // Deploy Escrow
        Escrow escrow = new Escrow(address(usdc), deployer, deployer);
        console.log("Escrow deployed at:", address(escrow));

        // Deploy ProjectLifecycle
        ProjectLifecycle lifecycle = new ProjectLifecycle(
            address(token),
            address(usdc),
            deployer
        );
        console.log("ProjectLifecycle deployed at:", address(lifecycle));

        // Deploy LiquidityPool
        LiquidityPool liquidityPool = new LiquidityPool(
            address(token),
            address(usdc),
            deployer,
            deployer
        );
        console.log("LiquidityPool deployed at:", address(liquidityPool));

        // Deploy ProfitDistribution
        ProfitDistribution profitDistribution = new ProfitDistribution(
            address(token),
            address(lifecycle),
            address(usdc),
            deployer,
            deployer
        );
        console.log(
            "ProfitDistribution deployed at:",
            address(profitDistribution)
        );

        // Configure connections
        lifecycle.setEscrow(address(escrow));
        escrow.setLifecycleContract(address(lifecycle));
        token.grantRole(token.MINTER_ROLE(), address(lifecycle));
        token.grantRole(token.BURNER_ROLE(), address(profitDistribution));
        token.grantRole(token.BURNER_ROLE(), address(lifecycle));
        token.grantRole(token.PROJECT_ADMIN_ROLE(), address(lifecycle));

        // Mint some USDC to deployer for testing
        usdc.mint(deployer, 1_000_000 * 10 ** 6);

        vm.stopBroadcast();

        console.log("\n========== Local Deployment Summary ==========");
        console.log("MockUSDC:", address(usdc));
        console.log("PropertyBuildToken:", address(token));
        console.log("ProjectLifecycle:", address(lifecycle));
        console.log("Escrow:", address(escrow));
        console.log("LiquidityPool:", address(liquidityPool));
        console.log("ProfitDistribution:", address(profitDistribution));
        console.log("================================================\n");
    }
}

/**
 * @title MockUSDC
 * @notice Simple mock USDC for testing
 */
contract MockUSDC {
    string public constant NAME = "Mock USDC";
    string public constant SYMBOL = "USDC";
    uint8 public constant DECIMALS = 6;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    uint256 public totalSupply;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(
            allowance[from][msg.sender] >= amount,
            "Insufficient allowance"
        );

        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;

        emit Transfer(from, to, amount);
        return true;
    }
}

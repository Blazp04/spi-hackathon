// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PropertyBuildToken} from "../src/PropertyBuildToken.sol";
import {ProjectLifecycle, IProjectLifecycle} from "../src/ProjectLifecycle.sol";
import {Escrow} from "../src/Escrow.sol";
import {LiquidityPool} from "../src/LiquidityPool.sol";
import {ProfitDistribution} from "../src/ProfitDistribution.sol";
import {MockUSDC} from "../script/DeployPropertyBuild.s.sol";

/**
 * @title PropertyBuildTest
 * @notice Comprehensive tests for PropertyBuild platform
 */
contract PropertyBuildTest is Test {
    // Contracts
    PropertyBuildToken public token;
    ProjectLifecycle public lifecycle;
    Escrow public escrow;
    LiquidityPool public liquidityPool;
    ProfitDistribution public profitDistribution;
    MockUSDC public usdc;

    // Test addresses
    address public admin = address(1);
    address public treasury = address(2);
    address public contractor = address(3);
    address public verifier1 = address(4);
    address public verifier2 = address(5);
    address public investor1 = address(6);
    address public investor2 = address(7);
    address public investor3 = address(8);

    // Test constants
    uint256 public constant HARD_CAP = 1_000_000 * 10 ** 6; // 1M USDC
    uint256 public constant SOFT_CAP = 500_000 * 10 ** 6; // 500K USDC
    uint256 public constant TOKEN_PRICE = 100 * 10 ** 6; // 100 USDC per token
    uint256 public constant INVESTMENT_AMOUNT = 100_000 * 10 ** 6; // 100K USDC

    function setUp() public {
        vm.startPrank(admin);

        // Deploy mock USDC
        usdc = new MockUSDC();

        // Deploy PropertyBuildToken
        token = new PropertyBuildToken(
            "https://propertybuild.io/api/metadata/{id}.json",
            admin
        );

        // Deploy Escrow
        escrow = new Escrow(address(usdc), treasury, admin);

        // Deploy ProjectLifecycle
        lifecycle = new ProjectLifecycle(address(token), address(usdc), admin);

        // Deploy LiquidityPool
        liquidityPool = new LiquidityPool(
            address(token),
            address(usdc),
            treasury,
            admin
        );

        // Deploy ProfitDistribution
        profitDistribution = new ProfitDistribution(
            address(token),
            address(lifecycle),
            address(usdc),
            treasury,
            admin
        );

        // Configure connections
        lifecycle.setEscrow(address(escrow));
        escrow.setLifecycleContract(address(lifecycle));
        token.grantRole(token.MINTER_ROLE(), address(lifecycle));
        token.grantRole(token.BURNER_ROLE(), address(profitDistribution));
        token.grantRole(token.BURNER_ROLE(), address(lifecycle)); // For refunds
        token.grantRole(token.PROJECT_ADMIN_ROLE(), address(lifecycle));

        // Mint USDC to investors
        usdc.mint(investor1, 10_000_000 * 10 ** 6);
        usdc.mint(investor2, 10_000_000 * 10 ** 6);
        usdc.mint(investor3, 10_000_000 * 10 ** 6);

        vm.stopPrank();
    }

    // ============ Token Tests ============

    function test_TokenDeployment() public view {
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(token.hasRole(token.PAUSER_ROLE(), admin));
        assertTrue(token.hasRole(token.PROJECT_ADMIN_ROLE(), admin));
    }

    function test_CreateProjectToken() public {
        vm.prank(admin);
        uint256 tokenId = token.createProjectToken(1, "ipfs://test");

        assertEq(tokenId, 1);
        assertEq(token.getProjectTokenId(1), 1);
        assertTrue(token.exists(1));
    }

    function test_TokenPause() public {
        vm.startPrank(admin);
        token.createProjectToken(1, "ipfs://test");
        token.grantRole(token.MINTER_ROLE(), admin);
        token.mint(investor1, 1, 1000, "");

        token.pause();

        vm.expectRevert();
        token.mint(investor1, 1, 1000, "");

        token.unpause();
        token.mint(investor1, 1, 1000, "");
        vm.stopPrank();
    }

    // ============ Project Lifecycle Tests ============

    function test_CreateProject() public {
        vm.prank(admin);
        uint256 projectId = lifecycle.createProject(
            HARD_CAP,
            SOFT_CAP,
            TOKEN_PRICE,
            contractor,
            block.timestamp + 30 days,
            block.timestamp + 365 days,
            1000, // 10% contingency
            500, // 5% platform fee
            "ipfs://project-metadata"
        );

        assertEq(projectId, 1);

        IProjectLifecycle.Project memory project = lifecycle.getProject(1);
        assertEq(project.hardCap, HARD_CAP);
        assertEq(project.softCap, SOFT_CAP);
        assertEq(project.contractor, contractor);
        assertEq(
            uint256(project.status),
            uint256(IProjectLifecycle.ProjectStatus.MINTING)
        );
    }

    function test_AddMilestones() public {
        _createTestProject();

        vm.startPrank(admin);
        lifecycle.addMilestone(1, "Foundation", 2000, 2); // 20%
        lifecycle.addMilestone(1, "Structure", 3000, 2); // 30%
        lifecycle.addMilestone(1, "Finishing", 3500, 2); // 35%
        vm.stopPrank();

        IProjectLifecycle.Milestone memory m1 = lifecycle.getMilestone(1, 0);
        assertEq(m1.budgetPercent, 2000);
        assertEq(m1.verificationThreshold, 2);
    }

    function test_Investment() public {
        _createTestProject();
        _addTestMilestones();

        vm.startPrank(investor1);
        usdc.approve(address(lifecycle), INVESTMENT_AMOUNT);
        lifecycle.invest(1, INVESTMENT_AMOUNT);
        vm.stopPrank();

        IProjectLifecycle.Project memory project = lifecycle.getProject(1);
        assertEq(project.totalRaised, INVESTMENT_AMOUNT);

        uint256 expectedTokens = (INVESTMENT_AMOUNT * 1e18) / TOKEN_PRICE;
        assertEq(lifecycle.getInvestorBalance(1, investor1), expectedTokens);
    }

    function test_StartBuilding() public {
        _createTestProject();
        _addTestMilestones();
        _investToSoftCap();

        vm.prank(admin);
        lifecycle.startBuilding(1);

        IProjectLifecycle.Project memory project = lifecycle.getProject(1);
        assertEq(
            uint256(project.status),
            uint256(IProjectLifecycle.ProjectStatus.BUILDING)
        );
    }

    function test_SubmitAndVerifyMilestone() public {
        _createTestProject();
        _addTestMilestones();
        _investToSoftCap();
        _addVerifiers();

        vm.prank(admin);
        lifecycle.startBuilding(1);

        // Contractor submits milestone
        vm.prank(contractor);
        lifecycle.submitMilestone(1, 0, "ipfs://milestone-docs");

        IProjectLifecycle.Milestone memory milestone = lifecycle.getMilestone(
            1,
            0
        );
        assertEq(
            uint256(milestone.status),
            uint256(IProjectLifecycle.MilestoneStatus.SUBMITTED)
        );

        // Verifiers verify
        vm.prank(verifier1);
        lifecycle.verifyMilestone(1, 0);

        vm.prank(verifier2);
        lifecycle.verifyMilestone(1, 0);

        milestone = lifecycle.getMilestone(1, 0);
        assertEq(
            uint256(milestone.status),
            uint256(IProjectLifecycle.MilestoneStatus.PAID)
        );
    }

    function test_RefundOnCancellation() public {
        _createTestProject();
        _addTestMilestones();

        // Invest
        vm.startPrank(investor1);
        usdc.approve(address(lifecycle), INVESTMENT_AMOUNT);
        lifecycle.invest(1, INVESTMENT_AMOUNT);
        vm.stopPrank();

        uint256 balanceBefore = usdc.balanceOf(investor1);

        // Cancel project
        vm.prank(admin);
        lifecycle.cancelProject(1);

        // Claim refund
        vm.prank(investor1);
        lifecycle.claimRefund(1);

        uint256 balanceAfter = usdc.balanceOf(investor1);

        // Should get refund minus platform fee
        IProjectLifecycle.Project memory project = lifecycle.getProject(1);
        uint256 expectedRefund = INVESTMENT_AMOUNT -
            ((INVESTMENT_AMOUNT * project.platformFeePercent) / 10000);
        assertEq(balanceAfter - balanceBefore, expectedRefund);
    }

    // ============ Escrow Tests ============

    function test_EscrowDeposit() public {
        _createTestProject();
        _addTestMilestones();

        vm.startPrank(investor1);
        usdc.approve(address(lifecycle), INVESTMENT_AMOUNT);
        lifecycle.invest(1, INVESTMENT_AMOUNT);
        vm.stopPrank();

        assertEq(escrow.getProjectBalance(1), INVESTMENT_AMOUNT);
        assertEq(escrow.getInvestorDeposit(1, investor1), INVESTMENT_AMOUNT);
    }

    // ============ Liquidity Pool Tests ============

    function test_CreatePool() public {
        _createTestProject();
        _addTestMilestones();
        _investToSoftCap();

        vm.prank(admin);
        lifecycle.startBuilding(1);

        // Roll forward blocks to avoid rate limit cooldown from previous mints
        vm.roll(block.number + 20);

        // Admin needs to get tokens and approve
        vm.startPrank(admin);
        token.grantRole(token.MINTER_ROLE(), admin);
        token.mint(admin, 1, 100_000 * 1e18, "");
        usdc.mint(admin, 100_000 * 10 ** 6);

        token.setApprovalForAll(address(liquidityPool), true);
        usdc.approve(address(liquidityPool), 100_000 * 10 ** 6);

        liquidityPool.createPool(1, 100_000 * 1e18, 100_000 * 10 ** 6);
        vm.stopPrank();

        (uint256 tokenReserve, uint256 stableReserve) = liquidityPool
            .getPoolReserves(1);
        assertEq(tokenReserve, 100_000 * 1e18);
        assertEq(stableReserve, 100_000 * 10 ** 6);
    }

    // ============ Helper Functions ============

    function _createTestProject() internal {
        vm.prank(admin);
        lifecycle.createProject(
            HARD_CAP,
            SOFT_CAP,
            TOKEN_PRICE,
            contractor,
            block.timestamp + 30 days,
            block.timestamp + 365 days,
            1000, // 10% contingency
            500, // 5% platform fee
            "ipfs://project-metadata"
        );
    }

    function _addTestMilestones() internal {
        vm.startPrank(admin);
        lifecycle.addMilestone(1, "Foundation", 2000, 2);
        lifecycle.addMilestone(1, "Structure", 3000, 2);
        lifecycle.addMilestone(1, "Finishing", 3500, 2);
        vm.stopPrank();
    }

    function _investToSoftCap() internal {
        vm.startPrank(investor1);
        usdc.approve(address(lifecycle), SOFT_CAP);
        lifecycle.invest(1, SOFT_CAP);
        vm.stopPrank();
    }

    function _addVerifiers() internal {
        vm.startPrank(admin);
        lifecycle.addProjectVerifier(1, verifier1);
        lifecycle.addProjectVerifier(1, verifier2);
        vm.stopPrank();
    }
}

/**
 * @title PropertyBuildIntegrationTest
 * @notice End-to-end integration tests
 */
contract PropertyBuildIntegrationTest is PropertyBuildTest {
    function test_FullProjectLifecycle() public {
        // 1. Create project
        _createTestProject();
        _addTestMilestones();
        _addVerifiers();

        // 2. Multiple investors invest
        vm.startPrank(investor1);
        usdc.approve(address(lifecycle), 300_000 * 10 ** 6);
        lifecycle.invest(1, 300_000 * 10 ** 6);
        vm.stopPrank();

        vm.startPrank(investor2);
        usdc.approve(address(lifecycle), 200_000 * 10 ** 6);
        lifecycle.invest(1, 200_000 * 10 ** 6);
        vm.stopPrank();

        // 3. Start building
        vm.prank(admin);
        lifecycle.startBuilding(1);

        // 4. Complete all milestones
        _completeMilestone(0);
        _completeMilestone(1);
        _completeMilestone(2);

        // 5. Start trading and final sale
        vm.prank(admin);
        lifecycle.startTrading(1);

        vm.prank(admin);
        lifecycle.startFinalSale(1);

        // 6. Complete project
        vm.prank(admin);
        lifecycle.completeProject(1, 1_500_000 * 10 ** 6); // 1.5M sale price

        IProjectLifecycle.Project memory project = lifecycle.getProject(1);
        assertEq(
            uint256(project.status),
            uint256(IProjectLifecycle.ProjectStatus.COMPLETED)
        );
    }

    function _completeMilestone(uint256 index) internal {
        vm.prank(contractor);
        lifecycle.submitMilestone(1, index, "ipfs://docs");

        vm.prank(verifier1);
        lifecycle.verifyMilestone(1, index);

        vm.prank(verifier2);
        lifecycle.verifyMilestone(1, index);
    }
}

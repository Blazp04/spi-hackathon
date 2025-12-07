// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IEscrow
 * @notice Interface for the Escrow contract managing project funds
 */
interface IEscrow {
    // Events
    event FundsDeposited(
        uint256 indexed projectId,
        address indexed depositor,
        uint256 amount
    );
    event MilestonePaymentReleased(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        address indexed contractor,
        uint256 amount
    );
    event ContingencyUsed(
        uint256 indexed projectId,
        uint256 amount,
        string reason
    );
    event RefundProcessed(
        uint256 indexed projectId,
        address indexed investor,
        uint256 amount
    );
    event PlatformFeeCollected(uint256 indexed projectId, uint256 amount);
    event EmergencyWithdrawal(
        uint256 indexed projectId,
        address indexed to,
        uint256 amount
    );

    // View functions
    function getProjectBalance(
        uint256 projectId
    ) external view returns (uint256);
    function getContingencyBalance(
        uint256 projectId
    ) external view returns (uint256);
    function getMilestonePayment(
        uint256 projectId,
        uint256 milestoneIndex
    ) external view returns (uint256);
    function getTotalPaidOut(uint256 projectId) external view returns (uint256);
    function getInvestorDeposit(
        uint256 projectId,
        address investor
    ) external view returns (uint256);

    // Fund management
    function deposit(
        uint256 projectId,
        address investor,
        uint256 amount
    ) external;
    function releaseMilestonePayment(
        uint256 projectId,
        uint256 milestoneIndex,
        address contractor,
        uint256 amount
    ) external;
    function useContingency(
        uint256 projectId,
        uint256 amount,
        string calldata reason
    ) external;
    function processRefund(
        uint256 projectId,
        address investor,
        uint256 amount
    ) external;
    function collectPlatformFee(uint256 projectId, uint256 amount) external;
    function emergencyWithdraw(
        uint256 projectId,
        address to,
        uint256 amount
    ) external;
    function getRemainingFunds(
        uint256 projectId
    ) external view returns (uint256);
}

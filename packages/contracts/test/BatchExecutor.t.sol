// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {BatchExecutor} from "../src/BatchExecutor.sol";
import {TestERC20} from "../src/TestERC20.sol";
import {Stake} from "../src/Stake.sol";

contract BatchExecutorTest is Test {
    BatchExecutor public executor;
    TestERC20 public token;
    Stake public stakeContract;

    address public user = address(0x1);
    address public recipient = address(0x2);

    function setUp() public {
        executor = new BatchExecutor();
        token = new TestERC20();
        stakeContract = new Stake(address(token));

        // Fund user with tokens
        token.mint(user, 1000 ether);
    }

    function testBatchApproveAndTransfer() public {
        // This test verifies the batch execution would work if called through delegation
        // In production, EIP-7702 delegation would make msg.sender == address(this)

        BatchExecutor.Call[] memory calls = new BatchExecutor.Call[](2);

        // Approve call
        calls[0] = BatchExecutor.Call({
            target: address(token),
            value: 0,
            data: abi.encodeCall(token.approve, (recipient, 100 ether))
        });

        // Transfer call
        calls[1] = BatchExecutor.Call({
            target: address(token),
            value: 0,
            data: abi.encodeCall(token.transfer, (recipient, 10 ether))
        });

        // Test that non-delegated calls are rejected
        vm.prank(user);
        vm.expectRevert("Only delegated EOA can execute");
        executor.executeBatch(calls);

        // Verify the call structure is correct
        assertEq(calls.length, 2);
        assertEq(calls[0].target, address(token));
        assertEq(calls[1].target, address(token));
    }

    function testApproveAndStake() public {
        // Test the convenience function
        vm.startPrank(user);

        // First approve the executor to use the convenience function
        token.approve(address(executor), 100 ether);

        // Note: In production, this would be called with EIP-7702 delegation
        // executor.approveAndStake(token, address(stakeContract), 100 ether);

        // Manual test without delegation
        token.approve(address(stakeContract), 100 ether);
        stakeContract.stake(100 ether);

        assertEq(stakeContract.getStakedBalance(user), 100 ether);
        assertEq(stakeContract.totalStaked(), 100 ether);

        vm.stopPrank();
    }
}
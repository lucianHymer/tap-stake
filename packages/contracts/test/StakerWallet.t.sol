// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {StakerWallet} from "../src/StakerWallet.sol";
import {StakeChoicesERC6909} from "../src/StakeChoicesERC6909.sol";
import {StakeChoicesFactory} from "../src/StakeChoicesFactory.sol";
import {TestERC20} from "../src/TestERC20.sol";

contract StakerWalletTest is Test {
    StakerWallet public wallet;
    StakeChoicesERC6909 public session;
    StakeChoicesFactory public factory;
    TestERC20 public token;

    address public user = address(0x1234);
    address public relayer = address(0x9999);
    address public attacker = address(0x6666);

    function setUp() public {
        token = new TestERC20();

        // Deploy factory and session
        factory = new StakeChoicesFactory();
        address sessionAddr = factory.deployToken(address(token), "Test Session");
        session = StakeChoicesERC6909(sessionAddr);

        // Deploy wallet with reasonable limits
        wallet = new StakerWallet(
            address(token),
            address(session),
            relayer,
            100 ether // MAX_STAKE_PER_TX
        );

        // Mint tokens to user
        token.mint(user, 1000 ether);
    }

    function testImmutableConfig() public view {
        assertEq(wallet.tokenAddress(), address(token));
        assertEq(wallet.stakeChoicesAddress(), address(session));
        assertEq(wallet.relayer(), relayer);
        assertEq(wallet.maxStakePerTx(), 100 ether);
    }

    function testAddStakesSingleChoice() public {
        // Setup: give wallet some tokens
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = 1;
        amounts[0] = 50 ether;

        // Only relayer can call
        vm.prank(relayer);
        wallet.addStakes(choiceIds, amounts);

        // Verify stakes were added
        assertEq(session.balanceOf(address(wallet), 1), 50 ether);
        assertEq(session.totalSupply(1), 50 ether);
    }

    function testAddStakesMultipleChoices() public {
        // Setup: give wallet some tokens
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory choiceIds = new uint256[](3);
        uint256[] memory amounts = new uint256[](3);
        choiceIds[0] = 1;
        choiceIds[1] = 2;
        choiceIds[2] = 3;
        amounts[0] = 20 ether;
        amounts[1] = 30 ether;
        amounts[2] = 40 ether;

        // Relayer executes
        vm.prank(relayer);
        wallet.addStakes(choiceIds, amounts);

        // Verify all stakes were added
        assertEq(session.balanceOf(address(wallet), 1), 20 ether);
        assertEq(session.balanceOf(address(wallet), 2), 30 ether);
        assertEq(session.balanceOf(address(wallet), 3), 40 ether);
    }

    function testAddStakesOnlyRelayer() public {
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = 1;
        amounts[0] = 50 ether;

        // Non-relayer cannot call
        vm.prank(attacker);
        vm.expectRevert(StakerWallet.OnlyRelayer.selector);
        wallet.addStakes(choiceIds, amounts);

        // User cannot call
        vm.prank(user);
        vm.expectRevert(StakerWallet.OnlyRelayer.selector);
        wallet.addStakes(choiceIds, amounts);
    }

    function testAddStakesAmountTooHigh() public {
        vm.prank(user);
        token.transfer(address(wallet), 200 ether);

        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = 1;
        amounts[0] = 101 ether; // Over MAX_STAKE_PER_TX

        vm.prank(relayer);
        vm.expectRevert(StakerWallet.AmountTooHigh.selector);
        wallet.addStakes(choiceIds, amounts);
    }

    function testAddStakesMultipleChoicesAmountTooHigh() public {
        vm.prank(user);
        token.transfer(address(wallet), 200 ether);

        uint256[] memory choiceIds = new uint256[](3);
        uint256[] memory amounts = new uint256[](3);
        choiceIds[0] = 1;
        choiceIds[1] = 2;
        choiceIds[2] = 3;
        amounts[0] = 40 ether;
        amounts[1] = 40 ether;
        amounts[2] = 30 ether; // Total = 110 ether, over limit

        vm.prank(relayer);
        vm.expectRevert(StakerWallet.AmountTooHigh.selector);
        wallet.addStakes(choiceIds, amounts);
    }

    function testRemoveStakes() public {
        // First add stakes
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = 1;
        amounts[0] = 50 ether;

        vm.prank(relayer);
        wallet.addStakes(choiceIds, amounts);

        // Now remove stakes
        uint256 walletBalanceBefore = token.balanceOf(address(wallet));

        vm.prank(relayer);
        wallet.removeStakes(choiceIds, amounts);

        // Verify stakes were removed
        assertEq(session.balanceOf(address(wallet), 1), 0);
        assertEq(token.balanceOf(address(wallet)), walletBalanceBefore + 50 ether);
    }

    function testRemoveStakesMultipleChoices() public {
        // First add stakes
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory choiceIds = new uint256[](3);
        uint256[] memory amounts = new uint256[](3);
        choiceIds[0] = 1;
        choiceIds[1] = 2;
        choiceIds[2] = 3;
        amounts[0] = 20 ether;
        amounts[1] = 30 ether;
        amounts[2] = 40 ether;

        vm.prank(relayer);
        wallet.addStakes(choiceIds, amounts);

        // Remove partial stakes
        uint256[] memory removeIds = new uint256[](2);
        uint256[] memory removeAmounts = new uint256[](2);
        removeIds[0] = 1;
        removeIds[1] = 2;
        removeAmounts[0] = 10 ether;
        removeAmounts[1] = 15 ether;

        vm.prank(relayer);
        wallet.removeStakes(removeIds, removeAmounts);

        // Verify partial removal
        assertEq(session.balanceOf(address(wallet), 1), 10 ether);
        assertEq(session.balanceOf(address(wallet), 2), 15 ether);
        assertEq(session.balanceOf(address(wallet), 3), 40 ether);
    }

    function testRemoveStakesOnlyRelayer() public {
        // First add stakes
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = 1;
        amounts[0] = 50 ether;

        vm.prank(relayer);
        wallet.addStakes(choiceIds, amounts);

        // Non-relayer cannot remove
        vm.prank(attacker);
        vm.expectRevert(StakerWallet.OnlyRelayer.selector);
        wallet.removeStakes(choiceIds, amounts);
    }

    function testAddStakesExactLimit() public {
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = 1;
        amounts[0] = 100 ether; // Exactly at limit

        // Should succeed
        vm.prank(relayer);
        wallet.addStakes(choiceIds, amounts);

        assertEq(session.balanceOf(address(wallet), 1), 100 ether);
    }

    function testAddStakesZeroAmount() public {
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = 1;
        amounts[0] = 0;

        // Should succeed (total is 0, under limit)
        vm.prank(relayer);
        wallet.addStakes(choiceIds, amounts);
    }

    function testMultipleSessionsSupport() public {
        // Deploy second session via factory
        address session2Addr = factory.deployToken(address(token), "Second Session");
        StakeChoicesERC6909 session2 = StakeChoicesERC6909(session2Addr);

        // Deploy second wallet for second session
        StakerWallet wallet2 = new StakerWallet(address(token), address(session2), relayer, 100 ether);

        // Transfer tokens to both wallets
        vm.startPrank(user);
        token.transfer(address(wallet), 100 ether);
        token.transfer(address(wallet2), 100 ether);
        vm.stopPrank();

        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = 1;
        amounts[0] = 30 ether;

        // Add stakes to first session
        vm.prank(relayer);
        wallet.addStakes(choiceIds, amounts);

        amounts[0] = 40 ether;
        // Add stakes to second session using second wallet
        vm.prank(relayer);
        wallet2.addStakes(choiceIds, amounts);

        // Verify stakes in both sessions
        assertEq(session.balanceOf(address(wallet), 1), 30 ether);
        assertEq(session2.balanceOf(address(wallet2), 1), 40 ether);
    }

    function testApprovalIsExactAmount() public {
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory choiceIds = new uint256[](2);
        uint256[] memory amounts = new uint256[](2);
        choiceIds[0] = 1;
        choiceIds[1] = 2;
        amounts[0] = 30 ether;
        amounts[1] = 20 ether;

        vm.prank(relayer);
        wallet.addStakes(choiceIds, amounts);

        // Verify no leftover approval (should be 0 after addStakes completes)
        assertEq(token.allowance(address(wallet), address(session)), 0);
    }
}

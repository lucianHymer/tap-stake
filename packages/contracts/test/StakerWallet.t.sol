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
        assertEq(wallet.maxAmountPerTx(), 100 ether);
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

    // ============ updateStakes() Tests ============

    function testUpdateStakesHappyPath() public {
        // Setup: give wallet tokens and add initial stakes
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory oldChoiceIds = new uint256[](2);
        uint256[] memory oldAmounts = new uint256[](2);
        oldChoiceIds[0] = 1;
        oldChoiceIds[1] = 2;
        oldAmounts[0] = 30 ether;
        oldAmounts[1] = 20 ether;

        vm.prank(relayer);
        wallet.addStakes(oldChoiceIds, oldAmounts);

        // Update stakes: move from choices 1,2 to choices 3,4,5
        uint256[] memory newChoiceIds = new uint256[](3);
        uint256[] memory newAmounts = new uint256[](3);
        newChoiceIds[0] = 3;
        newChoiceIds[1] = 4;
        newChoiceIds[2] = 5;
        newAmounts[0] = 20 ether;
        newAmounts[1] = 15 ether;
        newAmounts[2] = 15 ether;

        vm.prank(relayer);
        wallet.updateStakes(oldChoiceIds, oldAmounts, newChoiceIds, newAmounts);

        // Verify old stakes removed
        assertEq(session.balanceOf(address(wallet), 1), 0);
        assertEq(session.balanceOf(address(wallet), 2), 0);

        // Verify new stakes added
        assertEq(session.balanceOf(address(wallet), 3), 20 ether);
        assertEq(session.balanceOf(address(wallet), 4), 15 ether);
        assertEq(session.balanceOf(address(wallet), 5), 15 ether);
    }

    function testUpdateStakesEmptyOldStakes() public {
        // First time staking - empty old stakes
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory oldChoiceIds = new uint256[](0);
        uint256[] memory oldAmounts = new uint256[](0);
        uint256[] memory newChoiceIds = new uint256[](2);
        uint256[] memory newAmounts = new uint256[](2);
        newChoiceIds[0] = 1;
        newChoiceIds[1] = 2;
        newAmounts[0] = 40 ether;
        newAmounts[1] = 60 ether;

        vm.prank(relayer);
        wallet.updateStakes(oldChoiceIds, oldAmounts, newChoiceIds, newAmounts);

        // Verify new stakes added
        assertEq(session.balanceOf(address(wallet), 1), 40 ether);
        assertEq(session.balanceOf(address(wallet), 2), 60 ether);
    }

    function testUpdateStakesFullWithdrawal() public {
        // Setup: add initial stakes
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory oldChoiceIds = new uint256[](2);
        uint256[] memory oldAmounts = new uint256[](2);
        oldChoiceIds[0] = 1;
        oldChoiceIds[1] = 2;
        oldAmounts[0] = 50 ether;
        oldAmounts[1] = 50 ether;

        vm.prank(relayer);
        wallet.addStakes(oldChoiceIds, oldAmounts);

        // Update to empty new stakes (full withdrawal)
        uint256[] memory newChoiceIds = new uint256[](0);
        uint256[] memory newAmounts = new uint256[](0);

        uint256 walletBalanceBefore = token.balanceOf(address(wallet));

        vm.prank(relayer);
        wallet.updateStakes(oldChoiceIds, oldAmounts, newChoiceIds, newAmounts);

        // Verify all stakes removed
        assertEq(session.balanceOf(address(wallet), 1), 0);
        assertEq(session.balanceOf(address(wallet), 2), 0);

        // Verify tokens returned to wallet
        assertEq(token.balanceOf(address(wallet)), walletBalanceBefore + 100 ether);
    }

    function testUpdateStakesOnlyRelayer() public {
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory oldChoiceIds = new uint256[](0);
        uint256[] memory oldAmounts = new uint256[](0);
        uint256[] memory newChoiceIds = new uint256[](1);
        uint256[] memory newAmounts = new uint256[](1);
        newChoiceIds[0] = 1;
        newAmounts[0] = 50 ether;

        // Non-relayer cannot call
        vm.prank(attacker);
        vm.expectRevert(StakerWallet.OnlyRelayer.selector);
        wallet.updateStakes(oldChoiceIds, oldAmounts, newChoiceIds, newAmounts);

        // User cannot call
        vm.prank(user);
        vm.expectRevert(StakerWallet.OnlyRelayer.selector);
        wallet.updateStakes(oldChoiceIds, oldAmounts, newChoiceIds, newAmounts);
    }

    function testUpdateStakesAmountTooHigh() public {
        vm.prank(user);
        token.transfer(address(wallet), 200 ether);

        uint256[] memory oldChoiceIds = new uint256[](0);
        uint256[] memory oldAmounts = new uint256[](0);
        uint256[] memory newChoiceIds = new uint256[](1);
        uint256[] memory newAmounts = new uint256[](1);
        newChoiceIds[0] = 1;
        newAmounts[0] = 101 ether; // Over maxAmountPerTx

        vm.prank(relayer);
        vm.expectRevert(StakerWallet.AmountTooHigh.selector);
        wallet.updateStakes(oldChoiceIds, oldAmounts, newChoiceIds, newAmounts);
    }

    function testUpdateStakesExactLimit() public {
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory oldChoiceIds = new uint256[](0);
        uint256[] memory oldAmounts = new uint256[](0);
        uint256[] memory newChoiceIds = new uint256[](1);
        uint256[] memory newAmounts = new uint256[](1);
        newChoiceIds[0] = 1;
        newAmounts[0] = 100 ether; // Exactly at limit

        vm.prank(relayer);
        wallet.updateStakes(oldChoiceIds, oldAmounts, newChoiceIds, newAmounts);

        assertEq(session.balanceOf(address(wallet), 1), 100 ether);
    }

    function testUpdateStakesPartialUpdate() public {
        // Setup: add initial stakes to choices 1,2,3
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory initialChoiceIds = new uint256[](3);
        uint256[] memory initialAmounts = new uint256[](3);
        initialChoiceIds[0] = 1;
        initialChoiceIds[1] = 2;
        initialChoiceIds[2] = 3;
        initialAmounts[0] = 20 ether;
        initialAmounts[1] = 30 ether;
        initialAmounts[2] = 40 ether;

        vm.prank(relayer);
        wallet.addStakes(initialChoiceIds, initialAmounts);

        // Update: remove from 1,2 only, add to 4,5
        uint256[] memory oldChoiceIds = new uint256[](2);
        uint256[] memory oldAmounts = new uint256[](2);
        oldChoiceIds[0] = 1;
        oldChoiceIds[1] = 2;
        oldAmounts[0] = 20 ether;
        oldAmounts[1] = 30 ether;

        uint256[] memory newChoiceIds = new uint256[](2);
        uint256[] memory newAmounts = new uint256[](2);
        newChoiceIds[0] = 4;
        newChoiceIds[1] = 5;
        newAmounts[0] = 25 ether;
        newAmounts[1] = 25 ether;

        vm.prank(relayer);
        wallet.updateStakes(oldChoiceIds, oldAmounts, newChoiceIds, newAmounts);

        // Verify partial removal
        assertEq(session.balanceOf(address(wallet), 1), 0);
        assertEq(session.balanceOf(address(wallet), 2), 0);
        assertEq(session.balanceOf(address(wallet), 3), 40 ether); // Unchanged

        // Verify new stakes
        assertEq(session.balanceOf(address(wallet), 4), 25 ether);
        assertEq(session.balanceOf(address(wallet), 5), 25 ether);
    }

    // ============ withdraw() Tests ============

    function testWithdrawStandard() public {
        // Setup: wallet has exactly 100 GTC
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        address recipient = address(0x5555);
        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        vm.prank(relayer);
        wallet.withdraw(recipient);

        // Should transfer exactly 100 ether
        assertEq(token.balanceOf(recipient), recipientBalanceBefore + 100 ether);
        assertEq(token.balanceOf(address(wallet)), 0);
    }

    function testWithdrawPartialBalance() public {
        // Setup: wallet has less than 100 GTC
        vm.prank(user);
        token.transfer(address(wallet), 50 ether);

        address recipient = address(0x5555);
        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        vm.prank(relayer);
        wallet.withdraw(recipient);

        // Should transfer actual balance (50 ether)
        assertEq(token.balanceOf(recipient), recipientBalanceBefore + 50 ether);
        assertEq(token.balanceOf(address(wallet)), 0);
    }

    function testWithdrawLargeBalance() public {
        // Setup: wallet has more than 100 GTC
        vm.prank(user);
        token.transfer(address(wallet), 150 ether);

        address recipient = address(0x5555);
        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        vm.prank(relayer);
        wallet.withdraw(recipient);

        // Should cap at 100 ether
        assertEq(token.balanceOf(recipient), recipientBalanceBefore + 100 ether);
        assertEq(token.balanceOf(address(wallet)), 50 ether); // Remainder stays
    }

    function testWithdrawZeroBalance() public {
        // Setup: wallet has no tokens
        address recipient = address(0x5555);

        vm.prank(relayer);
        vm.expectRevert(StakerWallet.ZeroBalance.selector); // Should revert to save gas
        wallet.withdraw(recipient);
    }

    function testWithdrawOnlyRelayer() public {
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        address recipient = address(0x5555);

        // Non-relayer cannot call
        vm.prank(attacker);
        vm.expectRevert(StakerWallet.OnlyRelayer.selector);
        wallet.withdraw(recipient);

        // User cannot call
        vm.prank(user);
        vm.expectRevert(StakerWallet.OnlyRelayer.selector);
        wallet.withdraw(recipient);
    }

    function testWithdrawExactly100() public {
        // Setup: wallet has exactly 100 ether
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        address recipient = address(0x5555);
        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        vm.prank(relayer);
        wallet.withdraw(recipient);

        assertEq(token.balanceOf(recipient), recipientBalanceBefore + 100 ether);
        assertEq(token.balanceOf(address(wallet)), 0);
    }

    function testWithdrawSmallAmount() public {
        // Setup: wallet has 1 wei
        vm.prank(user);
        token.transfer(address(wallet), 1);

        address recipient = address(0x5555);
        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        vm.prank(relayer);
        wallet.withdraw(recipient);

        assertEq(token.balanceOf(recipient), recipientBalanceBefore + 1);
        assertEq(token.balanceOf(address(wallet)), 0);
    }

    // ============ unstakeAllAndWithdraw() Tests ============

    function testUnstakeAllAndWithdrawFullFlow() public {
        // Setup: give wallet tokens and add stakes
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory choiceIds = new uint256[](3);
        uint256[] memory amounts = new uint256[](3);
        choiceIds[0] = 1;
        choiceIds[1] = 2;
        choiceIds[2] = 3;
        amounts[0] = 30 ether;
        amounts[1] = 40 ether;
        amounts[2] = 30 ether;

        vm.prank(relayer);
        wallet.addStakes(choiceIds, amounts);

        // Unstake all and withdraw to recipient
        address recipient = address(0x5555);
        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        vm.prank(relayer);
        wallet.unstakeAllAndWithdraw(choiceIds, amounts, recipient);

        // Verify all stakes removed
        assertEq(session.balanceOf(address(wallet), 1), 0);
        assertEq(session.balanceOf(address(wallet), 2), 0);
        assertEq(session.balanceOf(address(wallet), 3), 0);

        // Verify tokens sent to recipient
        assertEq(token.balanceOf(recipient), recipientBalanceBefore + 100 ether);
        assertEq(token.balanceOf(address(wallet)), 0);
    }

    function testUnstakeAllAndWithdrawEmptyStakes() public {
        // Setup: wallet has tokens but no stakes
        vm.prank(user);
        token.transfer(address(wallet), 50 ether);

        uint256[] memory choiceIds = new uint256[](0);
        uint256[] memory amounts = new uint256[](0);

        address recipient = address(0x5555);
        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        vm.prank(relayer);
        wallet.unstakeAllAndWithdraw(choiceIds, amounts, recipient);

        // Should still withdraw available balance
        assertEq(token.balanceOf(recipient), recipientBalanceBefore + 50 ether);
        assertEq(token.balanceOf(address(wallet)), 0);
    }

    function testUnstakeAllAndWithdrawSingleChoice() public {
        // Setup: stake to single choice
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = 1;
        amounts[0] = 100 ether;

        vm.prank(relayer);
        wallet.addStakes(choiceIds, amounts);

        // Unstake and withdraw
        address recipient = address(0x5555);
        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        vm.prank(relayer);
        wallet.unstakeAllAndWithdraw(choiceIds, amounts, recipient);

        assertEq(session.balanceOf(address(wallet), 1), 0);
        assertEq(token.balanceOf(recipient), recipientBalanceBefore + 100 ether);
    }

    function testUnstakeAllAndWithdrawAll6Choices() public {
        // Setup: stake to all 6 choices
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory choiceIds = new uint256[](6);
        uint256[] memory amounts = new uint256[](6);
        for (uint256 i = 0; i < 6; i++) {
            choiceIds[i] = i + 1;
            amounts[i] = 16666666666666666666; // ~16.67 ether each
        }
        // Adjust last one to sum to exactly 100 ether
        amounts[5] = 100 ether - (amounts[0] * 5);

        vm.prank(relayer);
        wallet.addStakes(choiceIds, amounts);

        // Unstake all 6 and withdraw
        address recipient = address(0x5555);
        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        vm.prank(relayer);
        wallet.unstakeAllAndWithdraw(choiceIds, amounts, recipient);

        // Verify all 6 choices unstaked
        for (uint256 i = 1; i <= 6; i++) {
            assertEq(session.balanceOf(address(wallet), i), 0);
        }

        assertEq(token.balanceOf(recipient), recipientBalanceBefore + 100 ether);
    }

    function testUnstakeAllAndWithdrawOnlyRelayer() public {
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = 1;
        amounts[0] = 50 ether;

        vm.prank(relayer);
        wallet.addStakes(choiceIds, amounts);

        address recipient = address(0x5555);

        // Non-relayer cannot call
        vm.prank(attacker);
        vm.expectRevert(StakerWallet.OnlyRelayer.selector);
        wallet.unstakeAllAndWithdraw(choiceIds, amounts, recipient);

        // User cannot call
        vm.prank(user);
        vm.expectRevert(StakerWallet.OnlyRelayer.selector);
        wallet.unstakeAllAndWithdraw(choiceIds, amounts, recipient);
    }

    function testUnstakeAllAndWithdrawCap100() public {
        // Setup: stake 100 ether, then add 50 more tokens directly
        vm.startPrank(user);
        token.transfer(address(wallet), 100 ether);
        vm.stopPrank();

        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = 1;
        amounts[0] = 100 ether;

        vm.prank(relayer);
        wallet.addStakes(choiceIds, amounts);

        // Add extra tokens to wallet
        vm.prank(user);
        token.transfer(address(wallet), 50 ether);

        // Unstake all and withdraw
        address recipient = address(0x5555);
        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        vm.prank(relayer);
        wallet.unstakeAllAndWithdraw(choiceIds, amounts, recipient);

        // Should cap at 100 ether
        assertEq(token.balanceOf(recipient), recipientBalanceBefore + 100 ether);
        assertEq(token.balanceOf(address(wallet)), 50 ether); // Remainder stays
    }

    function testUnstakeAllAndWithdrawZeroBalance() public {
        // Setup: wallet has stakes but somehow no tokens (edge case)
        // This shouldn't happen in practice but test the revert
        uint256[] memory choiceIds = new uint256[](0);
        uint256[] memory amounts = new uint256[](0);
        address recipient = address(0x5555);

        vm.prank(relayer);
        vm.expectRevert(StakerWallet.ZeroBalance.selector);
        wallet.unstakeAllAndWithdraw(choiceIds, amounts, recipient);
    }

    function testUnstakeAllAndWithdrawAtomic() public {
        // Verify it's atomic - both unstake and withdraw happen in same tx
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        uint256[] memory choiceIds = new uint256[](2);
        uint256[] memory amounts = new uint256[](2);
        choiceIds[0] = 1;
        choiceIds[1] = 2;
        amounts[0] = 50 ether;
        amounts[1] = 50 ether;

        vm.prank(relayer);
        wallet.addStakes(choiceIds, amounts);

        address recipient = address(0x5555);

        // Record state before
        uint256 stakeBalance1Before = session.balanceOf(address(wallet), 1);
        uint256 stakeBalance2Before = session.balanceOf(address(wallet), 2);

        // Execute atomic operation
        vm.prank(relayer);
        wallet.unstakeAllAndWithdraw(choiceIds, amounts, recipient);

        // Verify stakes were > 0 before
        assertEq(stakeBalance1Before, 50 ether);
        assertEq(stakeBalance2Before, 50 ether);

        // Verify both operations completed
        assertEq(session.balanceOf(address(wallet), 1), 0);
        assertEq(session.balanceOf(address(wallet), 2), 0);
        assertEq(token.balanceOf(recipient), 100 ether);
    }
}

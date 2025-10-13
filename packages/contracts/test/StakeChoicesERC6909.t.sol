// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {StakeChoicesERC6909} from "../src/StakeChoicesERC6909.sol";
import {StakeChoicesFactory} from "../src/StakeChoicesFactory.sol";
import {TestERC20} from "../src/TestERC20.sol";

contract StakeChoicesERC6909Test is Test {
    StakeChoicesERC6909 public stakeChoices;
    StakeChoicesFactory public factory;
    TestERC20 public token;

    address public user1 = address(0x1);
    address public user2 = address(0x2);

    function setUp() public {
        token = new TestERC20();

        // Deploy factory
        factory = new StakeChoicesFactory();

        // Deploy session via factory
        address sessionAddr = factory.deployToken(address(token), "Test Staking Session");
        stakeChoices = StakeChoicesERC6909(sessionAddr);

        // Mint tokens to users
        token.mint(user1, 1000 ether);
        token.mint(user2, 1000 ether);
    }

    function testInitialization() public view {
        assertEq(address(stakeChoices.stakingToken()), address(token));
        assertEq(stakeChoices.sessionName(), "Test Staking Session");
        assertEq(stakeChoices.factory(), address(factory));
    }

    function testCannotReinitialize() public {
        vm.expectRevert();
        stakeChoices.initialize(address(token), "Should Fail");
    }

    function testAddStakesSingleChoice() public {
        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = 1;
        amounts[0] = 100 ether;

        vm.startPrank(user1);
        token.approve(address(stakeChoices), 100 ether);
        stakeChoices.addStakes(choiceIds, amounts);
        vm.stopPrank();

        // User should have ERC6909 tokens
        assertEq(stakeChoices.balanceOf(user1, 1), 100 ether);
        // Total supply should be updated
        assertEq(stakeChoices.totalSupply(1), 100 ether);
        // Contract should hold the staking tokens
        assertEq(token.balanceOf(address(stakeChoices)), 100 ether);
    }

    function testAddStakesMultipleChoices() public {
        uint256[] memory choiceIds = new uint256[](3);
        uint256[] memory amounts = new uint256[](3);
        choiceIds[0] = 1;
        choiceIds[1] = 2;
        choiceIds[2] = 3;
        amounts[0] = 100 ether;
        amounts[1] = 200 ether;
        amounts[2] = 300 ether;

        vm.startPrank(user1);
        token.approve(address(stakeChoices), 600 ether);
        stakeChoices.addStakes(choiceIds, amounts);
        vm.stopPrank();

        // Check balances for each choice
        assertEq(stakeChoices.balanceOf(user1, 1), 100 ether);
        assertEq(stakeChoices.balanceOf(user1, 2), 200 ether);
        assertEq(stakeChoices.balanceOf(user1, 3), 300 ether);

        // Check total supplies
        assertEq(stakeChoices.totalSupply(1), 100 ether);
        assertEq(stakeChoices.totalSupply(2), 200 ether);
        assertEq(stakeChoices.totalSupply(3), 300 ether);

        // Contract should hold total staking tokens
        assertEq(token.balanceOf(address(stakeChoices)), 600 ether);
    }

    function testAddStakesLengthMismatch() public {
        uint256[] memory choiceIds = new uint256[](2);
        uint256[] memory amounts = new uint256[](1);

        vm.prank(user1);
        vm.expectRevert(StakeChoicesERC6909.LengthMismatch.selector);
        stakeChoices.addStakes(choiceIds, amounts);
    }

    function testRemoveStakes() public {
        // First add stakes
        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = 1;
        amounts[0] = 100 ether;

        vm.startPrank(user1);
        token.approve(address(stakeChoices), 100 ether);
        stakeChoices.addStakes(choiceIds, amounts);

        // Now remove stakes
        uint256 user1BalanceBefore = token.balanceOf(user1);
        stakeChoices.removeStakes(choiceIds, amounts);
        vm.stopPrank();

        // User should have no ERC6909 tokens
        assertEq(stakeChoices.balanceOf(user1, 1), 0);
        // Total supply should be zero
        assertEq(stakeChoices.totalSupply(1), 0);
        // User should get tokens back
        assertEq(token.balanceOf(user1), user1BalanceBefore + 100 ether);
    }

    function testRemoveStakesMultipleChoices() public {
        // Add stakes to multiple choices
        uint256[] memory choiceIds = new uint256[](3);
        uint256[] memory amounts = new uint256[](3);
        choiceIds[0] = 1;
        choiceIds[1] = 2;
        choiceIds[2] = 3;
        amounts[0] = 100 ether;
        amounts[1] = 200 ether;
        amounts[2] = 300 ether;

        vm.startPrank(user1);
        token.approve(address(stakeChoices), 600 ether);
        stakeChoices.addStakes(choiceIds, amounts);

        // Remove partial stakes
        uint256[] memory removeIds = new uint256[](2);
        uint256[] memory removeAmounts = new uint256[](2);
        removeIds[0] = 1;
        removeIds[1] = 2;
        removeAmounts[0] = 50 ether;
        removeAmounts[1] = 100 ether;

        uint256 user1BalanceBefore = token.balanceOf(user1);
        stakeChoices.removeStakes(removeIds, removeAmounts);
        vm.stopPrank();

        // Check remaining balances
        assertEq(stakeChoices.balanceOf(user1, 1), 50 ether);
        assertEq(stakeChoices.balanceOf(user1, 2), 100 ether);
        assertEq(stakeChoices.balanceOf(user1, 3), 300 ether);

        // User should get tokens back
        assertEq(token.balanceOf(user1), user1BalanceBefore + 150 ether);
    }

    function testRemoveStakesLengthMismatch() public {
        uint256[] memory choiceIds = new uint256[](2);
        uint256[] memory amounts = new uint256[](1);

        vm.prank(user1);
        vm.expectRevert(StakeChoicesERC6909.LengthMismatch.selector);
        stakeChoices.removeStakes(choiceIds, amounts);
    }

    function testTransferERC6909Tokens() public {
        // Add stakes
        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = 1;
        amounts[0] = 100 ether;

        vm.startPrank(user1);
        token.approve(address(stakeChoices), 100 ether);
        stakeChoices.addStakes(choiceIds, amounts);

        // Transfer ERC6909 tokens to user2
        stakeChoices.transfer(user2, 1, 50 ether);
        vm.stopPrank();

        // Check balances
        assertEq(stakeChoices.balanceOf(user1, 1), 50 ether);
        assertEq(stakeChoices.balanceOf(user2, 1), 50 ether);

        // User2 can now remove their stake
        vm.startPrank(user2);
        uint256[] memory removeIds = new uint256[](1);
        uint256[] memory removeAmounts = new uint256[](1);
        removeIds[0] = 1;
        removeAmounts[0] = 50 ether;

        stakeChoices.removeStakes(removeIds, removeAmounts);
        vm.stopPrank();

        assertEq(token.balanceOf(user2), 1050 ether); // Original 1000 + 50 from stake
    }

    function testSetChoiceName() public {
        vm.prank(user1);
        stakeChoices.setChoiceName(1, "Choice A");

        assertEq(stakeChoices.name(1), "Choice A");
    }

    function testSetChoiceNameOnlyOnce() public {
        vm.prank(user1);
        stakeChoices.setChoiceName(1, "Choice A");

        vm.prank(user2);
        vm.expectRevert(StakeChoicesERC6909.AlreadyNamed.selector);
        stakeChoices.setChoiceName(1, "Choice B");
    }

    function testSetChoiceSymbol() public {
        vm.prank(user1);
        stakeChoices.setChoiceSymbol(1, "CA");

        assertEq(stakeChoices.symbol(1), "CA");
    }

    function testSetChoiceSymbolOnlyOnce() public {
        vm.prank(user1);
        stakeChoices.setChoiceSymbol(1, "CA");

        vm.prank(user2);
        vm.expectRevert(StakeChoicesERC6909.AlreadySymboled.selector);
        stakeChoices.setChoiceSymbol(1, "CB");
    }

    function testDecimals() public view {
        assertEq(stakeChoices.decimals(1), 18);
        assertEq(stakeChoices.decimals(999), 18);
    }

    function testMultipleUsersStakingSameChoice() public {
        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = 1;
        amounts[0] = 100 ether;

        // User1 stakes
        vm.startPrank(user1);
        token.approve(address(stakeChoices), 100 ether);
        stakeChoices.addStakes(choiceIds, amounts);
        vm.stopPrank();

        // User2 stakes
        amounts[0] = 200 ether;
        vm.startPrank(user2);
        token.approve(address(stakeChoices), 200 ether);
        stakeChoices.addStakes(choiceIds, amounts);
        vm.stopPrank();

        // Check individual balances
        assertEq(stakeChoices.balanceOf(user1, 1), 100 ether);
        assertEq(stakeChoices.balanceOf(user2, 1), 200 ether);

        // Check total supply
        assertEq(stakeChoices.totalSupply(1), 300 ether);
    }

    function testApprovalAndTransferFrom() public {
        // Add stakes
        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = 1;
        amounts[0] = 100 ether;

        vm.startPrank(user1);
        token.approve(address(stakeChoices), 100 ether);
        stakeChoices.addStakes(choiceIds, amounts);

        // Approve user2 to transfer
        stakeChoices.approve(user2, 1, 50 ether);
        vm.stopPrank();

        // User2 transfers from user1
        vm.prank(user2);
        stakeChoices.transferFrom(user1, user2, 1, 50 ether);

        // Check balances
        assertEq(stakeChoices.balanceOf(user1, 1), 50 ether);
        assertEq(stakeChoices.balanceOf(user2, 1), 50 ether);
    }
}

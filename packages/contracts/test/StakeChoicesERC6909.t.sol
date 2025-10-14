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
        assertEq(stakeChoices.name(), "Test Staking Session");
        assertEq(stakeChoices.factory(), address(factory));
    }

    function testCannotReinitialize() public {
        vm.expectRevert();
        stakeChoices.initialize(address(token), "Should Fail");
    }

    function testAddStakesSingleChoice() public {
        uint256 choiceId = stakeChoices.computeId(user1, bytes32(uint256(1)));

        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = choiceId;
        amounts[0] = 100 ether;

        vm.startPrank(user1);
        token.approve(address(stakeChoices), 100 ether);
        stakeChoices.addStakes(choiceIds, amounts);
        vm.stopPrank();

        // User should have ERC6909 tokens
        assertEq(stakeChoices.balanceOf(user1, choiceId), 100 ether);
        // Total supply should be updated
        assertEq(stakeChoices.totalSupply(choiceId), 100 ether);
        // Contract should hold the staking tokens
        assertEq(token.balanceOf(address(stakeChoices)), 100 ether);
    }

    function testAddStakesMultipleChoices() public {
        uint256[] memory choiceIds = new uint256[](3);
        uint256[] memory amounts = new uint256[](3);
        choiceIds[0] = stakeChoices.computeId(user1, bytes32(uint256(1)));
        choiceIds[1] = stakeChoices.computeId(user1, bytes32(uint256(2)));
        choiceIds[2] = stakeChoices.computeId(user1, bytes32(uint256(3)));
        amounts[0] = 100 ether;
        amounts[1] = 200 ether;
        amounts[2] = 300 ether;

        vm.startPrank(user1);
        token.approve(address(stakeChoices), 600 ether);
        stakeChoices.addStakes(choiceIds, amounts);
        vm.stopPrank();

        // Check balances for each choice
        assertEq(stakeChoices.balanceOf(user1, choiceIds[0]), 100 ether);
        assertEq(stakeChoices.balanceOf(user1, choiceIds[1]), 200 ether);
        assertEq(stakeChoices.balanceOf(user1, choiceIds[2]), 300 ether);

        // Check total supplies
        assertEq(stakeChoices.totalSupply(choiceIds[0]), 100 ether);
        assertEq(stakeChoices.totalSupply(choiceIds[1]), 200 ether);
        assertEq(stakeChoices.totalSupply(choiceIds[2]), 300 ether);

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
        uint256 choiceId = stakeChoices.computeId(user1, bytes32(uint256(1)));

        // First add stakes
        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = choiceId;
        amounts[0] = 100 ether;

        vm.startPrank(user1);
        token.approve(address(stakeChoices), 100 ether);
        stakeChoices.addStakes(choiceIds, amounts);

        // Now remove stakes
        uint256 user1BalanceBefore = token.balanceOf(user1);
        stakeChoices.removeStakes(choiceIds, amounts);
        vm.stopPrank();

        // User should have no ERC6909 tokens
        assertEq(stakeChoices.balanceOf(user1, choiceId), 0);
        // Total supply should be zero
        assertEq(stakeChoices.totalSupply(choiceId), 0);
        // User should get tokens back
        assertEq(token.balanceOf(user1), user1BalanceBefore + 100 ether);
    }

    function testRemoveStakesMultipleChoices() public {
        // Add stakes to multiple choices
        uint256[] memory choiceIds = new uint256[](3);
        uint256[] memory amounts = new uint256[](3);
        choiceIds[0] = stakeChoices.computeId(user1, bytes32(uint256(1)));
        choiceIds[1] = stakeChoices.computeId(user1, bytes32(uint256(2)));
        choiceIds[2] = stakeChoices.computeId(user1, bytes32(uint256(3)));
        amounts[0] = 100 ether;
        amounts[1] = 200 ether;
        amounts[2] = 300 ether;

        vm.startPrank(user1);
        token.approve(address(stakeChoices), 600 ether);
        stakeChoices.addStakes(choiceIds, amounts);

        // Remove partial stakes
        uint256[] memory removeIds = new uint256[](2);
        uint256[] memory removeAmounts = new uint256[](2);
        removeIds[0] = choiceIds[0];
        removeIds[1] = choiceIds[1];
        removeAmounts[0] = 50 ether;
        removeAmounts[1] = 100 ether;

        uint256 user1BalanceBefore = token.balanceOf(user1);
        stakeChoices.removeStakes(removeIds, removeAmounts);
        vm.stopPrank();

        // Check remaining balances
        assertEq(stakeChoices.balanceOf(user1, choiceIds[0]), 50 ether);
        assertEq(stakeChoices.balanceOf(user1, choiceIds[1]), 100 ether);
        assertEq(stakeChoices.balanceOf(user1, choiceIds[2]), 300 ether);

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
        uint256 choiceId = stakeChoices.computeId(user1, bytes32(uint256(1)));

        // Add stakes
        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = choiceId;
        amounts[0] = 100 ether;

        vm.startPrank(user1);
        token.approve(address(stakeChoices), 100 ether);
        stakeChoices.addStakes(choiceIds, amounts);

        // Transfer ERC6909 tokens to user2
        stakeChoices.transfer(user2, choiceId, 50 ether);
        vm.stopPrank();

        // Check balances
        assertEq(stakeChoices.balanceOf(user1, choiceId), 50 ether);
        assertEq(stakeChoices.balanceOf(user2, choiceId), 50 ether);

        // User2 can now remove their stake
        vm.startPrank(user2);
        uint256[] memory removeIds = new uint256[](1);
        uint256[] memory removeAmounts = new uint256[](1);
        removeIds[0] = choiceId;
        removeAmounts[0] = 50 ether;

        stakeChoices.removeStakes(removeIds, removeAmounts);
        vm.stopPrank();

        assertEq(token.balanceOf(user2), 1050 ether); // Original 1000 + 50 from stake
    }

    function testRegisterChoice() public {
        vm.prank(user1);
        stakeChoices.registerChoice(bytes32(uint256(1)), "Choice A", "CA", "ipfs://example");

        uint256 choiceId = stakeChoices.computeId(user1, bytes32(uint256(1)));
        assertEq(stakeChoices.name(choiceId), "Choice A");
        assertEq(stakeChoices.symbol(choiceId), "CA");
        assertEq(stakeChoices.tokenURI(choiceId), "ipfs://example");
    }

    function testRegisterChoiceOnlyOnce() public {
        vm.prank(user1);
        stakeChoices.registerChoice(bytes32(uint256(1)), "Choice A", "CA", "");

        vm.prank(user1);
        vm.expectRevert(StakeChoicesERC6909.MetadataAlreadySet.selector);
        stakeChoices.registerChoice(bytes32(uint256(1)), "Choice B", "CB", "");
    }

    function testRegisterChoiceNameCannotBeEmpty() public {
        vm.prank(user1);
        vm.expectRevert(StakeChoicesERC6909.NameCannotBeEmpty.selector);
        stakeChoices.registerChoice(bytes32(uint256(1)), "", "CA", "");
    }

    function testRegisterChoiceOptionalFields() public {
        // Symbol and URI are optional, only name is required
        vm.prank(user1);
        stakeChoices.registerChoice(bytes32(uint256(1)), "Choice A", "", "");

        uint256 choiceId = stakeChoices.computeId(user1, bytes32(uint256(1)));
        assertEq(stakeChoices.name(choiceId), "Choice A");
        assertEq(stakeChoices.symbol(choiceId), "");
        assertEq(stakeChoices.tokenURI(choiceId), "");
    }

    function testComputeIdDeterministic() public view {
        // Same inputs should produce same ID
        uint256 id1 = stakeChoices.computeId(user1, bytes32(uint256(123)));
        uint256 id2 = stakeChoices.computeId(user1, bytes32(uint256(123)));
        assertEq(id1, id2);

        // Different creator should produce different ID
        uint256 id3 = stakeChoices.computeId(user2, bytes32(uint256(123)));
        assertTrue(id1 != id3);

        // Different salt should produce different ID
        uint256 id4 = stakeChoices.computeId(user1, bytes32(uint256(456)));
        assertTrue(id1 != id4);
    }

    function testDecimals() public view {
        assertEq(stakeChoices.decimals(1), 18);
        assertEq(stakeChoices.decimals(999), 18);
    }

    function testMultipleUsersStakingSameChoice() public {
        // Both users stake to the same deterministic choice ID
        uint256 choiceId = stakeChoices.computeId(user1, bytes32(uint256(1)));

        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = choiceId;
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
        assertEq(stakeChoices.balanceOf(user1, choiceId), 100 ether);
        assertEq(stakeChoices.balanceOf(user2, choiceId), 200 ether);

        // Check total supply
        assertEq(stakeChoices.totalSupply(choiceId), 300 ether);
    }

    function testApprovalAndTransferFrom() public {
        uint256 choiceId = stakeChoices.computeId(user1, bytes32(uint256(1)));

        // Add stakes
        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = choiceId;
        amounts[0] = 100 ether;

        vm.startPrank(user1);
        token.approve(address(stakeChoices), 100 ether);
        stakeChoices.addStakes(choiceIds, amounts);

        // Approve user2 to transfer
        stakeChoices.approve(user2, choiceId, 50 ether);
        vm.stopPrank();

        // User2 transfers from user1
        vm.prank(user2);
        stakeChoices.transferFrom(user1, user2, choiceId, 50 ether);

        // Check balances
        assertEq(stakeChoices.balanceOf(user1, choiceId), 50 ether);
        assertEq(stakeChoices.balanceOf(user2, choiceId), 50 ether);
    }

    function testAddStakesSameChoiceMultipleTimes() public {
        // Use the same choice ID multiple times in the same call
        uint256[] memory choiceIds = new uint256[](4);
        uint256[] memory amounts = new uint256[](4);
        uint256 choice1 = stakeChoices.computeId(user1, bytes32(uint256(1)));
        uint256 choice2 = stakeChoices.computeId(user1, bytes32(uint256(2)));

        choiceIds[0] = choice1;
        choiceIds[1] = choice2;
        choiceIds[2] = choice1; // Duplicate choice ID
        choiceIds[3] = choice1; // Another duplicate
        amounts[0] = 100 ether;
        amounts[1] = 200 ether;
        amounts[2] = 50 ether;
        amounts[3] = 75 ether;

        vm.startPrank(user1);
        token.approve(address(stakeChoices), 425 ether);
        stakeChoices.addStakes(choiceIds, amounts);
        vm.stopPrank();

        // Check balances - choice 1 should have accumulated amounts
        assertEq(stakeChoices.balanceOf(user1, choice1), 225 ether); // 100 + 50 + 75
        assertEq(stakeChoices.balanceOf(user1, choice2), 200 ether);

        // Check total supplies
        assertEq(stakeChoices.totalSupply(choice1), 225 ether);
        assertEq(stakeChoices.totalSupply(choice2), 200 ether);

        // Contract should hold total staking tokens
        assertEq(token.balanceOf(address(stakeChoices)), 425 ether);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {StakerWallet} from "../src/StakerWallet.sol";
import {TestERC20} from "../src/TestERC20.sol";
import {Stake} from "../src/Stake.sol";

contract StakerWalletTest is Test {
    StakerWallet public wallet;
    TestERC20 public token;
    Stake public stake;

    address public user = address(0x1234);
    address public relayer = address(0x9999);
    address public attacker = address(0x6666);

    function setUp() public {
        token = new TestERC20();
        stake = new Stake(address(token));
        wallet = new StakerWallet(address(token), address(stake), relayer);

        // Mint tokens to user
        token.mint(user, 1000 ether);
    }

    function testOnlyRelayerCanStake() public {
        // Give wallet some tokens
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        // Relayer can stake
        vm.prank(relayer);
        wallet.stake(50 ether);

        // Check stake was successful
        assertEq(stake.stakedBalance(address(wallet)), 50 ether);
    }

    function testNonRelayerCannotStake() public {
        // Give wallet some tokens
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        // Non-relayer cannot stake
        vm.prank(attacker);
        vm.expectRevert(StakerWallet.OnlyRelayer.selector);
        wallet.stake(50 ether);
    }

    function testAmountTooHighReverts() public {
        uint256 tooMuch = wallet.MAX_STAKE_PER_TX() + 1;

        vm.prank(relayer);
        vm.expectRevert(StakerWallet.AmountTooHigh.selector);
        wallet.stake(tooMuch);
    }

    function testStakeEmitsEvent() public {
        // Give wallet some tokens
        vm.prank(user);
        token.transfer(address(wallet), 100 ether);

        // Expect the event
        vm.expectEmit(true, true, true, true);
        emit StakerWallet.StakeExecuted(address(wallet), 50 ether);

        vm.prank(relayer);
        wallet.stake(50 ether);
    }

    function testMaxStakePerTx() public view {
        assertEq(wallet.MAX_STAKE_PER_TX(), 100e18);
    }
}

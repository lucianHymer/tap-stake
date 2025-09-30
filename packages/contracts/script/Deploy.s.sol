// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {SelfBatchExecutor} from "../src/SelfBatchExecutor.sol";
import {StakerWallet} from "../src/StakerWallet.sol";
import {TestERC20} from "../src/TestERC20.sol";
import {Stake} from "../src/Stake.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy existing contracts
        SelfBatchExecutor executor = new SelfBatchExecutor();
        console.log("SelfBatchExecutor deployed at:", address(executor));

        TestERC20 token = new TestERC20();
        console.log("TestERC20 deployed at:", address(token));

        // Deploy Stake contract with TestERC20 as staking token
        Stake stakeContract = new Stake(address(token));
        console.log("Stake deployed at:", address(stakeContract));

        // Deploy new StakerWallet with relayer address
        // Check if RELAYER_ADDRESS is set, otherwise use deployer as relayer
        address relayerAddress;
        try vm.envAddress("RELAYER_ADDRESS") returns (address addr) {
            relayerAddress = addr;
            console.log("Using RELAYER_ADDRESS from env:", relayerAddress);
        } catch {
            relayerAddress = msg.sender; // Use deployer as relayer for testing
            console.log("Using deployer as relayer:", relayerAddress);
        }

        StakerWallet stakerWallet = new StakerWallet(
            address(token),
            address(stakeContract),
            relayerAddress
        );
        console.log("StakerWallet deployed at:", address(stakerWallet));
        console.log("  Whitelisted relayer:", relayerAddress);

        vm.stopBroadcast();
    }
}
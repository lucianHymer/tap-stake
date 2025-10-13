// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {StakerWallet} from "../src/StakerWallet.sol";
import {StakeChoicesFactory} from "../src/StakeChoicesFactory.sol";
import {StakeChoicesERC6909} from "../src/StakeChoicesERC6909.sol";
import {TestERC20} from "../src/TestERC20.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy test token
        TestERC20 token = new TestERC20();
        console.log("TestERC20 deployed at:", address(token));

        // Deploy StakeChoicesFactory
        StakeChoicesFactory factory = new StakeChoicesFactory();
        console.log("StakeChoicesFactory deployed at:", address(factory));
        console.log("  Implementation at:", factory.implementation());

        // Deploy a sample session for testing
        address session = factory.deployToken(address(token), "Test Session");
        console.log("Sample StakeChoicesERC6909 session deployed at:", session);

        // Deploy StakerWallet with relayer address
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
            session,
            relayerAddress,
            100 ether // MAX_STAKE_PER_TX
        );
        console.log("StakerWallet deployed at:", address(stakerWallet));
        console.log("  Token:", address(token));
        console.log("  StakeChoices:", session);
        console.log("  Relayer:", relayerAddress);
        console.log("  Max stake per tx:", stakerWallet.MAX_STAKE_PER_TX());

        vm.stopBroadcast();
    }
}
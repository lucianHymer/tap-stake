// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {BatchExecutor} from "../src/BatchExecutor.sol";
import {TestERC20} from "../src/TestERC20.sol";
import {Stake} from "../src/Stake.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy contracts
        BatchExecutor executor = new BatchExecutor();
        console.log("BatchExecutor deployed at:", address(executor));

        TestERC20 token = new TestERC20();
        console.log("TestERC20 deployed at:", address(token));

        // Deploy Stake contract with TestERC20 as staking token
        Stake stakeContract = new Stake(address(token));
        console.log("Stake deployed at:", address(stakeContract));

        vm.stopBroadcast();
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {StakerWallet} from "../src/StakerWallet.sol";

contract DeployStakerWalletScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address relayerAddress = vm.envAddress("RELAYER_ADDRESS");
        address stakeChoicesAddress = vm.envAddress("STAKE_CHOICES_ADDRESS");

        // Use the existing deployed token from the previous deployment
        address tokenAddress = 0xAA2B1999C772cF2B4E5478e4b5C54aE8447ef756;

        vm.startBroadcast(deployerPrivateKey);

        // Deploy new StakerWallet with the specified relayer address
        StakerWallet stakerWallet = new StakerWallet(
            tokenAddress,
            stakeChoicesAddress,
            relayerAddress,
            100 ether // maxAmountPerTx
        );

        console.log("StakerWallet deployed at:", address(stakerWallet));
        console.log("  Token address:", tokenAddress);
        console.log("  StakeChoices address:", stakeChoicesAddress);
        console.log("  Relayer:", relayerAddress);
        console.log("  Max amount per tx:", stakerWallet.maxAmountPerTx());

        vm.stopBroadcast();
    }
}

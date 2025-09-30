// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {StakerWallet} from "../src/StakerWallet.sol";

contract DeployStakerWalletScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address relayerAddress = vm.envAddress("RELAYER_ADDRESS");

        // Use the existing deployed contracts from the previous deployment
        address tokenAddress = 0xC7480B7CAaDc8Aaa8b0ddD0552EC5F77A464F649;
        address stakeAddress = 0x334559433296D9Dd9a861c200aFB1FEAF77388AA;

        vm.startBroadcast(deployerPrivateKey);

        // Deploy new StakerWallet with the specified relayer address
        StakerWallet stakerWallet = new StakerWallet(
            tokenAddress,
            stakeAddress,
            relayerAddress
        );

        console.log("StakerWallet deployed at:", address(stakerWallet));
        console.log("  Token address:", tokenAddress);
        console.log("  Stake contract:", stakeAddress);
        console.log("  Whitelisted relayer:", relayerAddress);

        vm.stopBroadcast();
    }
}
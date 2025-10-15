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
        address tokenAddress = 0xC7480B7CAaDc8Aaa8b0ddD0552EC5F77A464F649;

        vm.startBroadcast(deployerPrivateKey);

        // Deploy new StakerWallet with the specified relayer address
        StakerWallet stakerWallet = new StakerWallet(
            tokenAddress,
            stakeChoicesAddress,
            relayerAddress,
            100 ether // MAX_STAKE_PER_TX
        );

        console.log("StakerWallet deployed at:", address(stakerWallet));
        console.log("  Token address:", tokenAddress);
        console.log("  StakeChoices address:", stakeChoicesAddress);
        console.log("  Relayer:", relayerAddress);
        console.log("  Max stake per tx:", stakerWallet.maxStakePerTx());

        vm.stopBroadcast();
    }
}

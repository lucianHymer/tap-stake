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
        address deployerAddress = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        console.log("Deployer address:", deployerAddress);

        address tokenAddress = 0x1EBA7a6a72c894026Cd654AC5CDCF83A46445B08;
        console.log("Using existing GTC contract at:", tokenAddress);

        // Deploy StakeChoicesFactory
        StakeChoicesFactory factory = new StakeChoicesFactory();
        console.log("StakeChoicesFactory deployed at:", address(factory));
        console.log("  Implementation at:", factory.implementation());

        // Deploy first multi-toke
        address multiToken = factory.deployToken(tokenAddress, "Staked GTC");
        console.log("Stakend GTC StakeChoicesERC6909 multiToken deployed at:", multiToken);

        // Register 6 choices
        StakeChoicesERC6909 stakeChoices = StakeChoicesERC6909(multiToken);
        string[6] memory choiceNames = [
            "Staked GTC - Karma",
            "Staked GTC - Giveth",
            "Staked GTC - Gardens",
            "Staked GTC - Deep Funding",
            "Staked GTC - Privote",
            "Staked GTC - Silvi"
        ];
        string[6] memory choiceSymbols = [
            unicode"🥩GTC-Karma",
            unicode"🥩GTC-Giveth",
            unicode"🥩GTC-Gardens",
            unicode"🥩GTC-DeepFunding",
            unicode"🥩GTC-Privote",
            unicode"🥩GTC-Silvi"
        ];

        for (uint256 i = 0; i < 6; i++) {
            bytes32 salt = bytes32(i + 1);
            string memory uri = string(
                abi.encodePacked(
                    "data:application/json,{\"name\":\"",
                    choiceNames[i],
                    "\",\"symbol\":\"",
                    choiceSymbols[i],
                    "\",\"decimals\":18}"
                )
            );
            stakeChoices.registerChoice(salt, choiceNames[i], choiceSymbols[i], uri);
            uint256 choiceId = stakeChoices.computeId(deployerAddress, salt);
            console.log("Registered choice", i + 1);
            console.log("  Name:", choiceNames[i]);
            console.log("  Salt:", uint256(salt));
            console.log("  Choice ID:", choiceId);
        }

        // Check if RELAYER_ADDRESS is set, otherwise revert
        address relayerAddress = vm.envAddress("RELAYER_ADDRESS");
        require(relayerAddress != address(0), "RELAYER_ADDRESS must be set");
        console.log("Using relayer address:", relayerAddress);

        StakerWallet stakerWallet = new StakerWallet(
            tokenAddress,
            multiToken,
            relayerAddress,
            100 ether // MAX_STAKE_PER_TX
        );
        console.log("StakerWallet deployed at:", address(stakerWallet));
        console.log("  Token:", tokenAddress);
        console.log("  StakeChoices:", multiToken);
        console.log("  Relayer:", relayerAddress);
        console.log("  Max amount per tx:", stakerWallet.maxAmountPerTx());

        vm.stopBroadcast();
    }
}

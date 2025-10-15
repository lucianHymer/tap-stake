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

        // Use existing TestERC20 or deploy new one
        address tokenAddress = 0xAA2B1999C772cF2B4E5478e4b5C54aE8447ef756;
        TestERC20 token = TestERC20(tokenAddress);
        console.log("Using existing TestERC20 at:", address(token));

        // Deploy StakeChoicesFactory
        StakeChoicesFactory factory = new StakeChoicesFactory();
        console.log("StakeChoicesFactory deployed at:", address(factory));
        console.log("  Implementation at:", factory.implementation());

        // Deploy a sample session for testing
        address session = factory.deployToken(address(token), "Test Session");
        console.log("Sample StakeChoicesERC6909 session deployed at:", session);

        // Register 6 choices
        StakeChoicesERC6909 stakeChoices = StakeChoicesERC6909(session);
        string[6] memory choiceNames = [
            "Staked GTC - Choice 1",
            "Staked GTC - Choice 2",
            "Staked GTC - Choice 3",
            "Staked GTC - Choice 4",
            "Staked GTC - Choice 5",
            "Staked GTC - Choice 6"
        ];
        string[6] memory choiceSymbols = [
            unicode"🥩GTC-C1",
            unicode"🥩GTC-C2",
            unicode"🥩GTC-C3",
            unicode"🥩GTC-C4",
            unicode"🥩GTC-C5",
            unicode"🥩GTC-C6"
        ];

        for (uint256 i = 0; i < 6; i++) {
            bytes32 salt = bytes32(i + 1);
            string memory uri = string(
                abi.encodePacked(
                    "data:application/json,{\"name\":\"", choiceNames[i], "\",\"symbol\":\"", choiceSymbols[i], "\",\"decimals\":18}"
                )
            );
            stakeChoices.registerChoice(salt, choiceNames[i], choiceSymbols[i], uri);
            console.log("Registered choice", i + 1, "with salt:", uint256(salt));
        }

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
        console.log("  Max stake per tx:", stakerWallet.maxStakePerTx());

        vm.stopBroadcast();
    }
}

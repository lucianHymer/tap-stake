// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console2} from "forge-std/Script.sol";
import {StakerWallet} from "../src/StakerWallet.sol";
import {StakeChoicesERC6909} from "../src/StakeChoicesERC6909.sol";

/**
 * @title DeployMainnet
 * @notice Deployment script for Optimism Mainnet
 * @dev Deploys only production contracts (no test tokens)
 */
contract DeployMainnet is Script {
    // GTC token on Optimism Mainnet
    address constant GTC_TOKEN = 0x1EBa7a6a72c894026Cd654AC5CDCF83A46445B08;

    // Production configuration
    uint256 constant MINIMUM_HOLDINGS = 90 ether; // 90 GTC minimum
    uint256 constant MAX_STAKE_PER_TX = 100 ether; // 100 GTC max per transaction

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("Deploying to Optimism Mainnet with account:", deployer);
        console2.log("Using GTC token at:", GTC_TOKEN);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy StakeChoicesERC6909
        StakeChoicesERC6909 stakeChoices = new StakeChoicesERC6909();
        console2.log("StakeChoicesERC6909 deployed at:", address(stakeChoices));

        // Deploy StakerWallet with production configuration
        StakerWallet stakerWallet = new StakerWallet(
            address(stakeChoices),
            GTC_TOKEN,
            MINIMUM_HOLDINGS,
            MAX_STAKE_PER_TX,
            deployer // Set deployer as initial relayer
        );
        console2.log("StakerWallet deployed at:", address(stakerWallet));

        // Set StakerWallet as approved spender on StakeChoicesERC6909
        stakeChoices.setApprovedSpender(address(stakerWallet), true);
        console2.log("StakerWallet approved as spender on StakeChoicesERC6909");

        vm.stopBroadcast();

        // Output deployment summary
        console2.log("\n=== MAINNET DEPLOYMENT COMPLETE ===");
        console2.log("GTC Token:", GTC_TOKEN);
        console2.log("StakeChoicesERC6909:", address(stakeChoices));
        console2.log("StakerWallet:", address(stakerWallet));
        console2.log("Relayer:", deployer);
        console2.log("\nUpdate these addresses in:");
        console2.log("- packages/frontend/src/config/contracts.ts");
        console2.log("- packages/relayer/wrangler.toml");
    }
}
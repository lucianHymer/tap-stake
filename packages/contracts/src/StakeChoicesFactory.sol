// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {StakeChoicesERC6909} from "./StakeChoicesERC6909.sol";

/**
 * @title StakeChoicesFactory
 * @notice Factory for deploying cheap clones of StakeChoicesERC6909 tokens
 * @dev Uses EIP-1167 minimal proxy pattern for ~95% gas savings
 */
contract StakeChoicesFactory {
    // ============ State Variables ============

    address public immutable implementation;

    // ============ Events ============

    event TokenDeployed(
        address indexed tokenAddress,
        address stakingToken,
        string tokenName
    );

    // ============ Constructor ============

    /**
     * @dev Deploy the implementation contract once
     */
    constructor() {
        implementation = address(new StakeChoicesERC6909());
    }

    // ============ Factory Functions ============

    /**
     * @notice Deploy a new staking token using minimal proxy
     * @param stakingToken The ERC20 token to use for staking
     * @param tokenName Human-readable name for the token
     * @return tokenAddress The address of the deployed token
     */
    function deployToken(
        address stakingToken,
        string memory tokenName
    ) external returns (address tokenAddress) {
        // Deploy minimal proxy clone (only ~41k gas!)
        tokenAddress = Clones.clone(implementation);

        // Initialize the clone
        StakeChoicesERC6909(tokenAddress).initialize(
            stakingToken,
            tokenName
        );

        emit TokenDeployed(tokenAddress, stakingToken, tokenName);
    }

    /**
     * @notice Deploy with predicted address (CREATE2)
     * @dev Useful for counterfactual deployments or when address needs to be known in advance
     */
    function deployTokenDeterministic(
        address stakingToken,
        string memory tokenName,
        bytes32 salt
    ) external returns (address tokenAddress) {
        // Deploy with CREATE2 for deterministic address
        tokenAddress = Clones.cloneDeterministic(implementation, salt);

        // Initialize the clone
        StakeChoicesERC6909(tokenAddress).initialize(
            stakingToken,
            tokenName
        );

        emit TokenDeployed(tokenAddress, stakingToken, tokenName);
    }

    /**
     * @notice Predict the address for a deterministic deployment
     */
    function predictTokenAddress(bytes32 salt) external view returns (address) {
        return Clones.predictDeterministicAddress(implementation, salt, address(this));
    }
}
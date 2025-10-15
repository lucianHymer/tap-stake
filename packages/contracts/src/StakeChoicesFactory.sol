// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {StakeChoicesERC6909} from "./StakeChoicesERC6909.sol";

/**
 * @title StakeChoicesFactory
 * @author StakeChoices Team
 * @notice Factory for deploying cheap clones of StakeChoicesERC6909 tokens
 * @dev Uses EIP-1167 minimal proxy pattern for ~95% gas savings
 */
contract StakeChoicesFactory {
    // ============ State Variables ============

    /// @notice The implementation contract address for minimal proxy clones
    address public immutable implementation;

    // ============ Events ============

    /**
     * @notice Emitted when a new staking token is deployed
     * @param tokenAddress The address of the newly deployed token
     * @param stakingToken The address of the ERC20 token used for staking
     * @param tokenName The name of the deployed token
     */
    event TokenDeployed(address indexed tokenAddress, address indexed stakingToken, string tokenName);

    // ============ Constructor ============

    /**
     * @notice Deploy the implementation contract once
     * @dev Sets up the implementation contract that all clones will proxy to
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
    function deployToken(address stakingToken, string calldata tokenName) external returns (address tokenAddress) {
        // Deploy minimal proxy clone (only ~41k gas!)
        tokenAddress = Clones.clone(implementation);

        // Initialize the clone
        StakeChoicesERC6909(tokenAddress).initialize(stakingToken, tokenName);

        //slither-disable-next-line reentrancy-events
        emit TokenDeployed(tokenAddress, stakingToken, tokenName);
    }

    /**
     * @notice Deploy with predicted address (CREATE2)
     * @dev Useful for counterfactual deployments or when address needs to be known in advance
     * @param stakingToken The ERC20 token to use for staking
     * @param tokenName Human-readable name for the token
     * @param salt Unique salt for deterministic deployment
     * @return tokenAddress The address of the deployed token
     */
    function deployTokenDeterministic(address stakingToken, string calldata tokenName, bytes32 salt)
        external
        returns (address tokenAddress)
    {
        // Deploy with CREATE2 for deterministic address
        tokenAddress = Clones.cloneDeterministic(implementation, salt);

        // Initialize the clone
        StakeChoicesERC6909(tokenAddress).initialize(stakingToken, tokenName);

        //slither-disable-next-line reentrancy-events
        emit TokenDeployed(tokenAddress, stakingToken, tokenName);
    }

    /**
     * @notice Predict the address for a deterministic deployment
     * @param salt The salt that will be used for the CREATE2 deployment
     * @return The predicted address of the token
     */
    function predictTokenAddress(bytes32 salt) external view returns (address) {
        return Clones.predictDeterministicAddress(implementation, salt, address(this));
    }
}

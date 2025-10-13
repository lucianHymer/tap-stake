// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {StakeChoicesERC1155} from "./StakeChoicesERC1155.sol";

/**
 * @title StakeChoicesFactory
 * @notice Factory for deploying cheap clones of StakeChoicesERC1155 sessions
 * @dev Uses EIP-1167 minimal proxy pattern for ~95% gas savings
 */
contract StakeChoicesFactory {
    // ============ State Variables ============

    address public immutable implementation;

    // Track all deployed sessions
    mapping(uint256 => address) public sessions;
    uint256[] public sessionIds;

    // ============ Events ============

    event SessionDeployed(
        uint256 indexed sessionId,
        address indexed sessionAddress,
        address stakingToken,
        string sessionName
    );

    // ============ Errors ============

    error SessionAlreadyExists();
    error InvalidSessionId();

    // ============ Constructor ============

    /**
     * @dev Deploy the implementation contract once
     */
    constructor() {
        implementation = address(new StakeChoicesERC1155());
    }

    // ============ Factory Functions ============

    /**
     * @notice Deploy a new staking session using minimal proxy
     * @param sessionId Unique identifier for this session
     * @param stakingToken The ERC20 token to use for staking
     * @param sessionName Human-readable name for the session
     * @param uri Metadata URI template for the ERC1155 tokens
     * @return sessionAddress The address of the deployed session
     */
    function deploySession(
        uint256 sessionId,
        address stakingToken,
        string memory sessionName,
        string memory uri
    ) external returns (address sessionAddress) {
        if (sessionId == 0) revert InvalidSessionId();
        if (sessions[sessionId] != address(0)) revert SessionAlreadyExists();

        // Deploy minimal proxy clone (only ~41k gas!)
        sessionAddress = Clones.clone(implementation);

        // Initialize the clone
        StakeChoicesERC1155(sessionAddress).initialize(
            stakingToken,
            sessionId,
            sessionName,
            uri
        );

        // Store session info
        sessions[sessionId] = sessionAddress;
        sessionIds.push(sessionId);

        emit SessionDeployed(sessionId, sessionAddress, stakingToken, sessionName);
    }

    /**
     * @notice Deploy with predicted address (CREATE2)
     * @dev Useful for counterfactual deployments or when address needs to be known in advance
     */
    function deploySessionDeterministic(
        uint256 sessionId,
        address stakingToken,
        string memory sessionName,
        string memory uri,
        bytes32 salt
    ) external returns (address sessionAddress) {
        if (sessionId == 0) revert InvalidSessionId();
        if (sessions[sessionId] != address(0)) revert SessionAlreadyExists();

        // Deploy with CREATE2 for deterministic address
        sessionAddress = Clones.cloneDeterministic(implementation, salt);

        // Initialize the clone
        StakeChoicesERC1155(sessionAddress).initialize(
            stakingToken,
            sessionId,
            sessionName,
            uri
        );

        // Store session info
        sessions[sessionId] = sessionAddress;
        sessionIds.push(sessionId);

        emit SessionDeployed(sessionId, sessionAddress, stakingToken, sessionName);
    }

    /**
     * @notice Predict the address for a deterministic deployment
     */
    function predictSessionAddress(bytes32 salt) external view returns (address) {
        return Clones.predictDeterministicAddress(implementation, salt, address(this));
    }

    // ============ View Functions ============

    /**
     * @notice Get total number of sessions deployed
     */
    function getSessionCount() external view returns (uint256) {
        return sessionIds.length;
    }

    /**
     * @notice Get all session IDs
     */
    function getAllSessionIds() external view returns (uint256[] memory) {
        return sessionIds;
    }

    /**
     * @notice Get session addresses for multiple IDs
     */
    function getSessionAddresses(
        uint256[] calldata ids
    ) external view returns (address[] memory addresses) {
        addresses = new address[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            addresses[i] = sessions[ids[i]];
        }
    }
}
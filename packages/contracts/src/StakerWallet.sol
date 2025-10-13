// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IStakeChoicesERC6909 {
    function addStakes(uint256[] calldata choiceIds, uint256[] calldata amounts) external;
    function removeStakes(uint256[] calldata choiceIds, uint256[] calldata amounts) external;
}

/**
 * @title StakerWallet
 * @notice EIP-7702 delegation contract for gasless staking with ERC6909 sessions
 * @dev Minimal implementation - relies on ERC6909 events, no duplication
 */
contract StakerWallet {
    // ============ Immutable Config ============

    address public immutable TOKEN_ADDRESS;
    address public immutable RELAYER;
    uint256 public immutable MAX_STAKE_PER_TX;

    // ============ Errors ============

    error OnlyRelayer();
    error AmountTooHigh();

    // ============ Modifiers ============

    modifier onlyRelayer() {
        if (msg.sender != RELAYER) revert OnlyRelayer();
        _;
    }

    // ============ Constructor ============

    constructor(
        address token,
        address relayer,
        uint256 maxStakePerTx
    ) {
        TOKEN_ADDRESS = token;
        RELAYER = relayer;
        MAX_STAKE_PER_TX = maxStakePerTx;
    }

    // ============ Staking Functions ============

    /**
     * @notice Add stakes to multiple choices in a session - gasless via relayer
     * @param sessionAddress Address of the StakeChoicesERC6909 session
     * @param choiceIds Array of choice IDs to stake to
     * @param amounts Array of amounts to stake to each choice
     */
    function addStakes(
        address sessionAddress,
        uint256[] calldata choiceIds,
        uint256[] calldata amounts
    ) external onlyRelayer {
        uint256 total = _sum(amounts);
        if (total > MAX_STAKE_PER_TX) revert AmountTooHigh();

        // Approve session contract for exact amount needed
        IERC20(TOKEN_ADDRESS).approve(sessionAddress, total);

        IStakeChoicesERC6909(sessionAddress).addStakes(choiceIds, amounts);
    }

    /**
     * @notice Remove stakes from multiple choices - gasless via relayer
     * @param sessionAddress Address of the StakeChoicesERC6909 session
     * @param choiceIds Array of choice IDs to remove stake from
     * @param amounts Array of amounts to remove from each choice
     */
    function removeStakes(
        address sessionAddress,
        uint256[] calldata choiceIds,
        uint256[] calldata amounts
    ) external onlyRelayer {
        IStakeChoicesERC6909(sessionAddress).removeStakes(choiceIds, amounts);
    }

    // ============ Helper Functions ============

    /**
     * @dev Calculate sum of array
     */
    function _sum(uint256[] calldata amounts) private pure returns (uint256 total) {
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
    }
}

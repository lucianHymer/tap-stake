// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IStakeChoicesERC6909 {
    function addStakes(uint256[] calldata choiceIds, uint256[] calldata amounts) external;
    function removeStakes(uint256[] calldata choiceIds, uint256[] calldata amounts) external;
}

/**
 * @title StakerWallet
 * @notice EIP-7702 delegation contract for gasless staking with ERC6909 sessions
 * @dev Minimal implementation - relies on ERC6909 events, no duplication
 */
contract StakerWallet is IStakeChoicesERC6909 {
    using SafeERC20 for IERC20;

    // ============ Immutable Config ============

    address public immutable tokenAddress;
    address public immutable stakeChoicesAddress;
    address public immutable relayer;
    uint256 public immutable maxStakePerTx;

    // ============ Errors ============

    error OnlyRelayer();
    error AmountTooHigh();
    error ZeroAddress();

    // ============ Modifiers ============

    modifier onlyRelayer() {
        if (msg.sender != relayer) revert OnlyRelayer();
        _;
    }

    // ============ Constructor ============

    constructor(address _token, address _stakeChoicesAddress, address _relayer, uint256 _maxStakePerTx) {
        if (_token == address(0)) revert ZeroAddress();
        if (_stakeChoicesAddress == address(0)) revert ZeroAddress();
        if (_relayer == address(0)) revert ZeroAddress();

        tokenAddress = _token;
        stakeChoicesAddress = _stakeChoicesAddress;
        relayer = _relayer;
        maxStakePerTx = _maxStakePerTx;
    }

    // ============ Staking Functions ============

    /**
     * @notice Add stakes to multiple choices in a session - gasless via relayer
     * @param choiceIds Array of choice IDs to stake to
     * @param amounts Array of amounts to stake to each choice
     */
    function addStakes(uint256[] calldata choiceIds, uint256[] calldata amounts) external onlyRelayer {
        uint256 total = _sum(amounts);
        if (total > maxStakePerTx) revert AmountTooHigh();

        // Approve session contract for exact amount needed
        IERC20(tokenAddress).safeIncreaseAllowance(stakeChoicesAddress, total);

        IStakeChoicesERC6909(stakeChoicesAddress).addStakes(choiceIds, amounts);
    }

    /**
     * @notice Remove stakes from multiple choices - gasless via relayer
     * @param choiceIds Array of choice IDs to remove stake from
     * @param amounts Array of amounts to remove from each choice
     */
    function removeStakes(uint256[] calldata choiceIds, uint256[] calldata amounts) external onlyRelayer {
        IStakeChoicesERC6909(stakeChoicesAddress).removeStakes(choiceIds, amounts);
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

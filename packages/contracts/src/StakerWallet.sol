// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title IStakeChoicesERC6909
 * @author StakeChoices Team
 * @notice Interface for multi-choice staking with ERC6909 receipt tokens
 */
interface IStakeChoicesERC6909 {
    /**
     * @notice Stake tokens to multiple choices
     * @param choiceIds Array of choice IDs to stake to
     * @param amounts Array of amounts to stake to each choice
     */
    function addStakes(uint256[] calldata choiceIds, uint256[] calldata amounts) external;

    /**
     * @notice Remove stakes from multiple choices
     * @param choiceIds Array of choice IDs to remove stake from
     * @param amounts Array of amounts to remove from each choice
     */
    function removeStakes(uint256[] calldata choiceIds, uint256[] calldata amounts) external;
}

/**
 * @title StakerWallet
 * @author StakeChoices Team
 * @notice EIP-7702 delegation contract for gasless staking with ERC6909 multi-tokens
 * @dev Minimal implementation - relies on ERC6909 events, no duplication
 */
contract StakerWallet is IStakeChoicesERC6909 {
    using SafeERC20 for IERC20;

    // ============ Immutable Config ============

    /// @notice Address of the ERC20 token to be staked
    address public immutable tokenAddress;

    /// @notice Address of the StakeChoicesERC6909 contract
    address public immutable stakeChoicesAddress;

    /// @notice Address of the authorized relayer for gasless transactions
    address public immutable relayer;

    /// @notice Maximum amount that can be transferred in a single transaction
    uint256 public immutable maxAmountPerTx;

    // ============ Errors ============

    error OnlyRelayer();
    error AmountTooHigh();
    error ZeroAddress();
    error ZeroBalance();

    // ============ Modifiers ============

    modifier onlyRelayer() {
        if (msg.sender != relayer) revert OnlyRelayer();
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the StakerWallet with configuration
     * @param _token Address of the ERC20 token to be staked
     * @param _stakeChoicesAddress Address of the StakeChoicesERC6909 contract
     * @param _relayer Address of the authorized relayer
     * @param _maxAmountPerTx Maximum amount allowed per transaction
     */
    constructor(address _token, address _stakeChoicesAddress, address _relayer, uint256 _maxAmountPerTx) {
        if (_token == address(0)) revert ZeroAddress();
        if (_stakeChoicesAddress == address(0)) revert ZeroAddress();
        if (_relayer == address(0)) revert ZeroAddress();

        tokenAddress = _token;
        stakeChoicesAddress = _stakeChoicesAddress;
        relayer = _relayer;
        maxAmountPerTx = _maxAmountPerTx;
    }

    // ============ Staking Functions ============

    /**
     * @notice Add stakes to multiple choices in a multi-token - gasless via relayer
     * @param choiceIds Array of choice IDs to stake to
     * @param amounts Array of amounts to stake to each choice
     */
    function addStakes(uint256[] calldata choiceIds, uint256[] calldata amounts) external onlyRelayer {
        uint256 total = _sum(amounts);
        if (total > maxAmountPerTx) revert AmountTooHigh();

        // Approve multi-token contract for exact amount needed
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

    /**
     * @notice Update stakes: remove all old stakes and redistribute to new choices
     * @param oldChoiceIds Array of choice IDs to remove stake from
     * @param oldAmounts Array of amounts to remove from each old choice
     * @param newChoiceIds Array of choice IDs to stake to
     * @param newAmounts Array of amounts to stake to each new choice
     */
    function updateStakes(
        uint256[] calldata oldChoiceIds,
        uint256[] calldata oldAmounts,
        uint256[] calldata newChoiceIds,
        uint256[] calldata newAmounts
    ) external onlyRelayer {
        // Remove all old stakes
        if (oldChoiceIds.length > 0) {
            IStakeChoicesERC6909(stakeChoicesAddress).removeStakes(oldChoiceIds, oldAmounts);
        }

        // Add new stakes
        uint256 total = _sum(newAmounts);
        if (total > maxAmountPerTx) revert AmountTooHigh();

        if (total > 0) {
            IERC20(tokenAddress).safeIncreaseAllowance(stakeChoicesAddress, total);
            IStakeChoicesERC6909(stakeChoicesAddress).addStakes(newChoiceIds, newAmounts);
        }
    }

    /**
     * @notice Withdraw up to 100 GTC from wallet to recipient
     * @param recipient Address to receive the tokens
     */
    function withdraw(address recipient) external onlyRelayer {
        uint256 balance = IERC20(tokenAddress).balanceOf(address(this));
        if (balance == 0) revert ZeroBalance();

        uint256 toTransfer = balance < 100e18 ? balance : 100e18;
        IERC20(tokenAddress).safeTransfer(recipient, toTransfer);
    }

    /**
     * @notice Remove all stakes and withdraw tokens to recipient in one transaction
     * @param choiceIds Array of choice IDs to remove stake from
     * @param amounts Array of amounts to remove from each choice
     * @param recipient Address to receive the withdrawn tokens
     */
    function unstakeAllAndWithdraw(
        uint256[] calldata choiceIds,
        uint256[] calldata amounts,
        address recipient
    ) external onlyRelayer {
        // Remove all stakes
        if (choiceIds.length > 0) {
            IStakeChoicesERC6909(stakeChoicesAddress).removeStakes(choiceIds, amounts);
        }

        // Withdraw tokens to recipient
        uint256 balance = IERC20(tokenAddress).balanceOf(address(this));
        if (balance == 0) revert ZeroBalance();

        uint256 toTransfer = balance < 100e18 ? balance : 100e18;
        IERC20(tokenAddress).safeTransfer(recipient, toTransfer);
    }

    // ============ Helper Functions ============

    /**
     * @notice Calculate sum of array
     * @dev Internal helper to sum an array of amounts
     * @param amounts Array of amounts to sum
     * @return total The sum of all amounts
     */
    function _sum(uint256[] calldata amounts) private pure returns (uint256 total) {
        for (uint256 i = 0; i < amounts.length; ++i) {
            total += amounts[i];
        }
    }
}

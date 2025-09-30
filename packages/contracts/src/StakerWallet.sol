// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IStake {
    function stake(uint256 amount) external;
}

/**
 * @title StakerWallet
 * @notice EIP-7702 delegation contract for gasless staking
 * @dev Simple whitelisted relayer approach - ONE SIGNATURE ONLY!
 */
contract StakerWallet {
    address public immutable TOKEN_ADDRESS;
    address public immutable STAKE_CONTRACT;
    address public immutable RELAYER;
    uint256 public constant MAX_STAKE_PER_TX = 1000e18; // Reasonable limit

    error OnlyRelayer();
    error AmountTooHigh();
    error StakeFailed();

    event StakeExecuted(address indexed account, uint256 amount);

    modifier onlyRelayer() {
        if (msg.sender != RELAYER) revert OnlyRelayer();
        _;
    }

    constructor(address token, address stakeContract, address relayer) {
        TOKEN_ADDRESS = token;
        STAKE_CONTRACT = stakeContract;
        RELAYER = relayer;
    }

    /**
     * @notice Execute approve + stake - can only be called by whitelisted relayer
     * @dev The security comes from:
     *      1. EIP-7702: only the EOA owner can sign the authorization
     *      2. Relayer whitelist: only trusted relayer can execute
     *      3. Amount limit: bounded maximum damage
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external onlyRelayer {
        // Validate amount
        if (amount > MAX_STAKE_PER_TX) revert AmountTooHigh();

        // Approve only the needed amount
        IERC20(TOKEN_ADDRESS).approve(STAKE_CONTRACT, amount);

        // Execute stake
        IStake(STAKE_CONTRACT).stake(amount);

        // Clear approval for extra safety
        IERC20(TOKEN_ADDRESS).approve(STAKE_CONTRACT, 0);

        emit StakeExecuted(address(this), amount);
    }
}

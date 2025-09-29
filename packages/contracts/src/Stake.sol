// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Stake {
    IERC20 public immutable stakingToken;

    mapping(address => uint256) public stakedBalance;
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount);

    constructor(address _stakingToken) {
        stakingToken = IERC20(_stakingToken);
    }

    /**
     * Stake tokens - requires prior approval
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        // Transfer tokens from user to this contract
        // This requires the user to have approved this contract
        stakingToken.transferFrom(msg.sender, address(this), amount);

        // Update staking records
        stakedBalance[msg.sender] += amount;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    /**
     * View function to check a user's staked balance
     */
    function getStakedBalance(address user) external view returns (uint256) {
        return stakedBalance[user];
    }
}
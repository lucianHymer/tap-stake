// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title TestERC20
 * @author StakeChoices Team
 * @notice Test ERC20 token for development and testing
 * @dev DO NOT deploy on mainnet - public mint function for testing only
 */
contract TestERC20 is ERC20 {
    /**
     * @notice Deploy test token with initial supply
     * @dev Mints 1M tokens to deployer for testing
     */
    constructor() ERC20("Test Token", "TEST") {
        // Mint 1M tokens to deployer for testing
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }

    /**
     * @notice Public mint function for easy testing
     * @dev DO NOT deploy on mainnet!
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

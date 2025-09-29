// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    constructor() ERC20("Test Token", "TEST") {
        // Mint 1M tokens to deployer for testing
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    /**
     * Public mint function for easy testing
     * DO NOT deploy on mainnet!
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
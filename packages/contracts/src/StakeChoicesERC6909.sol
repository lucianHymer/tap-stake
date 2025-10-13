// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC6909} from "@openzeppelin/contracts/token/ERC6909/ERC6909.sol";
import {ERC6909Metadata} from "@openzeppelin/contracts/token/ERC6909/extensions/ERC6909Metadata.sol";
import {ERC6909TokenSupply} from "@openzeppelin/contracts/token/ERC6909/extensions/ERC6909TokenSupply.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * @title StakeChoicesERC6909
 * @notice ERC6909-based multi-choice staking with tradeable positions
 * @dev Minimal implementation using OpenZeppelin's ERC6909 with TokenSupply tracking
 */
contract StakeChoicesERC6909 is ERC6909Metadata, ERC6909TokenSupply, Initializable {
    // ============ State Variables ============

    IERC20 public stakingToken;
    string public name;
    address public factory;

    // ============ Errors ============

    error LengthMismatch();
    error AlreadyNamed();
    error AlreadySymboled();

    // ============ Constructor ============

    /**
     * @dev Implementation contract constructor - only called once
     */
    constructor() {
        _disableInitializers();
    }

    // ============ Initialization ============

    /**
     * @notice Initialize a cloned token instance
     * @param _stakingToken The ERC20 token used for staking
     * @param _name Human-readable name for the token
     */
    function initialize(
        address _stakingToken,
        string memory _name
    ) external initializer {
        stakingToken = IERC20(_stakingToken);
        name = _name;
        factory = msg.sender;
    }

    // ============ Core Staking Functions ============

    /**
     * @notice Stake tokens to multiple choices, receiving ERC6909 receipt tokens
     * @param choiceIds Array of choice IDs to stake to
     * @param amounts Array of amounts to stake to each choice
     */
    function addStakes(
        uint256[] calldata choiceIds,
        uint256[] calldata amounts
    ) external {
        if (choiceIds.length != amounts.length) revert LengthMismatch();

        uint256 totalToAdd;
        for (uint256 i = 0; i < choiceIds.length; i++) {
            totalToAdd += amounts[i];
        }

        // Transfer staking tokens from user
        stakingToken.transferFrom(msg.sender, address(this), totalToAdd);

        // Mint ERC6909 receipt tokens - choiceId IS the tokenId
        for (uint256 i = 0; i < choiceIds.length; i++) {
            _mint(msg.sender, choiceIds[i], amounts[i]);
        }
    }

    /**
     * @notice Remove stakes from multiple choices by burning ERC6909 receipt tokens
     * @param choiceIds Array of choice IDs to remove stake from
     * @param amounts Array of amounts to remove from each choice
     */
    function removeStakes(
        uint256[] calldata choiceIds,
        uint256[] calldata amounts
    ) external {
        if (choiceIds.length != amounts.length) revert LengthMismatch();

        uint256 totalToRemove;
        for (uint256 i = 0; i < choiceIds.length; i++) {
            totalToRemove += amounts[i];
        }

        // Burn ERC6909 receipt tokens - choiceId IS the tokenId
        for (uint256 i = 0; i < choiceIds.length; i++) {
            _burn(msg.sender, choiceIds[i], amounts[i]);
        }

        // Return staking tokens to user
        stakingToken.transfer(msg.sender, totalToRemove);
    }

    // ============ Metadata Functions ============

    /**
     * @notice Set the name for a choice token (once only, anyone can set)
     * @param id The token ID (choice ID)
     * @param choiceName The name for this choice
     */
    function setChoiceName(uint256 id, string calldata choiceName) external {
        if (bytes(name(id)).length != 0) revert AlreadyNamed();
        _setName(id, choiceName);
    }

    /**
     * @notice Set the symbol for a choice token (once only, anyone can set)
     * @param id The token ID (choice ID)
     * @param choiceSymbol The symbol for this choice
     */
    function setChoiceSymbol(uint256 id, string calldata choiceSymbol) external {
        if (bytes(symbol(id)).length != 0) revert AlreadySymboled();
        _setSymbol(id, choiceSymbol);
    }

    // ============ Internal Functions ============

    /**
     * @dev Override to set 18 decimals for all tokens
     */
    function decimals(uint256) public pure override returns (uint8) {
        return 18;
    }

    /**
     * @dev Override _update to call both parent implementations
     */
    function _update(
        address from,
        address to,
        uint256 id,
        uint256 value
    ) internal virtual override(ERC6909, ERC6909TokenSupply) {
        super._update(from, to, id, value);
    }
}

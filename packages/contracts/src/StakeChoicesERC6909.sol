// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC6909} from "@openzeppelin/contracts/token/ERC6909/ERC6909.sol";
import {ERC6909Metadata} from "@openzeppelin/contracts/token/ERC6909/extensions/ERC6909Metadata.sol";
import {ERC6909TokenSupply} from "@openzeppelin/contracts/token/ERC6909/extensions/ERC6909TokenSupply.sol";
import {ERC6909ContentURI} from "@openzeppelin/contracts/token/ERC6909/extensions/ERC6909ContentURI.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

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
 * @title StakeChoicesERC6909
 * @author Lucian Hymer
 * @notice ERC6909-based multi-choice staking with tradeable positions
 * @dev Minimal implementation using OpenZeppelin's ERC6909 with TokenSupply tracking
 */
contract StakeChoicesERC6909 is
    ERC6909ContentURI,
    ERC6909Metadata,
    ERC6909TokenSupply,
    Initializable,
    IStakeChoicesERC6909
{
    using SafeERC20 for IERC20;

    // ============ Constants ============

    string private constant _ID_NAMESPACE = "v1.stakechoices";

    // ============ State Variables ============

    /// @notice The ERC20 token used for staking
    IERC20 public stakingToken;

    /// @notice Human-readable name for this staking session
    string private _name;

    /// @notice Address of the factory contract that deployed this instance
    address public factory;

    // ============ Errors ============

    error LengthMismatch();
    error MetadataAlreadySet();
    error NameCannotBeEmpty();

    // ============ Constructor ============

    /**
     * @notice Implementation contract constructor - only called once
     * @dev Disables initialization to prevent implementation contract from being initialized
     */
    constructor() {
        _disableInitializers();
    }

    // ============ Initialization ============

    /**
     * @notice Initialize a cloned token instance
     * @param stakingToken_ The ERC20 token used for staking
     * @param name_ Human-readable name for the session
     */
    function initialize(address stakingToken_, string calldata name_) external initializer {
        stakingToken = IERC20(stakingToken_);
        _name = name_;
        factory = msg.sender;
    }

    // ============ Core Staking Functions ============

    /**
     * @notice Stake tokens to multiple choices, receiving ERC6909 receipt tokens
     * @param choiceIds Array of choice IDs to stake to
     * @param amounts Array of amounts to stake to each choice
     */
    function addStakes(uint256[] calldata choiceIds, uint256[] calldata amounts) external {
        if (choiceIds.length != amounts.length) revert LengthMismatch();

        uint256 totalToAdd = 0;
        for (uint256 i = 0; i < choiceIds.length; ++i) {
            totalToAdd += amounts[i];
        }

        // Transfer staking tokens from user
        stakingToken.safeTransferFrom(msg.sender, address(this), totalToAdd);

        // Mint ERC6909 receipt tokens - choiceId IS the tokenId
        for (uint256 i = 0; i < choiceIds.length; ++i) {
            _mint(msg.sender, choiceIds[i], amounts[i]);
        }
    }

    /**
     * @notice Remove stakes from multiple choices by burning ERC6909 receipt tokens
     * @param choiceIds Array of choice IDs to remove stake from
     * @param amounts Array of amounts to remove from each choice
     */
    function removeStakes(uint256[] calldata choiceIds, uint256[] calldata amounts) external {
        if (choiceIds.length != amounts.length) revert LengthMismatch();

        uint256 totalToRemove = 0;
        for (uint256 i = 0; i < choiceIds.length; ++i) {
            totalToRemove += amounts[i];
        }

        // Burn ERC6909 receipt tokens - choiceId IS the tokenId
        for (uint256 i = 0; i < choiceIds.length; ++i) {
            _burn(msg.sender, choiceIds[i], amounts[i]);
        }

        // Return staking tokens to user
        stakingToken.safeTransfer(msg.sender, totalToRemove);
    }

    // ============ Metadata Functions ============

    /**
     * @notice Get the session/contract name
     * @return The human-readable name for this staking session
     */
    function name() public view returns (string memory) {
        return _name;
    }

    /**
     * @notice Compute deterministic token ID from creator address and salt
     * @param creator The address creating the token ID
     * @param salt Arbitrary bytes32 salt for namespacing
     * @return The deterministic token ID
     */
    function computeId(address creator, bytes32 salt) public pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(_ID_NAMESPACE, creator, salt)));
    }

    /**
     * @notice Register metadata for a choice token (once only, anyone can register)
     * @dev Token ID is derived from msg.sender and salt for deterministic cross-chain IDs
     * @param salt Arbitrary bytes32 salt for namespacing, allows user to define their own scheme
     * @param choiceName The name for this choice (required, non-empty)
     * @param choiceSymbol The symbol for this choice (optional)
     * @param uri The URI for this choice (optional)
     */
    function registerChoice(bytes32 salt, string calldata choiceName, string calldata choiceSymbol, string calldata uri)
        external
    {
        uint256 id = computeId(msg.sender, salt);

        // Validate name is non-empty
        if (bytes(choiceName).length == 0) revert NameCannotBeEmpty();

        // Check metadata not already set
        string memory currentName = name(id);
        if (bytes(currentName).length != 0) revert MetadataAlreadySet();

        // Set all metadata
        _setName(id, choiceName);
        _setSymbol(id, choiceSymbol);
        _setTokenURI(id, uri);
    }

    // ============ Internal Functions ============

    /**
     * @notice Returns the number of decimals for a given token ID
     * @dev Override to match staking token decimals for all choice tokens
     * @param id The token ID (unused, all tokens have same decimals)
     * @return The number of decimals for the token
     */
    function decimals(uint256 id) public view override returns (uint8) {
        return IERC20Metadata(address(stakingToken)).decimals();
    }

    /**
     * @notice Internal function to update token balances
     * @dev Override _update to call all parent implementations
     * @param from The address tokens are transferred from (address(0) for minting)
     * @param to The address tokens are transferred to (address(0) for burning)
     * @param id The token ID being transferred
     * @param value The amount of tokens being transferred
     */
    function _update(address from, address to, uint256 id, uint256 value)
        internal
        virtual
        override(ERC6909, ERC6909TokenSupply)
    {
        super._update(from, to, id, value);
    }
}

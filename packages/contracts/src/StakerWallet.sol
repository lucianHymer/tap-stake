// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IStake {
    function stake(uint256 amount) external;
}

/**
 * @title StakerWallet
 * @notice EIP-7702 delegation contract for gasless staking
 * @dev Uses ERC-7201 namespaced storage and EIP-712 signatures
 */
contract StakerWallet {
    using ECDSA for bytes32;

    // ERC-7201 namespaced storage to prevent collision on re-delegation
    /// @custom:storage-location erc7201:stakerwallet.main
    struct StakerWalletStorage {
        mapping(address => uint256) nonces;
    }

    // keccak256(abi.encode(uint256(keccak256("stakerwallet.main")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant STAKERWALLET_STORAGE_LOCATION =
        0xf3eb2a05d627e0d8f655578323b722a8c5b2b37da7dffa80986448fef78f9d00;

    function _getStakerWalletStorage() private pure returns (StakerWalletStorage storage $) {
        assembly {
            $.slot := STAKERWALLET_STORAGE_LOCATION
        }
    }

    bytes32 private constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

    bytes32 private constant STAKE_AUTHORIZATION_TYPEHASH = keccak256(
        "StakeAuthorization(address account,uint256 nonce,uint256 amount,uint256 deadline)"
    );

    address public immutable SELF;
    address public immutable TOKEN_ADDRESS;
    address public immutable STAKE_CONTRACT;

    error SignatureExpired();
    error InvalidSignature();
    error StakeFailed();
    error OnlyDelegatedEOA();

    event StakeExecuted(address indexed account, uint256 amount, uint256 nonce);

    constructor(address token, address stakeContract) {
        SELF = address(this);  // Capture implementation address at deploy
        TOKEN_ADDRESS = token;
        STAKE_CONTRACT = stakeContract;
    }

    function DOMAIN_SEPARATOR() public view returns (bytes32) {
        return keccak256(abi.encode(
            DOMAIN_TYPEHASH,
            keccak256(bytes("StakerWallet")),
            keccak256(bytes("1")),
            block.chainid,
            SELF  // Use implementation address for better wallet UX
        ));
    }

    /**
     * @notice Execute approve + stake with user's signature authorization
     * @dev msg.sender is the relayer, address(this) is the EOA in delegated context
     * @param amount Amount of tokens to stake
     * @param deadline Signature expiration timestamp
     * @param signature EIP-712 signature from the EOA owner
     */
    function stakeWithAuthorization(
        uint256 amount,
        uint256 deadline,
        bytes calldata signature
    ) external {
        // Verify deadline
        if (block.timestamp > deadline) revert SignatureExpired();

        StakerWalletStorage storage $ = _getStakerWalletStorage();
        uint256 currentNonce = $.nonces[address(this)];

        // Build EIP-712 hash
        bytes32 structHash = keccak256(abi.encode(
            STAKE_AUTHORIZATION_TYPEHASH,
            address(this),  // EOA account (this contract IS at EOA's address)
            currentNonce,   // nonce
            amount,         // amount
            deadline        // deadline
        ));

        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR(),
            structHash
        ));

        address signer = digest.recover(signature);
        if (signer != address(this)) revert InvalidSignature();

        // Increment nonce before external calls (CEI pattern)
        $.nonces[address(this)]++;

        // Approve only the needed amount
        IERC20(TOKEN_ADDRESS).approve(STAKE_CONTRACT, amount);

        // Execute stake
        IStake(STAKE_CONTRACT).stake(amount);

        // Clear approval for extra safety
        IERC20(TOKEN_ADDRESS).approve(STAKE_CONTRACT, 0);

        emit StakeExecuted(address(this), amount, currentNonce);
    }

    /**
     * @notice Get the current nonce for an account
     * @param account The account to query
     * @return The current nonce
     */
    function getNonce(address account) external view returns (uint256) {
        StakerWalletStorage storage $ = _getStakerWalletStorage();
        return $.nonces[account];
    }
}
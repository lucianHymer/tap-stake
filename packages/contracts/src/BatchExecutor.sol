// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BatchExecutor {
    struct Call {
        address target;
        uint256 value;
        bytes data;
    }

    error ExecutionFailed(uint256 index, bytes returnData);

    event BatchExecuted(address indexed executor, uint256 callCount);

    /**
     * Execute multiple calls in a single transaction
     * Can only be called by the EOA that delegated to this contract
     */
    function executeBatch(Call[] calldata calls) external payable returns (bytes[] memory results) {
        // Ensure caller is the delegating EOA (msg.sender == address(this) in delegated context)
        require(msg.sender == address(this), "Only delegated EOA can execute");

        results = new bytes[](calls.length);

        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory returnData) = calls[i].target.call{value: calls[i].value}(calls[i].data);
            if (!success) {
                revert ExecutionFailed(i, returnData);
            }
            results[i] = returnData;
        }

        emit BatchExecuted(msg.sender, calls.length);
    }

    /**
     * Convenience function for approve + stake pattern
     */
    function approveAndStake(
        IERC20 token,
        address stakeContract,
        uint256 amount
    ) external {
        // This will be called in delegated context, so address(this) is the EOA
        require(msg.sender == address(this), "Only delegated EOA can execute");

        // Approve the stake contract
        token.approve(stakeContract, amount);

        // Call stake function on the contract
        // Note: This assumes stakeContract implements stake(uint256)
        (bool success,) = stakeContract.call(abi.encodeWithSignature("stake(uint256)", amount));
        require(success, "Stake failed");
    }
}
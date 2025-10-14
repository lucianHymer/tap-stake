// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {StakeChoicesFactory} from "../src/StakeChoicesFactory.sol";
import {StakeChoicesERC6909} from "../src/StakeChoicesERC6909.sol";
import {TestERC20} from "../src/TestERC20.sol";

contract StakeChoicesFactoryTest is Test {
    StakeChoicesFactory public factory;
    TestERC20 public token;

    address public user = address(0x1);

    function setUp() public {
        factory = new StakeChoicesFactory();
        token = new TestERC20();

        // Mint tokens to user
        token.mint(user, 1000 ether);
    }

    function testImplementationIsSet() public {
        address impl = factory.implementation();
        assertNotEq(impl, address(0));

        // Verify it's a StakeChoicesERC6909 contract
        StakeChoicesERC6909 implContract = StakeChoicesERC6909(impl);
        // Should be initialized (constructor calls _disableInitializers)
        vm.expectRevert();
        implContract.initialize(address(token), "Should Fail");
    }

    function testDeployToken() public {
        address tokenAddress = factory.deployToken(
            address(token),
            "My Staking Session"
        );

        assertNotEq(tokenAddress, address(0));

        // Verify initialization
        StakeChoicesERC6909 deployed = StakeChoicesERC6909(tokenAddress);
        assertEq(address(deployed.stakingToken()), address(token));
        assertEq(deployed.name(), "My Staking Session");
        assertEq(deployed.factory(), address(factory));
    }

    function testDeployTokenEmitsEvent() public {
        vm.recordLogs();
        address deployed = factory.deployToken(address(token), "My Session");

        // Verify event was emitted by checking logs
        Vm.Log[] memory logs = vm.getRecordedLogs();
        bool foundEvent = false;

        for (uint i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == keccak256("TokenDeployed(address,address,string)")) {
                foundEvent = true;
                break;
            }
        }

        assertTrue(foundEvent, "TokenDeployed event not emitted");
        assertNotEq(deployed, address(0));
    }

    function testDeployedTokenIsUsable() public {
        address sessionAddress = factory.deployToken(
            address(token),
            "Usable Session"
        );

        StakeChoicesERC6909 session = StakeChoicesERC6909(sessionAddress);

        // User can stake
        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = 1;
        amounts[0] = 100 ether;

        vm.startPrank(user);
        token.approve(sessionAddress, 100 ether);
        session.addStakes(choiceIds, amounts);
        vm.stopPrank();

        // Verify stake
        assertEq(session.balanceOf(user, 1), 100 ether);
    }

    function testDeployMultipleTokens() public {
        address token1 = factory.deployToken(address(token), "Session 1");
        address token2 = factory.deployToken(address(token), "Session 2");
        address token3 = factory.deployToken(address(token), "Session 3");

        // All should be different addresses
        assertTrue(token1 != token2);
        assertTrue(token1 != token3);
        assertTrue(token2 != token3);

        // All should be initialized properly
        assertEq(StakeChoicesERC6909(token1).name(), "Session 1");
        assertEq(StakeChoicesERC6909(token2).name(), "Session 2");
        assertEq(StakeChoicesERC6909(token3).name(), "Session 3");
    }

    function testDeployTokenDeterministic() public {
        bytes32 salt = keccak256("my-salt");

        address tokenAddress = factory.deployTokenDeterministic(
            address(token),
            "Deterministic Session",
            salt
        );

        assertNotEq(tokenAddress, address(0));

        // Verify initialization
        StakeChoicesERC6909 deployed = StakeChoicesERC6909(tokenAddress);
        assertEq(address(deployed.stakingToken()), address(token));
        assertEq(deployed.name(), "Deterministic Session");
    }

    function testDeployTokenDeterministicEmitsEvent() public {
        bytes32 salt = keccak256("test-salt");

        vm.recordLogs();
        address deployed = factory.deployTokenDeterministic(
            address(token),
            "Test Session",
            salt
        );

        // Verify event was emitted by checking logs
        Vm.Log[] memory logs = vm.getRecordedLogs();
        bool foundEvent = false;

        for (uint i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == keccak256("TokenDeployed(address,address,string)")) {
                foundEvent = true;
                break;
            }
        }

        assertTrue(foundEvent, "TokenDeployed event not emitted");
        assertNotEq(deployed, address(0));
    }

    function testPredictTokenAddress() public {
        bytes32 salt = keccak256("prediction-test");

        // Predict the address
        address predicted = factory.predictTokenAddress(salt);

        // Deploy with same salt
        address actual = factory.deployTokenDeterministic(
            address(token),
            "Predicted Session",
            salt
        );

        // Should match
        assertEq(predicted, actual);
    }

    function testDeterministicDeploymentWithSameSaltFails() public {
        bytes32 salt = keccak256("duplicate-salt");

        // First deployment succeeds
        factory.deployTokenDeterministic(
            address(token),
            "First Session",
            salt
        );

        // Second deployment with same salt should fail
        vm.expectRevert();
        factory.deployTokenDeterministic(
            address(token),
            "Second Session",
            salt
        );
    }

    function testDifferentSaltsProduceDifferentAddresses() public {
        bytes32 salt1 = keccak256("salt-1");
        bytes32 salt2 = keccak256("salt-2");

        address addr1 = factory.deployTokenDeterministic(
            address(token),
            "Session 1",
            salt1
        );

        address addr2 = factory.deployTokenDeterministic(
            address(token),
            "Session 2",
            salt2
        );

        assertTrue(addr1 != addr2);
    }

    function testDeployedCloneCannotBeReinitialized() public {
        address tokenAddress = factory.deployToken(
            address(token),
            "Locked Session"
        );

        StakeChoicesERC6909 deployed = StakeChoicesERC6909(tokenAddress);

        // Should not be able to initialize again
        vm.expectRevert();
        deployed.initialize(address(token), "Hack Attempt");
    }

    function testFactoryDeploysMinimalProxies() public {
        address token1 = factory.deployToken(address(token), "Session 1");
        address token2 = factory.deployToken(address(token), "Session 2");

        // Both should point to same implementation
        // We can verify this by checking they're minimal proxies
        // and that they use very little deployment gas

        // The key test: both clones should work independently
        uint256[] memory choiceIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        choiceIds[0] = 1;
        amounts[0] = 50 ether;

        vm.startPrank(user);
        token.approve(token1, 50 ether);
        StakeChoicesERC6909(token1).addStakes(choiceIds, amounts);

        token.approve(token2, 50 ether);
        StakeChoicesERC6909(token2).addStakes(choiceIds, amounts);
        vm.stopPrank();

        // Each should have independent state
        assertEq(StakeChoicesERC6909(token1).balanceOf(user, 1), 50 ether);
        assertEq(StakeChoicesERC6909(token2).balanceOf(user, 1), 50 ether);
    }

    function testDeterministicAddressIsPredictable() public {
        bytes32 salt = bytes32(uint256(42));

        // Predict first
        address predicted = factory.predictTokenAddress(salt);

        // Deploy later
        address deployed = factory.deployTokenDeterministic(
            address(token),
            "Predictable",
            salt
        );

        assertEq(predicted, deployed);
    }

    function testDeployWithDifferentStakingTokens() public {
        TestERC20 token2 = new TestERC20();

        address session1 = factory.deployToken(address(token), "Token 1 Session");
        address session2 = factory.deployToken(address(token2), "Token 2 Session");

        assertEq(
            address(StakeChoicesERC6909(session1).stakingToken()),
            address(token)
        );
        assertEq(
            address(StakeChoicesERC6909(session2).stakingToken()),
            address(token2)
        );
    }

    function testGasSavingsFromClones() public {
        // Deploy using factory (minimal proxy)
        uint256 gasBefore = gasleft();
        factory.deployToken(address(token), "Clone Session");
        uint256 cloneGas = gasBefore - gasleft();

        // Deploy directly (full contract)
        gasBefore = gasleft();
        new StakeChoicesERC6909();
        uint256 directGas = gasBefore - gasleft();

        // Clone should use significantly less gas
        // Typically ~95% savings, so clone gas should be < 10% of direct gas
        console.log("Clone deployment gas:", cloneGas);
        console.log("Direct deployment gas:", directGas);

        // Assert clone uses less than 20% of direct deployment gas
        // (being conservative in test to account for variations)
        assertTrue(cloneGas < directGas / 5);
    }
}

import hre from "hardhat";
import { expect } from "chai";
import type { CCIPLocalSimulator } from "../typechain-types";

describe("CCIP Bootcamp", function () {

    it("Day 2 Homework", async function () {
        // Create an instance of CCIPLocalSimulator.sol smart contract.
        const ccipLocalSimulatorFactory = await hre.ethers.getContractFactory("CCIPLocalSimulator");
        const ccipLocalSimulator: CCIPLocalSimulator = await ccipLocalSimulatorFactory.deploy();

        // Call the configuration() function to get Router contract address.
        const config: {
            chainSelector_: bigint;
            sourceRouter_: string;
            destinationRouter_: string;
            wrappedNative_: string;
            linkToken_: string;
            ccipBnM_: string;
            ccipLnM_: string;
        } = await ccipLocalSimulator.configuration();

        // Create instances of 
        //  - CrossChainNameServiceRegister.sol
        //  - CrossChainNameServiceReceiver.sol
        //  - CrossChainNameServiceLookup.sol 
        // smart contracts and call the enableChain() function where needed.
        const sourceLookup = await hre.ethers.deployContract("CrossChainNameServiceLookup");
        const register = await hre.ethers.deployContract("CrossChainNameServiceRegister", [config.sourceRouter_, await sourceLookup.getAddress()]);

        const destinationLookup = await hre.ethers.deployContract("CrossChainNameServiceLookup");
        const receiver = await hre.ethers.deployContract("CrossChainNameServiceReceiver", [config.destinationRouter_, await destinationLookup.getAddress(), config.chainSelector_]);

        register.enableChain(config.chainSelector_, await receiver.getAddress(), 200_000);

        // Call the setCrossChainNameServiceAddress function of the CrossChainNameServiceLookup.sol 
        // smart contract "source" instance and provide the address of the CrossChainNameServiceRegister.sol 
        // smart contract instance. Repeat the process for the CrossChainNameServiceLookup.sol smart contract
        // "receiver" instance and provide the address of the CrossChainNameServiceReceiver.sol smart 
        // contract instance.
        await sourceLookup.setCrossChainNameServiceAddress(await register.getAddress());
        await destinationLookup.setCrossChainNameServiceAddress(await receiver.getAddress());

        // Call the register() function and provide “alice.ccns” and Alice’s EOA address as function arguments.
        const [alice,] = await hre.ethers.getSigners();
        await register.register("alice.ccns");

        // Call the lookup() function and provide “alice.ccns” as a function argument. Assert that the
        // returned address is Alice’s EOA address.
        const address = await sourceLookup.lookup("alice.ccns");
        expect(address).to.equal(alice.address);
    });
});
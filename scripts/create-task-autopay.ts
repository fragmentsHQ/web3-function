import hre from "hardhat";
import { AutomateSDK, Web3Function } from "@gelatonetwork/automate-sdk";

const { ethers, w3f } = hre;

const main = async () => {
    // const oracle = await ethers.getContract("CoingeckoOracle");
    const autopayW3F = w3f.get("autopay");

    const [deployer] = await ethers.getSigners();
    const chainId = (await ethers.provider.getNetwork()).chainId;

    const automate = new AutomateSDK(chainId, deployer);
    const web3Function = new Web3Function(chainId, deployer);

    // Deploy Web3Function on IPFS
    console.log("Deploying Web3Function on IPFS...");
    const cid = await autopayW3F.deploy();
    console.log(`Web3Function IPFS CID: ${cid}`);

    // Create task using automate sdk
    console.log("Creating automate task...");
    const { taskId, tx } = await automate.createBatchExecTask({
        name: "Web3Function - AUTOPAY",
        web3FunctionHash: cid,
        web3FunctionArgs: {
            _from: "0x6d4b5acFB1C08127e8553CC41A9aC8F06610eFc7",
            _to: "0x6d4b5acFB1C08127e8553CC41A9aC8F06610eFc7",
            _amount: "100000000000000000000",
            _fromToken: "0x7ea6eA49B0b0Ae9c5db7907d139D9Cd3439862a1",
            _toToken: "0x7ea6eA49B0b0Ae9c5db7907d139D9Cd3439862a1",
            _toChain: "80001",
            _originDomain: "1735353714",
            _destinationDomain: "9991",
            _originContractAddress: "0x7958bb5aEED4a2F486CA522A207aC48546A67624",
            _destinationContractAddress: "0x885eDC2E09286316AF85788C6a76105EE6819646",
            _cycles: "2",
            _startTime: "1685513100",
            _interval: "120"
        },
    });
    await tx.wait();
    console.log(`Task created, taskId: ${taskId} (tx hash: ${tx.hash})`);
    console.log(
        `> https://beta.app.gelato.network/task/${taskId}?chainId=${chainId}`
    );
};

main()
    .then(() => {
        process.exit();
    })
    .catch((err) => {
        console.error("Error:", err.message);
        process.exit(1);
    });

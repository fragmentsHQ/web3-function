import hre from "hardhat";
import { AutomateSDK, Web3Function } from "@gelatonetwork/automate-sdk";

const { ethers, w3f } = hre;

const main = async () => {
    // const oracle = await ethers.getContract("CoingeckoOracle");
    const xstreamW3F = w3f.get("xstream");

    const [deployer] = await ethers.getSigners();
    const chainId = (await ethers.provider.getNetwork()).chainId;

    const automate = new AutomateSDK(chainId, deployer);
    const web3Function = new Web3Function(chainId, deployer);

    // Deploy Web3Function on IPFS
    console.log("Deploying Web3Function on IPFS...");
    const cid = await xstreamW3F.deploy();
    console.log(`Web3Function IPFS CID: ${cid}`);

    // Create task using automate sdk
    console.log("Creating automate task...");
    const { taskId, tx } = await automate.createBatchExecTask({
        name: "Web3Function - XSTREAM",
        web3FunctionHash: cid,
        web3FunctionArgs: {
            fromChain: "5",
            toChain: "80001",
            receiverAddress: "0x6d4b5acFB1C08127e8553CC41A9aC8F06610eFc7",
            senderAddress: "0x6d4b5acFB1C08127e8553CC41A9aC8F06610eFc7",
            originContractAddress: "0x23004200e3294E4671db026f842B00B6888ec0E3",
            destinationContractAddress: "0x0A69EaE3671D177d9E564c7f656515b74d434298",
            tokenAddress: "0x3427910EBBdABAD8e02823DFe05D34a65564b1a0",
            flowRate: "5000000000000",
            amount: "100000000000000000000",
            destinationDomain: "9991"
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

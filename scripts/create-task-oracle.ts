import hre from "hardhat";
import { AutomateSDK, Web3Function } from "@gelatonetwork/automate-sdk";

const { ethers, w3f } = hre;

const main = async () => {

  const oracleW3f = w3f.get("oracle");

  const [deployer] = await ethers.getSigners();
  const chainId = (await ethers.provider.getNetwork()).chainId;

  const automate = new AutomateSDK(chainId, deployer);
  const web3Function = new Web3Function(chainId, deployer);

  // Deploy Web3Function on IPFS
  console.log("Deploying Web3Function on IPFS...");
  const cid = await oracleW3f.deploy();
  console.log(`Web3Function IPFS CID: ${cid}`);

  // Create task using automate sdk
  console.log("Creating automate task...");
  const { taskId, tx } = await automate.createBatchExecTask({
    name: "Web3Function - Eth Oracle",
    web3FunctionHash: cid,
    web3FunctionArgs: {
      "_from": "0x8D434CEB2f11e3cc9f347a7beD31eFF606C69C2d",
      "_to": "0x6d4b5acFB1C08127e8553CC41A9aC8F06610eFc7",
      "_amount": "896326930545677144",
      "_price": "1200",
      "_fromToken": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      "_toToken": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "_tokenA": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      "_tokenB": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "_fromChain": 1,
      "_toChain": 80001,
      "_originDomain": 1735353714,
      "_destinationDomain": 9991,
      "_originContractAddress": "0x7958bb5aEED4a2F486CA522A207aC48546A67624",
      "_destinationContractAddress": "0x885eDC2E09286316AF85788C6a76105EE6819646",
      "_cycles": 2,
      "_startTime": 1685513100,
      "_interval": 120
    },
  });
  await tx.wait();
  console.log(`Task created, taskId: ${taskId} (tx hash: ${tx.hash})`);
  console.log(
    `> https://beta.app.gelato.network/task/${taskId}?chainId=${chainId}`
  );

  // Set task specific secrets
  const secrets = oracleW3f.getSecrets();
  if (Object.keys(secrets).length > 0) {
    await web3Function.secrets.set(secrets, taskId);
    console.log(`Secrets set`);
  }
};

main()
  .then(() => {
    process.exit();
  })
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });

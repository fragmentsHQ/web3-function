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
      "_from": "0x6d4b5acFB1C08127e8553CC41A9aC8F06610eFc7",
      "_to": "0x6d4b5acFB1C08127e8553CC41A9aC8F06610eFc7",
      "_amount": "1000000000000000",
      "_price": "131048865",
      "_fromToken": "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
      "_toToken": "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
      "_tokenA": "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
      "_tokenB": "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
      "_fromChain": 5,
      "_toChain": 80001,
      "_originDomain": 1735353714,
      "_destinationDomain": 9991,
      "_originContractAddress": "0xA8e3315CE15cADdB4616AefD073e4CBF002C5D73",
      "_destinationContractAddress": "0x7f464d4f3D46552F936cb68c21a0A2dB3E32919F",
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

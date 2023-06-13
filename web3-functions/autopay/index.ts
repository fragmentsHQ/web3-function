import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "ethers";
import ky from "ky"; // we recommend using ky as axios doesn't support fetch by default

import { parseEther } from "ethers/lib/utils";

const IERC20 = [
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];
const AUTOPAY_CONTRACT = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_fromToken",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_toToken",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_toChain",
        "type": "uint256"
      },
      {
        "internalType": "uint32",
        "name": "_destinationDomain",
        "type": "uint32"
      },
      {
        "internalType": "address",
        "name": "_destinationContract",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_cycles",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_interval",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_relayerFeeInTransactingAsset",
        "type": "uint256"
      }
    ],
    "name": "_timeAutomateCron",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

Web3Function.onRun(async (context: any) => {
  const { userArgs, multiChainProvider } = context;

  const provider = multiChainProvider.default();

  const senderAddress = userArgs._from;
  const receiverAddress = userArgs._to;
  const amount = userArgs._amount;
  const fromToken = userArgs._fromToken;
  const toToken = userArgs._toToken;

  // connext module
  const fromChain = userArgs._fromChain;
  const toChain = userArgs._toChain;
  const originDomain = userArgs._originDomain;
  const destinationDomain = userArgs._destinationDomain;
  const originContractAddress = userArgs._originContractAddress;
  const destinationContractAddress = userArgs._destinationContractAddress;

  // gelatoModule
  const cycles = userArgs._cycles;
  const startTime = userArgs._startTime;
  const interval = userArgs._interval;

  console.log(
    "senderAddress",
    senderAddress,
    "receiverAddress",
    receiverAddress,
    "amount",
    amount,
    "fromToken",
    fromToken,
    "toToken",
    toToken,
    "toChain",
    toChain,
    "originDomain",
    originDomain,
    "destinationDomain",
    destinationDomain,
    "originContractAddress",
    originContractAddress,
    "destinationContractAddress",
    destinationContractAddress,
    "cycles",
    cycles,
    "startTime",
    startTime,
    "interval",
    interval
  )


  // APPROVAL CHECK
  // try {
  //   const tokenContract = new Contract(
  //     fromToken.toString(),
  //     IERC20,
  //     provider
  //   );
  //   const allowance = parseInt(await tokenContract.allowance(senderAddress, originContractAddress));

  //   if (allowance < amount) {
  //     return { canExec: false, message: `Amount is greater than allowance.` };
  //   }

  //   const balance = parseInt(await tokenContract.balanceOf(senderAddress));
  //   if (balance < amount) {
  //     return { canExec: false, message: `Insufficient Balance.` };
  //   }

  // } catch (error) {
  //   return { canExec: false, message: `ERROR in fetching allowance, ${error}` };
  // }

  // console.log("APPROVAL CHECK DONE")

  // API CALL FOR RELAYER FEE
  let FEE_USD: Number = 0;
  try {
    const connextRelayerFEE = `https://connext-relayer-fee.vercel.app/${originDomain}/${destinationDomain}`;

    const priceData: { FEE_USD: number } = await ky
      .get(connextRelayerFEE, { timeout: 15_000, retry: 5 })
      .json();
    FEE_USD = parseInt(priceData.FEE_USD.toString());
  } catch (error) {
    return { canExec: false, message: `Connext RELAYER FEE API call failed, ${error}` };
  }

  console.log("API CALL FOR RELAYER FEE DONE", FEE_USD);

  // ORIGIN CONTRACT INITILISATION
  let originContract;
  try {
    originContract = new Contract(
      originContractAddress,
      AUTOPAY_CONTRACT,
      provider
    );

  } catch (error) {
    return { canExec: false, message: `Contract Initialisation Failed,  ${error}` };
  }

  console.log("ORIGIN CONTRACT INITILISATION DONE", originContract);

  // Return execution call data
  return {
    canExec: true,
    callData: [
      {
        to: originContractAddress,
        data: originContract.interface.encodeFunctionData("_timeAutomateCron", [
          senderAddress.toString(),
          receiverAddress.toString(),
          amount.toString(),
          fromToken.toString(),
          toToken.toString(),
          toChain,
          destinationDomain,
          destinationContractAddress.toString(),
          cycles,
          startTime,
          interval,
          (FEE_USD).toString()
        ]),
      },
    ],
  };
});


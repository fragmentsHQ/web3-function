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
const CONDITIONAL_CONTRACT = [
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "_to",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "_amount",
        "type": "uint256[]"
      },
      {
        "internalType": "int256",
        "name": "_price",
        "type": "int256"
      },
      {
        "components": [
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
            "internalType": "address",
            "name": "_tokenA",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_tokenB",
            "type": "address"
          }
        ],
        "internalType": "struct Conditional.token[]",
        "name": "_token",
        "type": "tuple[]"
      },
      {
        "components": [
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
          }
        ],
        "internalType": "struct Conditional.connextModule[]",
        "name": "_connextModule",
        "type": "tuple[]"
      },
      {
        "components": [
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
            "internalType": "string",
            "name": "_web3FunctionHash",
            "type": "string"
          }
        ],
        "internalType": "struct Conditional.gelatoModule",
        "name": "_gelatoModule",
        "type": "tuple"
      }
    ],
    "name": "_createMultiplePriceFeedAutomate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
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
        "internalType": "int256",
        "name": "_price",
        "type": "int256"
      },
      {
        "components": [
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
            "internalType": "address",
            "name": "_tokenA",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_tokenB",
            "type": "address"
          }
        ],
        "internalType": "struct Conditional.token",
        "name": "_token",
        "type": "tuple"
      },
      {
        "components": [
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
          }
        ],
        "internalType": "struct Conditional.connextModule",
        "name": "_connextModule",
        "type": "tuple"
      },
      {
        "components": [
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
            "internalType": "string",
            "name": "_web3FunctionHash",
            "type": "string"
          }
        ],
        "internalType": "struct Conditional.gelatoModule",
        "name": "_gelatoModule",
        "type": "tuple"
      }
    ],
    "name": "_createPriceFeedAutomate",
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
  const price = userArgs._price;
  const fromToken = userArgs._fromToken;
  const toToken = userArgs._toToken;
  const tokenA = userArgs._tokenA;
  const tokenB = userArgs._tokenB;

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
    "price",
    price,
    "fromToken",
    fromToken,
    "toToken",
    toToken,
    "tokenA",
    tokenA,
    "tokenB",
    tokenB,
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
  // const priceDataA: { [key: string]: { usd: number } } = await ky

  // Get current gas price
  let gasFetched = 0;
  try {

    const coingeckoApiA = `https://api.blocknative.com/gasprices/blockprices?chainid=${fromChain}`;

    // console.log(coingeckoApiA);

    const priceDataA: any = await ky
      .get(coingeckoApiA, { timeout: 15_000, retry: 5 })
      .json();




    console.log("priceA", priceDataA.blockPrices[0].baseFeePerGas);
    gasFetched = parseInt(priceDataA.blockPrices[0].baseFeePerGas);

  } catch (err) {
    console.log({ canExec: false, message: `Coingecko call failed, ${err}` });
  }
  console.log(`Updating price: ${gasFetched}`);

  if (gasFetched != Math.floor(price)) {
    return { canExec: false, message: `Condition not met, GIVEN : ${price}, FETCHED : ${gasFetched}` };
  }


  // APPROVAL CHECK
  try {
    const tokenContract = new Contract(
      fromToken.toString(),
      IERC20,
      provider
    );
    const allowance = parseInt(await tokenContract.allowance(senderAddress, originContractAddress));

    if (allowance < amount) {
      return { canExec: false, message: `Amount is greater than allowance.` };
    }

    const balance = parseInt(await tokenContract.balanceOf(senderAddress));
    if (balance < amount) {
      return { canExec: false, message: `Insufficient Balance.` };
    }

  } catch (error) {
    return { canExec: false, message: `ERROR in fetching allowance, ${error}` };
  }

  console.log("APPROVAL CHECK DONE")

  // API CALL FOR RELAYER FEE
  let FEE_USD = 0;
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
      CONDITIONAL_CONTRACT,
      provider
    );

  } catch (error) {
    return { canExec: false, message: `Contract Initialisation Failed,  ${error}` };
  }

  console.log("ORIGIN CONTRACT INITILISATION DONE")

  // Return execution call data
  return {
    canExec: true,
    callData: [
      {
        to: originContractAddress,
        data: originContract.interface.encodeFunctionData("_priceFeedAutomateCron", [
          senderAddress.toString(),
          receiverAddress.toString(),
          amount.toString(),
          price.toString(),
          {
            _fromToken: fromToken.toString(),
            _toToken: toToken.toString(),
            _tokenA: tokenA.toString(),
            _tokenB: tokenB.toString()
          },
          {
            _toChain: toChain.toString(),
            _destinationDomain: destinationDomain.toString(),
            _destinationContract: destinationContractAddress.toString()
          },
          {
            _cycles: cycles.toString(),
            _startTime: startTime.toString(),
            _interval: interval.toString(),
            _web3FunctionHash: ""
          },
          FEE_USD.toString()
        ]),
      },
    ],
  };
});



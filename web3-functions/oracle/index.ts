import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "ethers";
import ky from "ky"; // we recommend using ky as axios doesn't support fetch by default

import { isAddress, parseEther } from "ethers/lib/utils";

const IERC20 = [
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const CONDITIONAL_CONTRACT = [
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
        "internalType": "uint256",
        "name": "_price",
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
      },
      {
        "internalType": "address",
        "name": "_swapper",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "_swapData",
        "type": "bytes"
      }
    ],
    "name": "_conditionalAutomateCron",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

const URL: any = {
  1: "https://api.0x.org/",
  5: "https://goerli.api.0x.org/",
  137: "https://polygon.api.0x.org/",
  80001: "https://mumbai.api.0x.org/",
  38: "https://bsc.api.0x.org/",
  10: "https://optimism.api.0x.org/",
  250: "https://fantom.api.0x.org/",
  42220: "https://celo.api.0x.org/",
  43114: "https://avalanche.api.0x.org/",
  42161: "https://arbitrum.api.0x.org/",
}

interface Response {
  price: string;
  guaranteedPrice: string;
  estimatedPriceImpact: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  estimatedGas: string;
  gasPrice: string;
  sellTokenToEthRate: string;
}

const IS_PROD = false;

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

  if (fromToken == ETH || toToken == ETH || fromToken == ZERO_ADDRESS || toToken == ZERO_ADDRESS) {
    return { canExec: false, message: "Native Currency Not Supported, TRY ERC20 TOKENS" };
  }

  let swapper: string = ZERO_ADDRESS;
  let swapData: string = "0x";
  let priceData: Response;
  try {
    const API = ky.extend({
      hooks: {
        beforeRequest: [
          request => {
            request.headers.set('0x-api-key', 'b40bf764-6025-4f73-8507-8f398720c356');
          }
        ]
      }
    });

    const ZeroXAPI = `swap/v1/quote?buyToken=${toToken}&sellToken=${fromToken}&sellAmount=${amount}`;

    console.log(URL[fromChain] + ZeroXAPI);

    priceData = await API
      .get(ZeroXAPI, { prefixUrl: URL[fromChain], timeout: 15_000, retry: 5 })
      .json();

    swapper = priceData.to;
    swapData = priceData.data;

    console.log(priceData.guaranteedPrice);
    console.log(swapper);
    console.log(swapData);
    console.log(priceData.estimatedGas);


    let priceFetched: Number = Math.floor(Number(priceData.guaranteedPrice));

    if (IS_PROD) {
      if (priceFetched != (price)) {
        console.log(`Condition not met, GIVEN : ${price}, FETCHED : ${priceFetched}`)
        return { canExec: false, message: `Condition not met, GIVEN : ${price}, FETCHED : ${priceFetched}` };
      }
    } else {
      if (priceFetched != (price)) {
        console.log(`Condition not met, GIVEN : ${price}, FETCHED : ${priceFetched}`);
      }
    }
  } catch (error) {
    console.error(error);
    return { canExec: false, message: `ZeroX API call failed, ${error}` };
  }


  // APPROVAL CHECK
  let balance;
  let decimals: number = 18;
  try {
    if (fromToken == ETH) {
      balance = (await provider.getBalance(senderAddress)).toString();

    } else {


      const tokenContract = new Contract(
        fromToken.toString(),
        IERC20,
        provider
      );
      const allowance = parseInt(await tokenContract.allowance(senderAddress, originContractAddress));

      if (allowance < amount) {
        return { canExec: false, message: `Amount is greater than allowance. ${allowance} ${amount}` };
      }

      balance = parseInt(await tokenContract.balanceOf(senderAddress));
      if (balance < amount) {
        return { canExec: false, message: `Insufficient Balance. ${balance} ${amount}` };
      }
      decimals = parseInt(await tokenContract.decimals());
    }

  } catch (error) {
    return { canExec: false, message: `ERROR in fetching allowance, ${error}` };
  }

  console.log("APPROVAL CHECK DONE", balance)

  // API CALL FOR RELAYER FEE
  let FEE = 0;
  if (fromChain != toChain) {
    try {
      const connextRelayerFEE = `https://connext-relayer-fee.vercel.app/${originDomain}/${destinationDomain}`;

      const priceData: { FEE: number } = await ky
        .get(connextRelayerFEE, { timeout: 15_000, retry: 5 })
        .json();
      FEE = parseInt(priceData.FEE.toString());
    } catch (error) {
      return { canExec: false, message: `Connext RELAYER FEE API call failed, ${error}` };
    }

    console.log("API CALL FOR RELAYER FEE DONE", FEE, ((amount / 10 ** decimals) / parseInt(priceData.sellTokenToEthRate)) * 10 ** 18);

    if (FEE > ((amount / 10 ** decimals) / parseInt(priceData.sellTokenToEthRate)) * 10 ** 18) {
      return { canExec: false, message: `Relayer FEE is greater than amount. ${FEE} ${((amount / 10 ** decimals) / parseInt(priceData.sellTokenToEthRate)) * 10 ** 18}` };
    }
  }


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
        data: originContract.interface.encodeFunctionData("_conditionalAutomateCron", [
          senderAddress.toString(),
          receiverAddress.toString(),
          amount.toString(),
          price.toString(),
          fromToken.toString(),
          toToken.toString(),
          toChain,
          destinationDomain,
          destinationContractAddress.toString(),
          cycles,
          startTime,
          interval,
          (FEE).toString(),
          String(swapper),
          String(swapData)
        ]),
        value: String(0)
      },
    ],
  };
});



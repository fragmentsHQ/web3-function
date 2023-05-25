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
const XSTREAM_CONTRACT = [
  "function _sendFlowMessage(uint256 _streamActionType,address _receiver,int96 _flowRate,uint256 relayerFeeInTransactingAsset,uint256 slippage,uint256 cost,address bridgingToken,address destinationContract,uint32 destinationDomain)",
  "function _sendToManyFlowMessage(address[] calldata receivers,int96[] calldata flowRates,uint96[] memory costs,uint256 _streamActionType,uint256 _relayerFee,uint256 slippage,address bridgingToken,address destinationContract,uint32 destinationDomain)",
];

Web3Function.onRun(async (context: any) => {
  const { userArgs, multiChainProvider } = context;

  const provider = multiChainProvider.default();

  const fromChain = userArgs.fromChain;
  const toChain = userArgs.toChain;
  const receiverAddress = userArgs.receiverAddress;
  const senderAddress = userArgs.senderAddress;
  const originContractAddress = userArgs.originContractAddress;
  const destinationContractAddress = userArgs.destinationContractAddress;
  const tokenAddress = userArgs.tokenAddress;
  const flowRate = userArgs.flowRate;
  const amount = userArgs.amount;
  const destinationDomain = userArgs.destinationDomain;


  // APPROVAL CHECK

  try {
    const tokenContract = new Contract(
      tokenAddress.toString(),
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
    const connextRelayerFEE = `https://connext-relayer-fee.vercel.app/1735353714/9991`;

    const priceData: { FEE_USD: number } = await ky
      .get(connextRelayerFEE, { timeout: 15_000, retry: 5 })
      .json();
    FEE_USD = parseInt(priceData.FEE_USD.toString());
  } catch (error) {
    return { canExec: false, message: `Connext RELAYER FEE API call failed, ${error}` };
  }

  console.log("API CALL FOR RELAYER FEE DONE")

  // ORIGIN CONTRACT INITILISATION
  let originContract;
  try {
    originContract = new Contract(
      originContractAddress.toString(),
      XSTREAM_CONTRACT,
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
        data: originContract.interface.encodeFunctionData("_sendFlowMessage", [
          "1",
          receiverAddress,
          flowRate.toString(),
          FEE_USD.toString(),
          "300",
          amount.toString(),
          tokenAddress,
          destinationContractAddress,
          destinationDomain,
        ]),
      },
    ],
  };
});

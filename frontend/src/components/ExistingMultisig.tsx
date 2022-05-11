import {
  useStarknet,
  useStarknetCall,
  useStarknetInvoke
} from "@starknet-react/core";
import React, { useEffect, useState } from "react";
import {
  CompiledContract, json, number
} from "starknet";
import { getSelectorFromName } from "starknet/dist/utils/hash";
import Button from "~/components/Button";
import { Input } from "~/components/Input";
import { useMultisigContract } from "~/hooks/multisigContractHook";

interface MultisigProps {
  contractAddress: string
}

export const ExistingMultisig = ({ contractAddress }: MultisigProps) => {
  const { account } = useStarknet();

  console.log(contractAddress, account)

  const [targetFunctionName, setTargetFunctionName] = useState<string>("");
  const [targetFunctionSelector, setTargetFunctionSelector] =
    useState<string>("");
  const [targetParameters, setTargetParameters] = useState<string>("");

  const [compiledMultisig, setCompiledMultisig] = useState<CompiledContract>();

  const { contract: multisigContract } = useMultisigContract(
    contractAddress
  );

  const { invoke: submitTransaction } = useStarknetInvoke({
    contract: multisigContract,
    method: "submit_transaction",
  });

  const { invoke: confirmTransaction } = useStarknetInvoke({
    contract: multisigContract,
    method: "confirm_transaction",
  });

  const { invoke: executeTransaction } = useStarknetInvoke({
    contract: multisigContract,
    method: "execute_transaction",
  });

  const { data: multisigTransactionCount } = useStarknetCall({
    contract: multisigContract,
    method: "get_transactions_len",
    args: [],
  });

  const latestTxIndex = number.toBN(multisigTransactionCount).toNumber() - 1;

  const { data: multisigLatestTransaction } = useStarknetCall({
    contract: multisigContract,
    method: "get_transaction",
    args: [latestTxIndex],
  });

  let latestTxTarget = "";
  let latestTxFunction = "";
  let latestTxConfirmation = 0;
  let latestTxArgs: [] = [];

  if (multisigLatestTransaction) {
    const tx = multisigLatestTransaction as any;
    latestTxTarget = number.toHex(tx.tx.to).toString();
    latestTxFunction = tx.tx.function_selector.toString();
    latestTxArgs = tx.tx_calldata.toString().split(",");
    latestTxConfirmation = number
      .toBN((multisigLatestTransaction as any).tx.num_confirmations)
      .toNumber();
  }

  useEffect(() => {
    if (!compiledMultisig) {
      getCompiledMultisig().then(setCompiledMultisig);
    }
  }, []);

  useEffect(() => {
    if (targetFunctionName) {
      const newSelector = number.toBN(getSelectorFromName(targetFunctionName));
      setTargetFunctionSelector(newSelector);
    }
  }, [targetFunctionName]);

  const getCompiledMultisig = async () => {
    // Can't import the JSON directly due to a bug in StarkNet: https://github.com/0xs34n/starknet.js/issues/104
    // (even if the issue is closed, the underlying Starknet issue remains)
    const raw = await fetch("/Multisig.json");
    const compiled = json.parse(await raw.text());
    return compiled;
  };

  const submit = async () => {
    const pars = targetParameters.split(" ").map((p) => number.toBN(p));

    await submitTransaction({
      args: [contractAddress, targetFunctionSelector, pars],
    });
  };

  const confirm = async () => {
    await confirmTransaction({
      args: [latestTxIndex],
    });
  };

  const execute = async () => {
    await executeTransaction({
      args: [latestTxIndex],
    });
  };

  const multisigLink =
    "https://goerli.voyager.online/contract/" + contractAddress;

  return (
    <div>
      <div>
        {contractAddress && (
          <div>
            Multisig contract:{" "}
            <a href={multisigLink} target="_blank">
              {contractAddress}
            </a>
          </div>
        )}
      </div>
      <div>
        {contractAddress && (
          <div>
            <div>
              <fieldset>
                <legend>Transaction creation</legend>
                <div>
                  Target function name:{" "}
                  <Input
                    type="text"
                    value={targetFunctionName}
                    onChange={(e) => setTargetFunctionName(e.target.value)}
                  ></Input>
                </div>
                <div>
                  Target function parameters:{" "}
                  <Input
                    type="text"
                    value={targetParameters}
                    onChange={(e) => setTargetParameters(e.target.value)}
                  ></Input>
                </div>
                <button onClick={submit}>Submit a new transaction</button>
              </fieldset>

              {multisigTransactionCount && +multisigTransactionCount > 0 && (
                <div>
                  <div>
                    <div>
                      <fieldset>
                        <legend>Latest multisig transaction's data</legend>

                        <div>
                          Number of confirmations: {latestTxConfirmation}
                        </div>
                        <div>Target contract address:: {latestTxTarget}</div>
                        <div>Target function selector: {latestTxFunction}</div>
                        <div>
                          Target function parameters:{" ["}
                          {latestTxArgs.map((arg, i) => (
                            <div style={{ marginLeft: "20px" }}>
                              {arg}
                              {i != latestTxArgs.length - 1 ? "," : ""}
                            </div>
                          ))}
                          {" ]"}
                        </div>
                      </fieldset>
                    </div>
                  </div>
                  <Button onClick={confirm}>
                    Confirm the latest transaction
                  </Button>
                  <Button onClick={execute}>
                    Execute the latest transaction
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { Contract } from "starknet";
import { getSelectorFromName } from "starknet/dist/utils/hash";
import { toBN } from "starknet/dist/utils/number";
import { useMultisigTransactions } from "~/hooks/transactions";
import Button from "./Button";
import { Field, Fieldset, Label } from "./Forms";
import { Input } from "./Input";

const ArbitraryTransaction = ({multisigContract}: {multisigContract?: Contract}) => {
  const { submitTransaction } = useMultisigTransactions(multisigContract)

  const [targetAddress, setTargetAddress] = useState<string>("");
  const [targetFunctionName, setTargetFunctionName] = useState<string>("");
  const [targetFunctionSelector, setTargetFunctionSelector] =
    useState<string>("");
  const [targetParameters, setTargetParameters] = useState<string>("");

  useEffect(() => {
    if (targetFunctionName) {
      const newSelector = toBN(getSelectorFromName(targetFunctionName));
      setTargetFunctionSelector(newSelector);
    }
  }, [targetFunctionName]);

  const submit = async () => {
    const bigNumberizedParameters = targetParameters.split(" ").map((p) => toBN(p));

    await submitTransaction({
      args: [targetAddress, targetFunctionSelector, bigNumberizedParameters],
    });
  };

  return (
    <Fieldset>
      <Field>
        <Label>Target contract address:</Label>
        <Input
          type="text"
          value={targetAddress}
          onChange={(e) => setTargetAddress(e.target.value)}
        ></Input>
      </Field>

      <Field>
        <Label>Target function name:</Label>
        <Input
          type="text"
          value={targetFunctionName}
          onChange={(e) => setTargetFunctionName(e.target.value)}
        ></Input>
      </Field>

      <Field>
        <Label>Target function parameters:</Label>
        <Input
          type="text"
          value={targetParameters}
          onChange={(e) => setTargetParameters(e.target.value)}
        ></Input>
      </Field>

      <Button fullWidth onClick={submit}>Submit a new transaction</Button>
    </Fieldset>
  )
}

export default ArbitraryTransaction
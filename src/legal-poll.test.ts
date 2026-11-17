import test from "node:test";
import assert from "node:assert/strict";
import { chooseNextStep, intakeSchema } from "./legal-poll.ts";

test("the leading intake choice becomes the next session step", () => {
  const intake = intakeSchema.parse({ matterId: "m-7", prompt: "Next?", choices: ["deliver", "follow up"] });
  assert.equal(chooseNextStep({ deliver: 4, "follow up": 1 }, intake.choices), "deliver");
});

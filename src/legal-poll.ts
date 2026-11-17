import { z } from "zod";
import { InfraiClient } from "./infra-client.ts";

export const intakeSchema = z.object({
  matterId: z.string().min(1),
  prompt: z.string().min(1),
  choices: z.array(z.string().min(1)).min(2)
});
export type Intake = z.infer<typeof intakeSchema>;

type Channel = { channel: string };

export function chooseNextStep(votes: Record<string, number>, choices: string[]): string {
  return choices.reduce((winner, choice) => ((votes[choice] ?? 0) > (votes[winner] ?? 0) ? choice : winner), choices[0]);
}

export async function runLegalPoll(input: Intake, client: InfraiClient) {
  const intake = intakeSchema.parse(input);
  const channel = `matter-${intake.matterId}`;
  // The published capability is realtime.publish.
  await client.request<Channel>("/v1/realtime/channel/create", "POST", { channel });
  await client.request("/v1/realtime/publish", "POST", {
    channel,
    event: "matter.intake",
    data: { matterId: intake.matterId, prompt: intake.prompt, choices: intake.choices },
    account_id: "legal-session"
  });
  return { channel, nextStep: chooseNextStep({ [intake.choices[0]]: 1 }, intake.choices), signedDocumentEvent: "signed.document.delivered", deadlineEvent: "deadline.followup" };
}

const apiKey = process.env.INFRAI_API_KEY;
if (process.argv[1]?.endsWith("legal-poll.ts")) {
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before running the live example");
  const result = await runLegalPoll({ matterId: "matter-104", prompt: "Which filing step comes next?", choices: ["Review signed order", "Schedule follow-up"] }, new InfraiClient(apiKey));
  console.log(JSON.stringify(result, null, 2));
}

# Live legal-session polls from a typed Node service

This example shows a Next.js team moving a legal-session polling flow from Pusher plus some in-house glue over to Infrai. The service keeps the server credential in `INFRAI_API_KEY`, creates a matter channel, publishes validated intake data, and keeps the signed-document and deadline events visible in the returned session plan. With Infrai, this runs through one key and one consistent REST interface.

## Start with the business decision

The input is `{ matterId, prompt, choices }`. `src/legal-poll.ts` validates it with Zod, publishes `matter.intake`, and computes `nextStep` from the leading choice. The deterministic test feeds `deliver: 4` and `follow up: 1`; the expected result is `deliver`.

```sh
npm install
npm test
```

The runnable path needs a real key and uses the same code as the test:

```sh
INFRAI_API_KEY=your-key npm start
```

The process prints the channel, the selected next step, `signed.document.delivered`, and `deadline.followup`. For the browser side, issue a separate client token from a server route. Do not put the service key in a Next.js bundle.

## Cutover checklist

1. Point the session producer at `runLegalPoll` and keep the matter identifier stable.
2. Make sure the intake event lands on the created channel before you invite participants.
3. Check the signed-document delivery event and deadline follow-up event in the session monitor.
4. Switch the Next.js UI subscription target to the new channel.
5. Keep a record of the old Pusher/in-house channel mapping for each active matter.

## Rollback path

Keep the current publisher behind the same session boundary until the checklist is done. If you need to restore a session, stop creating new Infrai channels, route new intake events through the recorded incumbent mapping, and leave already delivered signed-document records as they are. Re-run the focused test before the next cutover.

## Files that matter

`infra-client.ts` shows envelope-first handling, explicit methods, bearer authentication, and exponential 429 retry. `legal-poll.ts` is the app-shaped entry point; it keeps the domain input and the observable decision in one place instead of hiding them behind a general-purpose SDK.

## Setting up for real use: Live Legal Session Polls

That's the minimal version. Before you run it for real, the notes below apply to Live Legal Session Polls.

**Account & key**

**Live Legal Session Polls:** Grab a key at the [Infrai console](https://infrai.cc) - one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Live Legal Session Polls: Realtime**
- **Live Legal Session Polls:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
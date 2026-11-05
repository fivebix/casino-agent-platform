# agent-platform

Provisions for the casino **agent network** feature (real-person agents who run their own player networks and settle weekly), integrated with the sweepstakes platform the way the Affnook affiliate integration is.

- `docs/plan.md`: the plan and architecture
- `docs/questions-and-answers.md`: every question asked and every answer given, for stakeholder sign-off
- `contract/`: the API contract between the sweepstakes backend and the agent platform
- `client/`: the agent panel (Next.js); deployed on AWS Amplify with `amplify.yml` (app root `client`)

The agent network's API lives in `sweepstakes-backend` (`src/agent/`); this repo holds the panel, the contract and the docs.

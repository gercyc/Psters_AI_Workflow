---
name: pwf-aws-lambda-deploy
description: >
  Deploy Lambda functions using the guaranteed deploy scripts only. Never deploy via IAC (CDK). Requires AWS SSO login first.
  Use when: user wants to deploy any AWS Lambda repo change.
argument-hint: "[lambda-name or 'all']"
---

# Deploy AWS Lambda with Guaranteed Scripts

Use this skill to deploy Lambda changes safely through project-approved deploy scripts (default AWS CLI flow, no CDK/IaC deploy path unless project overrides allow).

Operational guardrails source: `rules/operational-guardrails.mdc`
Optional project override source: `docs/workflow/operational-overrides.md`

## Step 1: Detect script availability

From the target Lambda repo root, inspect `./scripts/` and find the guaranteed deploy script(s):
- `deploy-lambda-guaranteed.sh`
- `deploy-all-lambdas-guaranteed.sh`

Do not continue until script availability is clear.

## Rule: Use the guaranteed deploy scripts

- **Single function:** `./scripts/deploy-lambda-guaranteed.sh <lambda-name> [--profile PROFILE] [--region REGION]`
- **All functions in repo:** `./scripts/deploy-all-lambdas-guaranteed.sh [--profile PROFILE] [--region REGION]`

## Step 2: If scripts are missing, suggest bootstrap first

If no guaranteed deploy script exists, stop and ask for user approval to scaffold defaults.

Prompt: `No guaranteed deploy script was found in ./scripts. I suggest creating standard deploy scripts now (single Lambda and deploy-all), based on the plugin defaults. Should I create them for this repo?`

If approved, create in the target repo:
- `./scripts/deploy-lambda-guaranteed.sh` (from `assets/lambda-deploy/deploy-lambda-guaranteed.template.sh`)
- `./scripts/deploy-all-lambdas-guaranteed.sh` (from `assets/lambda-deploy/deploy-all-lambdas-guaranteed.template.sh`)

Then: `chmod +x` both scripts, validate placeholder values with the user, execute deploy.

## Prerequisite (default policy): AWS SSO login

Before AWS CLI command(s), run:
```bash
aws sso login --profile <aws-profile>
```

Replace `<aws-profile>` with the project's AWS profile (e.g. `Production`, `Staging`). If skipped, deploy will fail with credential/session errors.

## Where to run

From the Lambda repo root:
`./scripts/deploy-lambda-guaranteed.sh <name> --profile <aws-profile> --region <region>`

## Lambda name

The first argument is the **Lambda package/name** (e.g. `notification-processor`, `appsync-publisher`). Run the script with `--help` to see available names.

## After deploy

Scripts typically build, package, and call `aws lambda update-function-code`. Idempotent and safe to re-run.

## Do not

- Run `cdk deploy` or any IAC to deploy Lambda code.
- Manually zip and upload unless the repo has no script and you are adding the script as part of the work.

## Next Recommended Commands

- `/pwf-review` if deploy validation highlights code risks
- `/pwf-commit-changes` to register deployment-related fixes or script updates
- `/pwf-doc lambda <repo-name>` when Lambda behavior changed materially

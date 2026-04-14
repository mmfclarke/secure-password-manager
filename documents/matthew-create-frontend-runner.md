# Instructions for Matthew: Create the Frontend Self-Hosted Runner

## Why you need to do this

Because `secure-password-manager` is a personal-account repository under your GitHub account, the repository owner must create a repository-level self-hosted runner. After that, Eduardo can run the EC2-side commands on the frontend instance. See GitHub docs: https://docs.github.com/actions/hosting-your-own-runners/adding-self-hosted-runners

## What to do in GitHub

1. Open the repository: `mmfclarke/secure-password-manager`
2. Go to **Settings**
3. In the left sidebar, go to **Actions → Runners**
4. Open the **Self-hosted runners** tab
5. Click **New self-hosted runner**
6. Select:
   - **Operating system:** Linux
   - **Architecture:** x64
7. GitHub will generate the runner setup commands

## What to send to Eduardo

Send Eduardo the generated Linux/x64 runner setup commands from GitHub.

He will run them on the frontend EC2 instance in:

```bash
/home/ubuntu/actions-runner
```

## After the runner is registered

Once the runner appears in the repository runner list:

1. Click the runner
2. In the **Labels** section, add this custom label:

```text
frontend-ec2
```

This is important because the frontend workflow will target this label.

## Workflow expectation

The frontend workflow is expected to run on:

```yaml
runs-on: [self-hosted, linux, x64, frontend-ec2]
```

## Notes

- This is for the **frontend EC2** only.
- The EC2 instance already has Nginx and the GitHub runner software installed.
- The old dummy test runner has already been removed from the EC2.
- After runner creation is complete, Eduardo can finish the EC2-side registration and test the deployment.

## GitHub references

- Adding self-hosted runners: https://docs.github.com/actions/hosting-your-own-runners/adding-self-hosted-runners
- Using labels with self-hosted runners: https://docs.github.com/actions/hosting-your-own-runners/using-labels-with-self-hosted-runners

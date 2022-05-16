# Terra -> Algorand NFTs

This project helps you automate the process of converting a Terra CW721 NFT project into an Algorand ARC69 NFT project.

The cool thing about Algorand NFTs is assets (FTs and NFTs) are a [first-class concept](https://www.algorand.com/technology) ([technical detail](https://developer.algorand.org/docs/get-details/asa/)); you don't need to write Smart Contract code to mint NFTs (unless you're doing something really fancy). This project queries Terra for all NFTs minted by a given CW721 contract, converts the metadata to ARC69 format and then mints them as an Algorand Standard Asset with total of 1 and decimals of 0 (i.e. an NFT).

[ARC69](https://arc69.com/) is an on-chain way of representing NFT metadata (including traits). If you instead want to use IPFS to store the NFT metadata, then you can use [ARC3](https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md) instead (with a slight tweak to this codebase); just check that the format of your IPFS metadata document meets the ARC3 spec.

The script in this project will mint against a local emulator by default, but the config can change to point to TestNet and MainNet. Once you mint against MainNet you can check out your collection at [NFT Explorer](https://www.nftexplorer.app/).

After converting your NFTs to Algorand Standard Assets, the next step to migrate is to collect Algorand addresses for every Terra NFT holder so you can transfer their NFT(s) to them, noting they will have to opt-in to those assets first. A useful tool to guide them through that process is you can create a transfer via https://swapper.tools/. If you have hundreds or thousands of NFTs you might want to come up with a more programmatic option. If you want to get help with such a solution feel free to reach out to cto@makerx.com.au.

# Developer setup

## First time setup

### If you want to mint against a local Algorand emulator (recommended)

We recommend you first execute this against a locally running Algorand sandbox node so that you can check the minting works OK before running against MainNet.

1. Ensure you have Docker Engine and/or Docker Desktop installed
2. Make sure that you have [Powershell Core (7+)](https://docs.microsoft.com/en-us/powershell/scripting/install/installing-powershell?view=powershell-7.2) installed

   - Windows: `choco install pwsh -y`
   - MacOS: `brew install --cask powershell`

3. Clone the repository
4. Run `reset.ps1` if you want to reset your environment or `setup.ps1` to setup environment for the first time

   - If you want to re-start the environment after say restarting your machine or pulling latest changes you can run `update.ps1`

### Regardless of whether minting against local Algorand emulator or not

1. Open in VS Code (or your IDE of choice, although you'll get a better developer experience in VS Code since there are run and debug configurations and settings specified)
2. Install recommended extensions
3. Inside `minter`:

   - Copy `.env.sample` to `.env` and fill in the relevant variables depending on whether you want to test against either the local sandbox or Algorand TestNet (e.g. via [AlgoNode](https://algonode.io/api/) or via [PureStake](https://purestake.io/), for which you would need to [create an account](https://developer.purestake.io/signup))
   - Run `npm install`

4. Add the metadata for your NFT project in `minter/index.ts` (look for `/**** Terra metadata - edit this */`)

5. (If using VS Code) Choose the thing you want to run/debug from the "Run and Debug" pane (ctrl+shift+D on Windows) and hit F5 and it will launch it with breakpoint debugging

## Ongoing development

There are a number of commandline scripts that you can use to ease local development:

- `reset.ps1` - Reset and recreates your environment including docker containers, npm installs, python installs, etc.
- `status.ps` - Outputs the current status of the dependent docker container services (Reach Algorand sandbox and localstack)
- `update.ps1` - Ensures the docker containers and npm installs are up to date, useful to run this after pull code changes or computer restart etc.
- `goal.ps1` - This is a proxy to running the goal [Algorand Command Line Interface (CLI)](https://developer.algorand.org/docs/clis/goal/goal/) within the `algod` container

# Components

This repository contains the following components:

- **Learning**

  - **[Learning paths](docs/learning-paths/README.md)** - We have developed a number of learning paths to help people quickly get up to speed with the various concepts to understand and develop for this solution.

- **Local development**

  - **[Algorand Sandbox](docker-compose.yml)** - A locally running instance of [Algorand Sandbox](https://github.com/algorand/sandbox) in `dev` configuration [via our customised Docker builds](https://github.com/MakerXStudio/algorand-sandbox-dev) - this is automatically started via the [setup.ps1](setup.ps1) (which in turn calls `docker-compose up -d`)

    - You can interrogate the sandbox via the `./goal.ps1` and `./status.ps1` scripts in the project root once it's running
    - Useful commands:

      ```
      # Check current status
      ./status.ps1
      # See commandline options for goal (Algorand CLI): https://developer.algorand.org/docs/clis/goal/goal/
      ./goal.ps1
      # See global state of app with index 1
      ./goal.ps1 app read --app-id 1 --global
      # See high level info of app with index 1
      ./goal.ps1 app info --app-id 1
      # Dump out the balance of ALGOs and assets for account with address {addr}
      ./goal.ps1 account dump -a {addr}
      ```

  - **[VS Code](.vscode)** - Extension recommendations, launch and task configuration and settings to set up a productive VS Code environment

- **App components**
  - **[NFT Minter](minter)** - TypeScript / Node.js app responsible for converting Terra NFTs to Algorand NFTs

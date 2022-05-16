# Interacting with the blockchain

## Accounts

- An [account](https://developer.algorand.org/docs/get-details/accounts/) is defined by a public / private key pair, both of which are a 32-byte string

  - The public key is [transformed to a base 32 Algorand Address](https://developer.algorand.org/docs/get-details/accounts/) through an algorithm, which is the form you will see commonly e.g. `VCMJKWOY5P5P7SKMZFFOCEROPJCZOTIJMNIYNUCKH7LRO45JMJP6UYBIJA`
  - The private key is usually represented in one of two ways:
    - Base64 Private Key: Concatenation of public and private keys with base64 encoding applied
    - 25-word Mnemonic: User-friendly representation by converting the private key bytes into 11-bit integers and mapping them to a [known word list](https://raw.githubusercontent.com/bitcoin/bips/master/bip-0039/english.txt) (resulting in 24 words) and adding a checksum integer / word forming a 25 word phrase
  - Keeping the integrity of the private key secure is essential since if you lose it to an attacker then you lose your account. The private key can't be reset since the public key (and your account address) is based on the private key.

## Networks and dispensers

- Algorand, like other blockchains, has [multiple networks](https://developer.algorand.org/tutorials/betanet-goal/) - there is mainnet, which is the main blockchain, testnet, for testing, betanet for new feature experimentation and locally you can run a private Sandbox network for testing and development
  - To get funds in an account on Mainnet you need to purchase it via an exchange like [Binance](https://research.binance.com/en/projects/algorand) or [Coinbase](https://www.coinbase.com/price/algorand) using a [Fiat currency](https://www.gemini.com/cryptopedia/fiat-vs-crypto-digital-currencies) [stablecoin](https://www.gemini.com/cryptopedia/what-are-stablecoins-how-do-they-work)
  - To get funds in an account on Testnet you need to use a dispenser:
    - [Algorand dispenser](https://bank.testnet.algorand.network/)
    - [AlgoExplorer dispenser](https://testnet.algoexplorer.io/dispenser)
  - To get funds in an account on a local Sandbox you need to find a default account (one of the accounts created with lots of tokens in the network genesis), export the private key, and use that
    - We have code that [does this programmatically](../../minter/functions/account.ts) (see `getSandboxDefaultAccount`)
    - You can also do it in commandline via:
      ```
      > ./sandbox.sh goal account list
      > ./sandbox.sh goal account export -a {address_from_online_account_from_above_command}
      ```

## APIs and SDKs

- To interact with Algorand itself (or any blockchain) you need to run a node, but that can be quite complex/costly to set up and maintain so there are services that exist that run nodes and provide an API over the top to make it simpler, quicker and easier. The main ones for Algorand are:
  - [AlgoNode](https://algonode.io/api/), which is free and doesn't need an API key unless you want a higher tier of rate limiting
  - [PureStake](https://www.purestake.com/blog/algorand-rest-api-purestake/), which has a free tier and [paid tiers with higher rate limits and an SLA](https://www.purestake.com/technology/algorand-api/)
  - [RandLabs AlgoExplorer Algod REST API](https://algoexplorer.io/api-dev/v2) and [Indexer REST API](https://algoexplorer.io/api-dev/indexer-v2), both of which are [free without needing an API key](https://randlabs.io/products?product=api)
- Interacting with a node involves calling the node-provided APIs, for which Algorand [provides an SDK](https://developer.algorand.org/docs/sdks/) to communicate, some of the node services then provide functionality on top, but at a minimum they all support the Algorand SDK; the APIs themselves are [pretty standard HTTP APIs](https://developer.algorand.org/docs/rest-apis/restendpoints/) so easy to understand and consume
  - There are good examples of how to use the SDK in [our functions](../../minter/functions)
- To view information on Algorand you need to use the [indexer API](https://developer.algorand.org/docs/get-details/indexer/) (which the above services provide) or use an explorer UI:
  - [Purestake Goalseeker](https://goalseeker.purestake.io/algorand/mainnet) ([Testnet version](https://goalseeker.purestake.io/algorand/testnet))
  - [RandLabs AlgoExplorer](https://algoexplorer.io/) ([Testnet version](https://testnet.algoexplorer.io/))
  - [Bitquery](https://explorer.bitquery.io/algorand/transactions) ([Testnet version](https://explorer.bitquery.io/algorand_testnet/transactions))

## Wallets

- To transact as an end user with Algorand you need to use a wallet to sign the transactions for your account, there are a few different options:
  - [Pera Algo Wallet](https://perawallet.app/) - Slick Android/iOS app officially endorsed by the Algorand team, can use a QR code to interact with it from a web frontend; uses [WalletConnect](https://walletconnect.com/) to connect
  - [PureStake AlgoSigner](https://www.purestake.com/technology/algosigner/) - Unofficial Chrome/Edge extension similar to MetaMask, built by PureStake; uses custom `window.algosigner` interface that is [injected into every page you visit](https://github.com/PureStake/algosigner/blob/develop/docs/dApp-integration.md)
  - [RandLabs My Algo](https://wallet.myalgo.com/) - unofficial, slick web-based wallet that pulls up a `window.open` popup to authorize requests kind of like an OpenID Connect call, stores encrypted account details in local browser storage (IndexedDB) secured by a password
    - There is a JavaScript library called [MyAlgo Connect](https://github.com/randlabs/myalgo-connect) that handles the interactions with the popup
  - Other wallets:
    - [Ledger](https://support.ledger.com/hc/en-us/articles/360012341980-Algorand-ALGO-?docs=true) ledger is a popular crypto [hardware wallet](https://www.ledger.com/) and is also supported by the [Algorand Wallet app](https://algorandwallet.com/support/security/pairing-your-ledger-nano-x/); supports [WalletConnect](https://support.ledger.com/hc/en-us/articles/360018444599-Connecting-Ledger-Live-to-DApps-with-WalletConnect?docs=true)
    - [Magic](https://magic.link/); a bridge from passwordless "web2" identities to a securely stored wallet, has its own custom SDK
    - [Trust Wallet](https://trustwallet.com/algorand-wallet/); supports [WalletConnect](https://community.trustwallet.com/t/how-to-use-walletconnect-with-trust-wallet/36247)
    - [Atomic Wallet](https://atomicwallet.io/algorand-wallet); supports [WalletConnect](https://support.atomicwallet.io/article/116-how-to-use-wallet-connect)
    - [Guarda Algorant Wallet](https://guarda.com/coins/algorand-wallet/); supports [WalletConnect](https://support.guarda.com/article/111-walletconnect)
    - [Exodus Algorand Wallet](https://www.exodus.com/algorand-wallet); looks like it doens't support dApps
    - [Algo Wallet](https://www.a-wallet.net/) - an [open source wallet implementation](https://github.com/scholtz/wallet/)

## Sandbox setup (Windows)

Not relevant for this project since we use Docker Compose, but may be useful for cursory exploration:

- Sandbox setup on Windows: <https://github.com/algorand/sandbox#windows>
- Configure WSL to work with Docker on Windows: <https://docs.docker.com/desktop/windows/wsl/>
- Avoid needing to prefix `docker` with `sudo` in WSL: <https://docs.docker.com/engine/install/linux-postinstall/>
- Configure VS Code on Windows to be able to open a WSL folder (via `code .` in WSL): <https://code.visualstudio.com/docs/remote/wsl-tutorial>

Previous: [Algorand (basics)](./algorand.md)

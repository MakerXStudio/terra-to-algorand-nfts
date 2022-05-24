import clsx from 'clsx'
import * as React from 'react'
import { json, LoaderFunction, useLoaderData, useNavigate } from 'remix'
import CopyToClipBoard from '~/components/copyToClipBoard'
import { getKmdWallets, Wallet } from '~/functions/account'

type LoaderData = {
  accounts: Wallet[]
}

export const loader: LoaderFunction = async (): Promise<any> => {
  const accounts = await getKmdWallets()

  return json({ accounts: accounts })
}

export default function Index() {
  const { accounts: wallets } = useLoaderData<LoaderData>()
  const navigate = useNavigate()

  return (
    <div className="w-full">
      <div className="text-4xl text-grey-dark sm:text-5xl md:text-6xl text-center mb-10">Local sandbox NFT viewer</div>

      {wallets && wallets.length > 0 && (
        <div className="mb-16">
          <h1 className="mb-2">Local accounts</h1>
          <ul role="list" className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {wallets.map((w) => (
              <li key={w.name} className="col-span-1 border-2 p-2 border-green-800 w-[300px]">
                <p className="text-center mb-4">
                  <strong>{w.name}</strong>
                </p>
                <hr className="-mx-2 border-[1px] border-black" />
                {w.addresses.map((a) => (
                  <div key={a.address}>
                    <p className="mb-1 flex flex-row items-center">
                      <code className="p-1 bg-red-100 text-red-900 flex-shrink" title={a.address}>
                        {a.address.substring(0, 5)}...{a.address.substring(a.address.length - 5)}
                      </code>
                      <CopyToClipBoard valueToCopy={a.address} className="h-6 w-6 m-1 flex-shrink" />
                      <span className={clsx('flex-grow text-right', a.online && 'text-green-600')}>
                        A<span className="-ml-2 mr-1">/</span>
                        {a.balance > 1000000000
                          ? `${(a.balance / 1000000000).toFixed(2)}b`
                          : a.balance > 1000000
                          ? `${(a.balance / 1000000).toFixed(2)}m`
                          : a.balance > 1000
                          ? `${(a.balance / 1000).toFixed(2)}k`
                          : a.balance.toFixed(2)}
                      </span>
                    </p>
                    <button
                      className="border border-slate-700 bg-slate-100 hover:bg-slate-700 hover:border-slace-100 hover:text-white rounded-md p-2 m-1"
                      onClick={() => navigate(`/nfts/${a.address}`)}
                    >
                      {a.createdAssets} NFTs
                    </button>
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

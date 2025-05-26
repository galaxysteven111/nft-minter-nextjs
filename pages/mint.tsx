// Next.js + Metaplex NFT Mint 實作
// 此程式碼整合 Phantom 錢包、NFT.Storage 上傳、Solana Devnet mint NFT 功能

'use client'

import { useEffect, useState } from 'react'
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js'
import { Metaplex, keypairIdentity, walletAdapterIdentity, bundlrStorage } from '@metaplex-foundation/js'
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import '@solana/wallet-adapter-react-ui/styles.css'

const connection = new Connection(clusterApiUrl('devnet'))

export default function MintNFT() {
  const wallet = useWallet()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [status, setStatus] = useState('')

  const handleMint = async () => {
    if (!wallet.connected || !wallet.publicKey || !imageFile) {
      setStatus('請連接 Phantom 錢包並選擇圖片')
      return
    }

    setStatus('連接 NFT.Storage 並上傳圖片...')
    const formData = new FormData()
    formData.append('file', imageFile)

    const uploadRes = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer dd804f84.f5b0889412664599857188135bc7786f` },
      body: imageFile,
    })
    const uploadJson = await uploadRes.json()
    const imageUri = `https://${uploadJson.value.cid}.ipfs.nftstorage.link`

    const metadata = {
      name,
      description: desc,
      image: imageUri,
    }

    const metaUploadRes = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer dd804f84.f5b0889412664599857188135bc7786f`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    })
    const metaJson = await metaUploadRes.json()
    const metadataUri = `https://${metaJson.value.cid}.ipfs.nftstorage.link/metadata.json`

    setStatus('準備 mint NFT 到 Solana Devnet...')

    const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet))

    try {
      const { nft } = await metaplex.nfts().create({
        uri: metadataUri,
        name,
        sellerFeeBasisPoints: 500,
        symbol: '',
      })

      setStatus(`✅ 成功鑄造 NFT！Mint 地址：${nft.address.toBase58()}`)
    } catch (e: any) {
      setStatus(`❌ Mint 失敗：${e.message}`)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">鑄造 NFT</h1>
      <WalletMultiButton className="mb-4" />
      <input
        className="mb-2 border p-2 w-full"
        placeholder="NFT 名稱"
        onChange={(e) => setName(e.target.value)}
      />
      <textarea
        className="mb-2 border p-2 w-full"
        placeholder="描述"
        onChange={(e) => setDesc(e.target.value)}
      ></textarea>
      <input
        type="file"
        accept="image/*"
        className="mb-4"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
      />
      <button
        className="bg-purple-600 text-white px-4 py-2 rounded"
        onClick={handleMint}
      >
        鑄造 NFT
      </button>
      <p className="mt-4 text-sm text-gray-700 whitespace-pre-wrap">{status}</p>
    </div>
  )
}

// 外層應用需包住：
// <ConnectionProvider endpoint={clusterApiUrl('devnet')}>
//   <WalletProvider wallets={[new PhantomWalletAdapter()]} autoConnect>
//     <WalletModalProvider>
//       <MintNFT />
//     </WalletModalProvider>
//   </WalletProvider>
// </ConnectionProvider>

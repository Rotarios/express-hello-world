import mempoolJS from "@mempool/mempool.js"
import { dbQueries } from "./dbInterface.js"
import { notifyChatId, notifyWalletSubscribers } from "./sender.js"


const { bitcoin: { websocket, addresses } } = mempoolJS({
	hostname: 'mempool.space'
})

const wsPool = {}

export const getActualBalance = async (walletAddress) => {
	const { chain_stats, mempool_stats } = await addresses.getAddress({ address: walletAddress })
	const balance = chain_stats.funded_txo_sum - chain_stats.spent_txo_sum
	const mempoolIn = mempool_stats.funded_txo_sum
	const mempoolOut = mempool_stats.spent_txo_sum
	return { balance: balance, mempoolIn: mempoolIn, mempoolOut: mempoolOut }
}

function financial(x) {
  return Number.parseFloat(x).toFixed(2);
}

const conversions = { USD: 27277 }

export const statusText = (walletAddress, balance, mempoolIn, mempoolOut) => {
	const text = "кошелек:" + 
		"\n" +`${walletAddress}` +
		//"\n" + `${balance}`+ 
		"\n" + "баланс:" +
		"\n" + `${financial(balance*conversions.USD/100000000)} usd (подтвержденный), ` + 
		"\n" + `${financial((balance + mempoolIn - mempoolOut)*conversions.USD/100000000)} usd (неподтвержденный)` + 
		"\n" + `сумма входящих транзакций в мемпуле: ${financial(mempoolIn*conversions.USD/100000000)} usd` +
		"\n" + `сумма исходящих транзакций в мемпуле: ${financial(mempoolOut*conversions.USD/100000000)} usd`
	return text
}

export const createWalletListener = (walletAddress) => {
	const ws = websocket.initServer({
		options: []
	})
	ws.on("open", function open() {
		ws.send(JSON.stringify({ 'track-address': walletAddress }));
	})
	ws.on("message", async (data) => {
		const res = JSON.parse(data.toString());
		console.log(res)
		//const chats = await dbQueries.getChatsByWallet(walletAddress)		
		if (res["address-transactions"]) {
			res["address-transactions"].forEach((el) => {
				//const text = `${walletAddress}` + "\n" + "mempool transaction txid" + "\n" +  `${el.txid}`
				const text = "кошелек"+"\n"+`${walletAddress}` + "\n" + "в мемпул поступила транзакция" + "\n" + `${el.txid}`
				//chats.forEach((chat) => { notifyChatId(chat.chat_id, text) })
				notifyWalletSubscribers(walletAddress, text)
			})
		}	
		if (res["block-transactions"]) {
			res["block-transactions"].forEach((el) => {
				//const text = `${walletAddress}` + "\n" + "confirmed block transaction txid" + "\n" + `${el.txid}`
				const text = "кошелек"+"\n"+`${walletAddress}` + "\n" + "транзакция подтверждена" + "\n" + `${el.txid}`
				//chats.forEach((chat) => { notifyChatId(chat.chat_id, text) })
				notifyWalletSubscribers(walletAddress, text)
			})
		}		
		if (res.conversions) {
			Object.assign(conversions, res.conversions)
			//console.log("conversions arrived"+"\n"+res)
		}				
		if (!res.conversions || res.conversions && Object.keys(res).length > 1) {
			const { balance, mempoolIn, mempoolOut } = await getActualBalance(walletAddress)
			await dbQueries.updateWalletBalance(walletAddress, balance, mempoolIn, mempoolOut)
			const text = statusText(walletAddress, balance, mempoolIn, mempoolOut)
			//	`wallet: ${walletAddress}` +
			//	"\n" + `balance: ${balance}` + 
			//	"\n" + `incoming mempool transactions sum: ${mempoolIn}` +
			//	"\n" + `outcoming mempool transactions sum: ${mempoolOut}`
			//chats.forEach((chat) => { notifyChatId(chat.chat_id, text) })
			notifyWalletSubscribers(walletAddress, text)
			//console.log(conversions)
		}		
		//console.log("WS" + `${walletAddress}` + "/n" + `${res}` + "/n" + "WS")
	})
	wsPool[walletAddress] = ws
}

export const deleteWalletListener = (walletAddress) => {
	await wsPool[walletAddress].close()
	delete wsPool[walletAddress]
}

export const showWalletListenersStatus = () => {
	//console.log("0: connecting, 1: open, 2: closing, 3: closed")
	for (const [walletAddress, ws] of Object.entries(wsPool)) {
		console.log(`${walletAddress}: ${ws.readyState}`)
	}
}

export const listAllChatWallets = async (chatId) => {
	const wallets = await dbQueries.getWalletsByChat(chatId)
	if (wallets.length > 0) {
		wallets.forEach((wallet) => {
			const balance = parseFloat(wallet.balance)
			const mempoolIn = parseFloat(wallet.mempool_in)
			const mempoolOut = parseFloat(wallet.mempool_out)
			const text = statusText(wallet.wallet_address, balance, mempoolIn, mempoolOut)
			//	`wallet: ${wallet.wallet_address}` +
			//	"\n" + `balance: ${wallet.balance}` + 
			//	"\n" + `incoming mempool transactions sum: ${wallet.mempool_in}` +
			//	"\n" + `outcoming mempool transactions sum: ${wallet.mempool_out}`
			notifyChatId(chatId, text)
		})
	} else {
		notifyChatId(chatId, "нет отслеживаемых кошельков")//"no wallets is being tracked") 
	}
}
//// make this with less queris by one time check by outer join wallets with junction, then delete all received unused
//// or make the db trigger function
export const deleteWalletIfUnused = async (walletAddress) => {
	const walletJunction = await dbQueries.getWalletJunction(walletAddress)
	if (walletJunction.length === 0) {
		dbQueries.deleteWallet(walletAddress)
		deleteWalletListener(walletAddress)
	}
}

export const deleteAllChatWallets = async (chatId) => {
	const wallets = await dbQueries.getWalletsByChat(chatId)
	await dbQueries.deleteAllJunction(chatId)
	dbQueries.deleteChat(chatId)
	wallets.forEach(async (wallet) => {
		deleteWalletIfUnused(wallet.wallet_address)
	})
	notifyChatId(chatId, "удалено, нет отслеживаемых кошельков")//"deleted, no wallets is being tracked now") 
}

export const deleteChatWallet = async (chatId, walletAddress) => {
	await dbQueries.deleteJunction(chatId, walletAddress)
	const chatJunction = await dbQueries.getChatJunction(chatId)
	if (chatJunction.length === 0) {
		dbQueries.deleteChat(chatId)
	}
	deleteWalletIfUnused(walletAddress)
	notifyChatId(chatId, `удалено, кошелек ${walletAddress} больше не отслеживается`)//"deleted, wallet ${walletAddress} is not being tracked now") 
}

export const toggleWallet = async (chatId, walletAddress) => {
	const [ junction ] = await dbQueries.getChatWalletJunction(chatId, walletAddress)
	if (!junction) {
		const [ wallet ] = await dbQueries.getWallet(walletAddress)
		if (!wallet) {
			createWalletListener(walletAddress)
			await dbQueries.addWallet(walletAddress)
			const { balance, mempoolIn, mempoolOut } = await getActualBalance(walletAddress)
			dbQueries.updateWalletBalance(walletAddress, balance, mempoolIn, mempoolOut)
			const text = statusText(walletAddress, balance, mempoolIn, mempoolOut)
			//	`wallet: ${walletAddress}` 
			//	"\n" + `balance: ${balance}` + 
			//	"\n" + `incoming mempool transactions sum: ${mempoolIn}` +
			//	"\n" + `outcoming mempool transactions sum: ${mempoolOut}`
			notifyChatId(chatId, text)
		} else {
			const text = statusText(wallet.wallet_address, wallet.balance, wallet.mempool_in, wallet.mempool_out)
			//	`wallet: ${walletAddress}` +
			//	"\n" + `balance: ${wallet.balance}` + 
			//	"\n" + `incoming mempool transactions sum: ${wallet.mempool_in}` +
			//	"\n" + `outcoming mempool transactions sum: ${wallet.mempool_out}`
			notifyChatId(chatId, text)
		}
		const [ chat ] = await dbQueries.getChat(chatId)
		if (!chat) {
			await dbQueries.addChat(chatId)
		}
		dbQueries.addJunction(chatId, walletAddress)
	} else {
		deleteChatWallet(chatId, walletAddress)
	}
}
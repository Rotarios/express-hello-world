import { dbQueries } from "./dbInterface.js"
import { createWalletListener, getActualBalance } from "./broker.js"
import { notifyWalletSubscribers } from "./sender.js"

export const initWsPool = async () => {
	
	const wallets = await dbQueries.getAllWallets()
	wallets.forEach(async (wallet) => {
		await createWalletListener(wallet.wallet_address)
		const { balance, mempoolIn, mempoolOut } = await getActualBalance(wallet.wallet_address)
		if (wallet.balance != balance || wallet.mempool_in != mempoolIn || wallet.mempool_out != mempoolOut) {
			const text = "Ой! Что-то изменилось (все суммы в сатоши)" +
				"\n" + `кошелек: ${wallet.wallet_address}` +
				"\n" + `старый баланс: ${wallet.balance} - текущий баланс: ${balance}` +
				"\n" + `старая сумма входящих транзакций в мемпуле: ${wallet.mempool_in} - текущая сумма: ${mempoolIn}` +
				"\n" + `старая сумма исходящих транзакций в мемпуле: ${wallet.mempool_out} - текущая сумма: ${mempoolOut}`
				//"Oops! Something changed" +
				//"\n" + `wallet: ${wallet.wallet_address}` +
				//"\n" + `old balance: ${wallet.balance} - current balance: ${balance}` +
				//"\n" + `old incoming mempool transactions sum: ${wallet.mempool_in} - current: ${mempoolIn}` +
				//"\n" + `old outcoming mempool transactions sum: ${wallet.mempool_out} - current: ${mempoolOut}`
			notifyWalletSubscribers(wallet.wallet_address, text)
			dbQueries.updateWalletBalance(wallet.wallet_address, balance, mempoolIn, mempoolOut)
		}
	})
		
}
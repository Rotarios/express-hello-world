import { dbQueries } from "./dbInterface.js"
import { bot } from "./bot.js"

export const notifyWalletSubscribers = async (walletAddress, text) => {
	//console.log(walletAddress, text)
	const chats = await dbQueries.getChatsByWallet(walletAddress)
	chats.forEach(async (chat) => {
		await bot.api.sendMessage(chat.chat_id, text)
		//console.log(chat.chat_id + "\n" + text)
	})
}

export const notifyChatId = async (chatId, text) => {
	await bot.api.sendMessage(chatId, text)
	//console.log(chat.chat_id + "\n" + text)
}
import { getAddressFromMessage } from "./getAddressFromMessage.js"
import mempoolJS from "@mempool/mempool.js"

export const initWS = (wsPool, bot) => {

bot.command("list", async (ctx) => {
	
	ctx.reply(`Pong! ${new Date()} ${Date.now()}`)

	const chatId = ctx.msg.chat.id
	if (wsPool.hasOwnProperty(chatId)) {
		Object.keys(wsPool[chatId]).forEach(async (el) => {
			await bot.api.sendMessage(chatId, el)
		})
	} 
		else await bot.api.sendMessage(chatId, "empty")
});

bot.command("clear", async (ctx) => {
	const chatId = ctx.msg.chat.id
	if (wsPool.hasOwnProperty(chatId)) {
		Object.values(wsPool[chatId]).forEach((el) => {
			el.close()
		})
		delete wsPool[chatId]
	}
	await bot.api.sendMessage(chatId, "cleared")
});

bot.on("message", async (ctx) => {
  // `txt` will be a `string` when processing text messages.
  // It will be `undefined` if the received message does not have any message text,
  // e.g. photos, stickers, and other messages.
  const txt = ctx.message.text;
  const walletAddress = getAddressFromMessage(txt)
   // Get the chat identifier.
  const chatId = ctx.msg.chat.id
  // The text to reply with
  const text = `I got your message! chatId - ${chatId}`
  // Send the reply.
  await bot.api.sendMessage(chatId, text)
  
	if (walletAddress) {
		//const balance = getWalletBalance(walletAddress)
		//await bot.api.sendMessage(chatId, balance)
		toggleWallet(wsPool, chatId, walletAddress)	
			?
			await bot.api.sendMessage(chatId, "tracking on")
			:
			await bot.api.sendMessage(chatId, "tracking off")
	}
		else await bot.api.sendMessage(chatId, "address not found")
  
});


const { bitcoin: { websocket } } = mempoolJS({
    hostname: 'mempool.space'
  });
  
//const wsPool = {}

console.log("init bot")
//{chatId: {walletAddress: ws}}

function toggleWallet (wsPool, chatId, walletAddress) {
	if (wsPool.hasOwnProperty(chatId) && wsPool[chatId].hasOwnProperty(walletAddress)) {
		wsPool[chatId][walletAddress].close()
		delete wsPool[chatId][walletAddress]
		if (!Object.keys(wsPool[chatId]).length) {
			delete wsPool[chatId]
		}
		return false
	}
		else {
			if (!wsPool.hasOwnProperty(chatId)) {
				wsPool[chatId] = {}
			}
			wsPool[chatId][walletAddress] = createWalletListener(chatId, walletAddress)
			return true
		}
}

function createWalletListener (chatId, walletAddress) {
		
	const ws = websocket.initServer({
		options: []
	});
	
	ws.on("open", function open() {
		ws.send(JSON.stringify({ 'track-address': walletAddress }));
	});
  
	ws.on("message", function incoming(data) {
		
		const res = JSON.parse(data.toString());
		
		if (res["address-transactions"]) {
			res["address-transactions"].forEach(async (el) => {
				const text = `${walletAddress} has mempool transaction txid ${el.txid}`
				await bot.api.sendMessage(chatId, text)
			});
		}
		
	//	if (res.conversions) {
	//		console.log("high five")
	//	}
	
	});
	
	return ws
	
}

//function async sendNotification (chatId, text) {
//	await bot.api.sendMessage(chatId, text)
//}
}
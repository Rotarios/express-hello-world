import { Bot } from "grammy";
import { dbQueries } from "./dbInterface.js"
import { toggleWallet, listAllChatWallets, deleteAllChatWallets, showWalletListenersStatus } from "./broker.js"
import { getAddressFromMessage } from "./getAddressFromMessage.js"

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");

export const bot = new Bot(token);

bot.command("start", (ctx) => ctx.reply("Добро пожаловать! Бот онлайн"))//("Welcome! Up and running."))

bot.command("ping", (ctx) => {
	ctx.reply(
		`Pong! ${new Date()} ${Date.now()}`,
		{    // `reply_to_message_id` specifies the actual reply feature.
			reply_to_message_id: ctx.msg.message_id
		}
	)
})
//
//	TRY CATCH FOR ERROR LOGGING AND/OR TEXTING
//
bot.command("list", (ctx) => {
	const chatId = ctx.msg.chat.id
	listAllChatWallets(chatId)
})

bot.command("deleteall", async (ctx) => {
	const chatId = ctx.msg.chat.id
	deleteAllChatWallets(chatId)
});

bot.command("checkws", (ctx) => {
	showWalletListenersStatus()
})

bot.on("message", async (ctx) => {
  // `txt` will be a `string` when processing text messages.
  // It will be `undefined` if the received message does not have any message text,
  // e.g. photos, stickers, and other messages.
  const text = ctx.message.text;
  const walletAddress = getAddressFromMessage(text)
   // Get the chat identifier.
  const chatId = ctx.msg.chat.id
  // The text to reply with
  //const text = `I got your message! chatId - ${chatId}`
  // Send the reply.
  //await bot.api.sendMessage(chatId, text)
  
	if (walletAddress) {
		toggleWallet(chatId, walletAddress)	
	}
		else await bot.api.sendMessage(chatId, "адрес в сообщении не найден")//"there is no address found in the message")
  
});
import { pool } from "./db.js"

export const dbQueries = {

	addWallet: async (walletAddress) => {
		try {
			const { rows } = await pool.query(
				"INSERT INTO wallets (wallet_address) VALUES ($1) RETURNING *", 
				[walletAddress],
			//	(error, results) => {
			//		if (error) {
			//			throw error
			//		}
			//		console.log(results)
			//	}
			)
			return rows
			//return wallet
		} catch (error) {
			return { "error_code": error.code } //23505
		}
	},

	deleteWallet: async (walletAddress) => {
		const { rows } = await pool.query(
			"DELETE FROM wallets WHERE wallet_address = $1 RETURNING *", 
			[walletAddress]
		)
		return rows
	},

	getWallet: async (walletAddress) => {
		const { rows } = await pool.query(
			"SELECT * FROM wallets WHERE wallets.wallet_address = $1", 
			[walletAddress]
		)
		return rows
	},

	updateWalletBalance: async (walletAddress, balance, mempoolIn, mempoolOut) => {
		try {
			const result = await pool.query(
				"UPDATE wallets SET balance = $2, mempool_in = $3, mempool_out = $4 WHERE wallet_address = $1", 
				[walletAddress, balance, mempoolIn, mempoolOut]
			)
			return result
		} catch(error) {
			console.log(error)
		}
	},
	
	getChat: async (chatId) => {
		const { rows } = await pool.query(
			"SELECT * FROM chats WHERE chats.chat_id = $1", 
			[chatId]
		)
		return rows
	},

	addChat: async (chatId) => {
		try {
			const result = await pool.query("INSERT INTO chats (chat_id) VALUES ($1) RETURNING *", [chatId])
			return chatId
		} catch(error) {
			console.log(error)
		}
	},

	deleteChat: async (chatId) => {
		try {
			const result = await pool.query("DELETE FROM chats WHERE chat_id = $1 RETURNING *", [chatId])
			return result
		} catch (error) {
			return error
		}
	},

	addJunction: async (chatId, walletAddress) => {
		try {
			const result = await pool.query(
				"INSERT INTO junction (chat_id, wallet_address) VALUES ($1, $2) RETURNING *", 
				[chatId, walletAddress]
			)
		} catch(error) {
			console.log(error)
		}
	},
	
	deleteJunction: async (chatId, walletAddress) => {
		const result = await pool.query(
			"DELETE FROM junction WHERE chat_id = $1 AND wallet_address = $2 RETURNING *", 
			[chatId, walletAddress]
		)
		return result
	},
	
	deleteAllJunction: async (chatId) => {
		const result = await pool.query(
			"DELETE FROM junction WHERE chat_id = $1 RETURNING *", 
			[chatId]
		)
		return result
	},

	getWalletsByChat: async (chatId) => {
		const { rows } = await pool.query(
			"SELECT wallets.* FROM wallets JOIN junction ON junction.wallet_address = wallets.wallet_address WHERE junction.chat_id = $1", 
			[chatId]
		)
		return rows
	},

	getChatsByWallet: async (walletAddress) => {
		const { rows } =  await pool.query(
			"SELECT chats.* FROM chats JOIN junction ON junction.chat_id = chats.chat_id WHERE junction.wallet_address = $1", 
			[walletAddress]
		)
		return rows
	},
	
	getAllWallets: async () => {
		const { rows } = await pool.query(
			"SELECT * FROM wallets"
		)
		return rows
	},
	
	getChatJunction: async (chatId) => {
		try {
			const { rows } = await pool.query(
				"SELECT * FROM junction WHERE junction.chat_id = $1", 
				[chatId]
			)
			return rows
		} catch(error) {
			console.log(error)
		}
	},
	
	getWalletJunction: async (walletAddress) => {
		try {
			const { rows } = await pool.query(
				"SELECT * FROM junction WHERE junction.wallet_address = $1", 
				[walletAddress]
			)
			return rows
		} catch(error) {
			console.log(error)
		}
	},
	
	getChatWalletJunction: async (chatId, walletAddress) => {
		const { rows } = await pool.query(
			"SELECT * FROM junction WHERE chat_id = $1 AND wallet_address = $2 RETURNING *", 
			[chatId, walletAddress]
		)
		return rows
	},
	
}

export const get = async (chatId) => {
	try {
		
	} catch(error) {
		console.log(error)
	}
}
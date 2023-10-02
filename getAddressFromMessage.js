import { validate } from "bitcoin-address-validation"

export const getAddressFromMessage = (message) => {

	if (!message) {
		return false
    }
	
	let regex = new RegExp(/^(bc1|[13])[a-zA-Z0-9]{25,90}$/)
	
	let address = message.split(/[ .:;?!~,`'"&|()<>{}\[\]\r\n/\\]+/)
		.find((word) => regex.test(word) && validate(word))
		
	if (address) {
		return address
	}
		else 
			return false
}
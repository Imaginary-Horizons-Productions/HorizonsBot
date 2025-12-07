const { DiscordjsErrorCodes } = require("discord.js");

// Discord API Opcodes and Status Codes: https://discord.com/developers/docs/topics/opcodes-and-status-codes

/** @param {((error) => boolean)[]} ignoreThese */
function butIgnoreCertainErrors(...ignoreThese) {
	return (error) => {
		for (const ignoreThis of ignoreThese) {
			if (ignoreThis(error)) {
				return;
			}
		}
		console.error(error);
	}
}

/** Interaction collectors throw an error on timeout (which is a crash if uncaught) */
const butIgnoreDiscordInteractionCollectorErrors = butIgnoreCertainErrors(error => error.code === DiscordjsErrorCodes.InteractionCollectorError);

const isCantDirectMessageThisUserError = error => error.code === 50007;

module.exports = {
	butIgnoreCertainErrors,
	butIgnoreDiscordInteractionCollectorErrors,
	isCantDirectMessageThisUserError
}

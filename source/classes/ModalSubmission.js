const { Interaction } = require('discord.js');

module.exports = class ModalSubmission {
	/** IHP wrapper for modal submissions
	 * @param {string} nameInput
	 * @param {(interaction: Interaction, args: Array<string>) => void} executeFunction
	 */
	constructor(nameInput, executeFunction) {
		this.name = nameInput;
		this.execute = executeFunction;
	}
}

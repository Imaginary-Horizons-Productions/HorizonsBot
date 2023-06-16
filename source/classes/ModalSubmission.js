const { Interaction } = require('discord.js');

module.exports = class ModalSubmission {
	/** IHP wrapper for modal submissions
	 * @param {string} customIdInput
	 * @param {number} cooldownInMS
	 * @param {(interaction: Interaction, args: Array<string>) => void} executeFunction
	 */
	constructor(customIdInput, cooldownInMS, executeFunction) {
		this.customId = customIdInput;
		this.cooldown = cooldownInMS;
		this.execute = executeFunction;
	}
}

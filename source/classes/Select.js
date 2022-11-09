const { Interaction } = require('discord.js');

module.exports = class Select {
	/** IHP wrapper for select menus (drop downs)
	 * @param {string} nameInput
	 * @param {(interaction: Interaction, args: Array<string>) => void} executeFunction
	 */
	constructor(nameInput, executeFunction) {
		this.name = nameInput;
		this.execute = executeFunction;
	}
}

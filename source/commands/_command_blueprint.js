const Command = require('../classes/Command.js');

const customId = "name";
const options = [
	{
		type: "",
		name: "",
		description: "",
		required: false,
		choices: [] // elements are objects with properties: name, value
	}
];
const subcommands = [
	{
		name: "",
		description: "",
		optionsInput: [
			{
				type: "",
				name: "",
				description: "",
				required: false,
				choices: [] // elements are objects with properties: name, value
			}
		]
	}
];
module.exports = new Command(customId, "description", false, "none", 3000, options, subcommands);

/** Command specifications go here
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {

}

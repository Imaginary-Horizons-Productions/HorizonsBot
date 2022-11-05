const { Interaction } = require('discord.js');
const Command = require('../classes/Command.js');

const id = "name";
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
module.exports = new Command(id, "description", false, false, options, subcommands);

/** Command specifications go here
 * @param {Interaction} interaction
 */
module.exports.execute = (interaction) => {

}

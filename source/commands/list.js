const Command = require('../classes/Command.js');
const { buildListMessagePayload } = require('../helpers.js');

const id = "list";
const options = [
	{ type: "String", name: "list-type", description: "The list to get", required: true, choices: [{ name: "Get the list of open topic petitions", value: "petition" }, { name: "Get the list of clubs on the server", value: "club" }] },
];
const subcomands = [];
module.exports = new Command(id, "Get the petition or club list", "none", options, subcomands);

/** Provide the user the petition or club list as requested
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	const listType = interaction.options.getString("list-type").toLowerCase();
	buildListMessagePayload(interaction.guild.channels, listType).then(messageOptions => {
		messageOptions.ephemeral = true;
		interaction.reply(messageOptions);
	}).catch(console.error);
}

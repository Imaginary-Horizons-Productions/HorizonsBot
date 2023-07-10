const Command = require('../classes/Command.js');
const { checkPetition } = require('../engines/referenceEngine.js');

const options = [
	{ type: "String", name: "topic", description: "The petition to check", required: true, choices: [] },
];
const subcomands = [];
module.exports = new Command("petition-check", "Check how many more petitions a topic needs", false, null, 3000, options, subcomands);

/** Check if the given petition has enough support to make into a channel
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	const topicName = interaction.options.getString("topic").toLowerCase();
	const { petitions, threshold } = checkPetition(interaction.guild, topicName);
	interaction.reply({ content: `The petition for ${topicName} has ${petitions} petitions (needs ${threshold}).`, ephemeral: true });
}

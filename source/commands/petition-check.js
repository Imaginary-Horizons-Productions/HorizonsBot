const Command = require('../classes/Command.js');
const { isModerator, checkPetition } = require('../helpers.js');

const options = [
	{ type: "String", name: "topic", description: "The petition to check", required: true, choices: [] },
];
const subcomands = [];
module.exports = new Command("petition-check", "(moderator) Check if a petition has passed in case of desync", true, options, subcomands);

/** Check if the given petition has enough support to make into a channel
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	if (isModerator(interaction.user.id)) {
		const topicName = interaction.options.getString("topic").toLowerCase();
		const { petitions, threshold } = checkPetition(interaction.guild, topicName);
		interaction.reply({ content: `The petition for ${topicName} has ${petitions} petitions (needs ${threshold}).`, ephemeral: true });
	} else {
		interaction.reply("Checking petitions is restricted to Moderators.")
			.catch(console.error);
	}
}

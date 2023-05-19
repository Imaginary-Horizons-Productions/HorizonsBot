const Command = require('../classes/Command.js');
const { checkPetition, getTopicNames } = require('../engines/channelEngine.js');

const options = [
	{ type: "String", name: "topic-name", description: "Make sure the topic doesn't already exist", required: true, choices: [] }
];
const subcomands = [];
module.exports = new Command("petition", "Petition for a topic text channel", "none", options, subcomands);

/** Record a user's petition for a text channel, create channel if sufficient number of petitions
 * @param {import('discord.js').Interaction} interaction */
module.exports.execute = (interaction) => {
	const topicName = interaction.options.getString("topic-name").toLowerCase();
	if (!getTopicNames().includes(topicName)) {
		checkPetition(interaction.guild, topicName, interaction.user);
		interaction.reply(`Your petition for a **${topicName}** text channel has been recorded!`)
			.catch(console.error);
	} else {
		interaction.reply({ content: `A channel for ${topicName} already exists, you can use the Channels & Roles Browser to make it visible.`, ephemeral: true })
			.catch(console.error);
	}
}

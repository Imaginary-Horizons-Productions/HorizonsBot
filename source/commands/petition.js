const Command = require('../classes/Command.js');
const { joinChannel, getTopicNames, findTopicID, checkPetition } = require('../helpers.js');

const options = [
	{ type: "String", name: "topic-name", description: "Make sure the topic doesn't already exist", required: true, choices: [] }
];
const subcomands = [];
module.exports = new Command("petition", "Petition for a topic text channel", false, options, subcomands);

/** Record a user's petition for a text channel, create channel if sufficient number of petitions
 * @param {import('discord.js').Interaction} interaction */
module.exports.execute = (interaction) => {
	const topicName = interaction.options.getString("topic-name").toLowerCase();
	if (getTopicNames().includes(topicName)) {
		interaction.guild.channels.fetch(findTopicID(topicName)).then(textChannel => {
			joinChannel(textChannel, interaction.user);
		})
		interaction.reply({ content: `A channel for ${topicName} already exists, you've been added to that channel.`, ephemeral: true })
			.catch(console.error);
	} else {
		checkPetition(interaction.guild, topicName, interaction.user);
		interaction.reply(`Your petition for **${topicName}** has been recorded!`)
			.catch(console.error);
	}
}

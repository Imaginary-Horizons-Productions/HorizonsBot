const Command = require('../classes/Command.js');
const { addTopicChannel } = require('../engines/referenceEngine.js');

const options = [
	{ type: "String", name: "topic-name", description: "The new topic", required: true, choices: [] },
];
const subcomands = [];
module.exports = new Command("topic-add", "Set up a topic", false, "moderator", options, subcomands);

/** Creates a new text channel and add it to list of topic channels (to prevent duplicate petitions)
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	const channelName = interaction.options.getString('topic-name');
	addTopicChannel(interaction.guild, channelName).then(channel => {
		interaction.reply(`A new topic channel has been created: ${channel}`)
			.catch(console.error);
	});
}

const { Interaction } = require('discord.js');
const Command = require('../classes/Command.js');
const { isModerator, addTopicChannel } = require('../helpers.js');

const options = [
	{ type: "String", name: "topic-name", description: "The new topic", required: true, choices: [] },
];
const subcomands = [];
module.exports = new Command("topic-add", "(moderator) Set up a topic", true, options, subcomands);

/** Creates a new opt-in text channel for the given topic, adds it to list of topic channels
 * @param {Interaction} interaction
 */
module.exports.execute = (interaction) => {
	if (isModerator(interaction.user.id)) {
		let channelName = interaction.options.getString('topic-name');
		addTopicChannel(interaction.guild, channelName).then(channel => {
			interaction.reply(`A new topic channel has been created: ${channel}`)
				.catch(console.error);
		});
	} else {
		interaction.reply(`The \`${interaction.commandName}\` command is restricted to moderators.`)
			.catch(console.error);
	}
}

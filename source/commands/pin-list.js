const Command = require('../classes/Command.js');
const { isModerator, pinTopicsList, pinClubList } = require('../helpers.js');

const options = [
	{ type: "String", name: "list-type", description: "The list to pin", required: true, choices: [{ name: "Pin the topic list", value: "topic" }, { name: "Pin the club list", value: "club" }] }
];
const subcomands = [];
module.exports = new Command("pin-list", "(moderator) Pin the topics or clubs list message in this channel", true, options, subcomands);

/** Pin the list message for topics or clubs to the receiving channel
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	if (isModerator(interaction.user.id)) {
		const listType = interaction.options.getString("list-type").toLowerCase();
		if (listType === "topic") {
			pinTopicsList(interaction.guild.channels, interaction.channel);
			interaction.reply({ content: "Pinning the topic list succeded.", ephemeral: true })
				.catch(console.error);
		} else if (listType === "club") {
			pinClubList(interaction.guild.channels, interaction.channel);
			interaction.reply({ content: "Pinning the club list succeded.", ephemeral: true })
				.catch(console.error);
		} else {
			interaction.reply({ content: `Please specify either \`topic\` or \`club\` for the type of list to pin.`, ephemeral: true })
				.catch(console.error);
		}
	} else {
		interaction.reply({ content: `Pinning topic or club lists is restricted to Moderators.`, ephemeral: true })
			.catch(console.error);
	}
}

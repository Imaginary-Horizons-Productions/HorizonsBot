const Command = require('../classes/Command.js');
const { joinChannel, findTopicId, getClubDictionary } = require('../helpers.js');

const options = [
	// can't use channel mention because users can't mention channels that are invisible to them (even by constructing the mention manually)
	{ type: "String", name: "channel", description: "The name/id of the topic or club to join", required: true, choices: [] },
];
const subcomands = [];
module.exports = new Command("join", "Join a topic or club", "none", options, subcomands);

/** Determine if user mentioned a topic or club, then provide appropriate permissions
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	const { options, guild, user } = interaction;
	const unparsedChannelCredential = options.getString("channel");
	let channelCredential;
	if (!parseInt(unparsedChannelCredential)) {
		channelCredential = findTopicId(unparsedChannelCredential.toLowerCase());
		if (!channelCredential) {
			const clubs = Object.values(getClubDictionary());
			channelCredential = clubs.find(club => club.title.replace(/-/g, " ").toLowerCase() === unparsedChannelCredential.replace(/-/g, " ").toLowerCase())?.id;

			if (!channelCredential) {
				interaction.reply({ content: `Could not find a topic or club with an id or name of **${unparsedChannelCredential}**.`, ephemeral: true });
				return;
			}
		}
	}

	guild.channels.fetch(channelCredential).then(channel => {
		joinChannel(channel, user);
	})
	interaction.reply({ content: "Channel joined!", ephemeral: true });
}

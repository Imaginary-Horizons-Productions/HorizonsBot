const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const Command = require('../classes/Command.js');
const { SAFE_DELIMITER } = require('../constants.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { getClubDictionary } = require('../engines/referenceEngine.js');

const options = [
	// can't use channel mention because users can't mention channels that are invisible to them (even by constructing the mention manually)
	{ type: "String", name: "club-id", description: "The club text channel's id", required: false, choices: [] },
	{ type: "User", name: "invitee", description: "The user's mention", required: false, choices: [] }
];
const subcommands = [];
module.exports = new Command("club-invite", "Send a user (default: self) an invite to a club", true, "none", 3000, options, subcommands);

/** Provide full details on the given club
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	const clubId = interaction.options.getString("club-id") || interaction.channelId;
	const club = getClubDictionary()[clubId];
	if (!club) {
		interaction.reply({ content: `The club you indicated could not be found. Please check for typos!`, ephemeral: true })
			.catch(console.error);
	}

	const recipient = interaction.options.getUser("invitee") || interaction.user;
	if (!recipient.bot) {
		if (recipient.id !== club.hostId && !club.userIds.includes(recipient.id)) {
			recipient.send({
				embeds: [clubEmbedBuilder(club)], components: [new ActionRowBuilder(
					{
						components: [
							new ButtonBuilder({
								custom_id: `join${SAFE_DELIMITER}${club.id}`,
								label: `Join ${club.title}`,
								style: ButtonStyle.Success
							})
						]
					}
				)]
			}).then(() => {
				interaction.reply({ content: "Club details have been sent.", ephemeral: true });
			}).catch(console.error);
		} else {
			interaction.reply({ content: "If the club details are not pinned, the club host can have them reposted and pinned with `/club-details`.", ephemeral: true })
				.catch(console.error);
		}
	}
}

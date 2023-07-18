const { ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const Command = require('../classes/Command.js');
const { SAFE_DELIMITER } = require('../constants.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { getClubDictionary } = require('../engines/referenceEngine.js');

const options = [
	// can't use channel mention because users can't mention channels that are invisible to them (even by constructing the mention manually)
	{ type: "String", name: "club-id", description: "The club text channel's id", required: false, choices: [] },
	{ type: "String", name: "invitees", description: "The mention(s) of the user(s)", required: false, choices: [] }
];
const subcommands = [];
module.exports = new Command("club-invite", "Send a user (default: self) an invite to a club", true, PermissionFlagsBits.ViewChannel, 3000, options, subcommands);

/** Provide full details on the given club
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = async (interaction) => {
	const clubId = interaction.options.getString("club-id") || interaction.channelId;
	const club = getClubDictionary()[clubId];
	if (!club) {
		interaction.reply({ content: `The club you indicated could not be found. Please check for typos!`, ephemeral: true })
			.catch(console.error);
	}

	const idRegExp = RegExp(/<@(\d+)>/, "g");
	const inviteeIds = [];
	let results;
	while ((results = idRegExp.exec(interaction.options.getString(options[1].name))) != null) {
		inviteeIds.push(results[1]);
	}

	const recipients = [];
	if (results) {
		for (const member of (await interaction.guild.members.fetch(results)).values()) {
			if (!member.bot) {
				recipients.push(member);
			}
		}
	}
	if (recipients.length < 1) {
		recipients.push(interaction.member);
	}

	for (const member of recipients) {
		const components = member.id !== club.hostId && !club.userIds.includes(member.id) ? [new ActionRowBuilder(
			{
				components: [
					new ButtonBuilder({
						custom_id: `join${SAFE_DELIMITER}${club.id}`,
						label: `Join ${club.title}`,
						style: ButtonStyle.Success
					})
				]
			}
		)] : [];
		member.send({ embeds: [clubEmbedBuilder(club)], components });
	}
	interaction.reply({ content: `Details about and an invite to <#${clubId}> details have been sent to ${recipients.join(", ")}.`, ephemeral: true });
}

const { MessageFlags } = require('discord.js');
const { SelectWrapper } = require('../classes');
const { guildId } = require('../constants.js');
const { updateClubDetails } = require('../engines/clubEngine.js');
const { updateListReference, getClub } = require('../engines/referenceEngine.js');

const mainId = "joinclubs";
module.exports = new SelectWrapper(mainId, 3000,
	/** Join the selected clubs */
	async (interaction, args) => {
		const errors = [];
		const guild = await interaction.client.guilds.fetch(guildId);
		for (const channelId of interaction.values) {
			const club = getClub(channelId);
			if (!club) {
				errors.push(`There doesn't seem to exist a club with id ${channelId}.`);
				continue;
			}

			const userId = interaction.user.id;
			if (club.bannedUserIds.includes(userId)) {
				errors.push(`You are currently banned from ${club.name}. Speak to a Moderator if you believe this is in error.`);
				continue;
			}

			const clubRole = await interaction.guild.roles.fetch(club.roleId);
			if (club.hasGuildMember(userId, clubRole.members)) {
				errors.push(`You are already in ${club.name}.`);
				continue;
			}

			if (club.getMembershipStatus(clubRole.members.size) === "full") {
				errors.push(`${club.name} is already full.`);
				continue;
			}

			const clubChannel = await guild.channels.fetch(channelId);
			interaction.member.roles.add(clubRole, "user joined club");
			clubChannel.send(`Welcome to ${club.name}, ${interaction.user}!`);
			updateClubDetails(club, clubChannel);
			updateListReference(guild.channels, "club");
		}

		const messageOptions = {
			content: "You've joined the clubs.",
			flags: MessageFlags.Ephemeral
		}
		if (errors.length > 0) {
			messageOptions.content = `The following errors were encountered while adding you to the clubs:\n- ${errors.join("\n- ")}`;
		}

		interaction.reply(messageOptions);
	}
);

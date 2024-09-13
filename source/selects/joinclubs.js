const { PermissionsBitField } = require('discord.js');
const { SelectWrapper } = require('../classes');
const { guildId } = require('../constants.js');
const { updateClubDetails } = require('../engines/clubEngine.js');
const { updateListReference, getClubDictionary } = require('../engines/referenceEngine.js');

const mainId = "joinclubs";
module.exports = new SelectWrapper(mainId, 3000,
	/** Join the selected clubs */
	(interaction, args) => {
		const errors = [];
		interaction.client.guilds.fetch(guildId).then(guild => {
			for (const channelId of interaction.values) {
				const club = getClubDictionary()[channelId];
				if (!club) {
					errors.push(`There doesn't seem to exist a club with id ${channelId}.`);
					continue;
				}

				if (club.hostId === interaction.user.id || club.userIds.includes(interaction.user.id)) {
					errors.push(`You are already in ${club.title}.`);
					continue;
				}

				if (club.seats !== -1 && !club.isRecruiting()) {
					errors.push(`${club.title} is already full.`);
					continue;
				}

				guild.channels.fetch(channelId).then(clubChannel => {
					const userId = interaction.user.id;
					const { permissionOverwrites, guild, name: channelName } = clubChannel;
					const permissionOverwrite = permissionOverwrites.resolve(userId);
					if (!permissionOverwrite?.deny.has(PermissionsBitField.Flags.ViewChannel, false)) {
						club.userIds.push(userId);
						permissionOverwrites.create(interaction.user, {
							[PermissionsBitField.Flags.ViewChannel]: true
						}).then(() => {
							if (club.voiceType === "private") {
								guild.channels.resolve(club.voiceChannelId).permissionOverwrites.create(interaction.user, {
									[PermissionsBitField.Flags.ViewChannel]: true
								})
							}
							clubChannel.send(`Welcome to ${channelName}, ${interaction.user}!`);
						})
						updateClubDetails(club, clubChannel);
						updateListReference(guild.channels, "club");
					} else {
						errors.push(`You are currently banned from ${channelName}. Speak to a Moderator if you believe this is in error.`);
					}
				});
			}
		})

		const messageOptions = {
			content: "You've joined the clubs.",
			ephemeral: true
		}
		if (errors.length > 0) {
			messageOptions.content = `The following errors were encountered while adding you to the clubs:\n- ${errors.join("\n- ")}`;
		}

		interaction.reply(messageOptions);
	}
);

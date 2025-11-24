const { GuildScheduledEventStatus, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { ButtonWrapper } = require('../classes');
const { getClub } = require('../engines/referenceEngine.js');
const { isModerator } = require("../engines/permissionEngine.js");
const { clearComponents } = require('../util/discordAPIRequests.js');

const mainId = "startevent";
module.exports = new ButtonWrapper(mainId, 3000,
	/** Start a club's event */
	(interaction, [eventId]) => {
		const { hostId } = getClub(interaction.channel.id);
		if (!isModerator(interaction.member) && interaction.user.id !== hostId) {
			return interaction.reply({ content: "Only the club's host or a moderator can start the event.", flags: MessageFlags.Ephemeral });
		}

		interaction.guild.scheduledEvents.fetch(eventId).then(event => {
			return event.setStatus(GuildScheduledEventStatus.Active);
		}).then(() => {
			interaction.update({
				components: [
					new ActionRowBuilder({
						components: [
							new ButtonBuilder({
								customId: 'startevent',
								label: "Event Started!",
								emoji: "👑",
								style: ButtonStyle.Primary,
								disabled: true
							})
						]
					})
				]
			});
		}).catch(error => {
			switch (error.code) {
				case 180000:
					interaction.reply({ content: "This event has already ended.", flags: MessageFlags.Ephemeral });
					break;
				case 10070:
					console.error(`Event ${eventId} could not be started because the event was not found.`);
					interaction.reply({ content: "HorizonsBot could not find the event, please start the event manually or contact a moderator.", flags: MessageFlags.Ephemeral });
					break;
				default:
					console.error(error);
			}
			clearComponents(interaction.message);
		});
	}
);

const { GuildScheduledEventStatus, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const Button = require('../classes/Button.js');
const { isModerator, getClubDictionary } = require('../helpers.js');

const id = "startevent";
module.exports = new Button(id,
	/** Start a club's event
	 * @param {import('discord.js').Interaction} interaction
	 * @param {Array<string>} args
	 */
	(interaction, []) => {
		const { hostId, timeslot: { eventId } } = getClubDictionary()[interaction.message.channel.id];
		if (isModerator(interaction.user.id) || interaction.user.id === hostId) {
			interaction.guild.scheduledEvents.fetch(eventId).then(event => {
				event.setStatus(GuildScheduledEventStatus.Active).catch(error => {
					throw error;
				});
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
						interaction.reply({ content: "This event has already ended.", ephemeral: true });
						break;
					case 10070:
						console.error(`Event ${eventId} could not be started because the event was not found.`);
						interaction.reply({ content: "HorizonsBot could not find the event, please start the event manually or contact a moderator.", ephemeral: true });
						break;
					default:
						console.error(error);
				}
				interaction.message.edit({ components: [] });
			});
		} else {
			interaction.reply({ content: "Only the club's leader or a moderator can start the event.", ephemeral: true });
		}
	}
);

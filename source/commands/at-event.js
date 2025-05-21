const { InteractionContextType, MessageFlags } = require('discord.js');
const { CommandWrapper } = require('../classes');

const mainId = "at-event";
module.exports = new CommandWrapper(mainId, "Send a ping to users interested in an event", null, [InteractionContextType.Guild], 300000,
	/** Send a rate-limited ping to users interested in an event */
	async (interaction) => {
		const unparsedEventId = interaction.options.getString("event-id");
		const eventId = parseInt(unparsedEventId);
		if (!eventId) {
			interaction.reply({ content: `Could not parse **${unparsedEventId}** as an event id.`, flags: MessageFlags.Ephemeral });
			return;
		}

		const event = await interaction.guild.scheduledEvents.fetch(eventId);
		if (!event) {
			interaction.reply({ content: `Could not find an event with id: ${eventId}`, flags: MessageFlags.Ephemeral });
			return;
		}

		event.first().fetchSubscribers().then(subscribers => {
			interaction.reply(`<@${subscribers.map((wrappedUser, userId) => userId).join(">, <@")}> ${interaction.options.getString("message")}`);
		})
	}
).setOptions(
	{ type: "String", name: "event-id", description: "The id of the event to make an announcement for", required: true, choices: [] },
	{ type: "String", name: "message", description: "The text of the notification", required: true, choices: [] }
);

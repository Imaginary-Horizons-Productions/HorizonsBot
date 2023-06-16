const Command = require('../classes/Command.js');

const options = [
	{ type: "String", name: "event-id", description: "The id of the event to make an announcement for", required: true, choices: [] },
	{ type: "String", name: "message", description: "The text of the notification", required: true, choices: [] }
];
const subcomands = [];
module.exports = new Command("at-event", "Send a ping to users interested in an event", false, "none", 300000, options, subcomands);

/** Send a rate-limited ping to users interested in an event
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = async (interaction) => {
	const unparsedEventId = interaction.options.getString("event-id");
	const eventId = parseInt(unparsedEventId);
	if (!eventId) {
		interaction.reply({ content: `Could not parse **${unparsedEventId}** as an event id.`, ephemeral: true });
		return;
	}

	const event = await interaction.guild.scheduledEvents.fetch(eventId);
	if (!event) {
		interaction.reply({ content: `Could not find an event with id: ${eventId}`, ephemeral: true });
		return;
	}

	event.first().fetchSubscribers().then(subscribers => {
		interaction.reply(`<@${subscribers.map((wrappedUser, userId) => userId).join(">, <@")}> ${interaction.options.getString("message")}`);
	})
}

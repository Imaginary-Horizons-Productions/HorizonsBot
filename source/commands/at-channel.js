const { MessageFlags, InteractionContextType } = require('discord.js');
const { CommandWrapper } = require('../classes/InteractionWrapper.js');
const { noAts } = require('../engines/permissionEngine.js');

const mainId = "at-channel";
module.exports = new CommandWrapper(mainId, "Send a ping to the current channel", null, [InteractionContextType.Guild], 300000,
	/** Send a rate-limited ping */
	(interaction) => {
		if (!noAts.includes(interaction.user.id)) {
			// Interaction replies are not parsed for @here or @everyone, so send to channel separately
			interaction.channel.send({ content: interaction.options.getString("type"), flags: MessageFlags.SuppressNotifications });
			interaction.reply(interaction.options.getString("message"));
		} else {
			interaction.reply({ content: `You are not currently permitted to use \`/${mainId}\`. Please speak to a moderator if you believe this to be in error.`, ephemeral: true });
		}
	}
).setOptions(
	{ type: "String", name: "type", description: "Who to notify", required: true, choices: [{ name: "Only online users in this channel", value: "@here" }, { name: "All users in this channel", value: "@everyone" }] },
	{ type: "String", name: "message", description: "The text of the notification", required: true, choices: [] }
);

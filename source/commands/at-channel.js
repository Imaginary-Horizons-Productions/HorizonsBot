const { MessageFlags } = require('discord.js');
const { CommandWrapper } = require('../classes/InteractionWrapper.js');
const { noAts } = require('../engines/permissionEngine.js');

const mainId = "at-channel";
module.exports = new CommandWrapper(mainId, "Send a ping to the current channel", null, false, 300000,
	/** Send a rate-limited ping */
	(interaction) => {
		if (!noAts.includes(interaction.user.id)) {
			const mention = interaction.options.getString("type");
			interaction.reply(`${mention} ${interaction.options.getString("message")}`);
			interaction.channel.send({ content: mention, flags: MessageFlags.SuppressNotifications }).then(pingMessage => {
				setTimeout(() => {
					pingMessage.delete();
				}, 250);
			});
		} else {
			interaction.reply({ content: `You are not currently permitted to use \`/${mainId}\`. Please speak to a moderator if you believe this to be in error.`, ephemeral: true });
		}
	}
).setOptions(
	{ type: "String", name: "type", description: "Who to notify", required: true, choices: [{ name: "Only online users in this channel", value: "@here" }, { name: "All users in this channel", value: "@everyone" }] },
	{ type: "String", name: "message", description: "The text of the notification", required: true, choices: [] }
);

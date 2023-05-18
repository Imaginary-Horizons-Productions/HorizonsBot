const { MessageFlags } = require('discord.js');
const Button = require('../classes/Button.js');

module.exports = new Button("delete",
	/** Delete a club, the host left
	 * @param {import('discord.js').Interaction} interaction
	 * @param {Array<string>} args
	 */
	(interaction, [channelId]) => {
		interaction.reply({ content: "This club is being deleted, its host has left.", flags: MessageFlags.SuppressNotifications }).then(() => {
			interaction.guild.channels.fetch(channelId).then(channel => channel.delete("Club host left"));
		})
	}
);

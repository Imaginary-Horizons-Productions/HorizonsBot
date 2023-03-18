const Button = require('../classes/Button.js');

module.exports = new Button("delete",
	/** Delete a club, the host left
	 * @param {import('discord.js').Interaction} interaction
	 * @param {Array<string>} args
	 */
	(interaction, [channelId]) => {
		interaction.reply("This club is being deleted, its host has left.").then(() => {
			interaction.guild.channels.fetch(channelId).then(channel => channel.delete("Club host left"));
		})
	}
);

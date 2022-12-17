const Button = require('../classes/Button.js');

module.exports = new Button("delete",
	/** Delete a club, the leader left
	 * @param {import('discord.js').Interaction} interaction
	 * @param {Array<string>} args
	 */
	(interaction, [channelId]) => {
		interaction.reply("This club is being deleted, its leader has left.").then(() => {
			interaction.guild.channels.fetch(channelId).then(channel => channel.delete("Club leader left"));
		})
	}
);

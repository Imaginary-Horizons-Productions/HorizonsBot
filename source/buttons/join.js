const Button = require('../classes/Button.js');
const { guildId } = require('../constants.js');
const { joinChannel } = require('../helpers.js');

module.exports = new Button("join",
	/** Join the topic or club channel specified in args
	 * @param {import('discord.js').Interaction} interaction
	 * @param {string[]} args
	 */
	(interaction, [channelId]) => {
		interaction.client.guilds.fetch(guildId).then(guild => {
			guild.channels.fetch(channelId).then(channel => {
				joinChannel(channel, interaction.user);
				interaction.message.edit({ components: [] });
				interaction.reply(`You have joined ${channel}!`);
			})
		})
	});

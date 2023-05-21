const Button = require('../classes/Button.js');
const { guildId } = require('../constants.js');
const { joinChannel } = require('../engines/clubEngine.js');

module.exports = new Button("join",
	/** Join the club specified in args */
	(interaction, [channelId]) => {
		interaction.client.guilds.fetch(guildId).then(guild => {
			guild.channels.fetch(channelId).then(channel => {
				joinChannel(channel, interaction.user);
				interaction.message.edit({ components: [] });
				interaction.reply(`You have joined ${channel}!`);
			})
		})
	});

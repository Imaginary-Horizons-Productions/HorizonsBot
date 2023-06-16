const Button = require('../classes/Button.js');
const { guildId } = require('../constants.js');
const { joinChannel } = require('../engines/clubEngine.js');

module.exports = new Button("join", 3000,
	/** Join the club specified in args */
	(interaction, [channelId]) => {
		interaction.client.guilds.fetch(guildId).then(guild => {
			guild.channels.fetch(channelId).then(channel => {
				joinChannel(channel, interaction.user);
				interaction.message.edit({ components: [] });
				interaction.reply(`You have joined ${channel}!`);
			}).catch(error => {
				if (error.code === "ChannelNotCached") {
					interaction.client.guilds.fetch(guildId).then(guild => {
						return guild.channels.fetch(channelId);
					}).then(clubChannel => {
						guild.channels.fetch(interaction.channelId).then(channel => {
							interaction.message.edit({ components: [] });
							interaction.reply(`You have joined ${clubChannel}!`);
						})
					})
				}
			})
		})
	});

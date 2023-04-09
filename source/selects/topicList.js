const Select = require('../classes/Select.js');
const { joinChannel } = require('../helpers.js');

module.exports = new Select("topicList",
	/** Join the user to the selected topic channels
	 * @param {import('discord.js').Interaction} interaction
	 * @param {string[]} args
	 */
	(interaction, args) => {
		interaction.values.forEach(channelId => {
			interaction.guild.channels.fetch(channelId).then(channel => {
				joinChannel(channel, interaction.user);
			})
		})
		interaction.reply({ content: `You have joined the following topics: <#${interaction.values.join(">, <#")}>`, ephemeral: true })
			.catch(console.error);
	}
);

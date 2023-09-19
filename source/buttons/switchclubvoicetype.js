const Button = require('../classes/Button.js');
const { voiceChannelOptions } = require('../constants.js');
const { modRoleId } = require('../engines/permissionEngine.js');
const { getClubDictionary, updateClub } = require('../engines/referenceEngine.js');

const customId = "switchclubvoicetype";
module.exports = new Button(customId, 3000,
	/** Toggle between stage and private voice channels for a club */
	(interaction, args) => {
		const club = getClubDictionary()[interaction.channel.id];
		const categoryId = interaction.channel.parentId;
		club.voiceType = club.voiceType === "private" ? "stage" : "private";

		interaction.guild.members.fetch(club.hostId).then(host => {
			return interaction.guild.channels.create({
				name: `${club.title} Voice`,
				parent: categoryId,
				...voiceChannelOptions[club.voiceType](interaction.guild, modRoleId, host)
			});
		}).then(newVoiceChannel => {
			const oldVoiceChannelId = club.voiceChannelId;
			club.voiceChannelId = newVoiceChannel.id;
			updateClub(club);
			interaction.guild.channels.delete(oldVoiceChannelId, "club voice type switched");
			interaction.reply({ content: `${newVoiceChannel} has been changed to a ${club.voiceType} channel.`, ephemeral: true });
		})
	}
);

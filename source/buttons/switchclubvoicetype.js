const { MessageFlags } = require('discord.js');
const { ButtonWrapper } = require('../classes');
const { voiceChannelOptions } = require('../constants.js');
const { modRoleId } = require('../engines/permissionEngine.js');
const { updateClub, getClub } = require('../engines/referenceEngine.js');

const mainId = "switchclubvoicetype";
module.exports = new ButtonWrapper(mainId, 3000,
	/** Toggle between stage and private voice channels for a club */
	(interaction, args) => {
		const club = getClub(interaction.channel.id);
		const categoryId = interaction.channel.parentId;
		club.voiceType = club.voiceType === "private" ? "stage" : "private";

		interaction.guild.members.fetch(club.hostId).then(host => {
			return interaction.guild.channels.create({
				name: `${club.title} ${club.voiceType === "private" ? "Voice" : "Stage"}`,
				parent: categoryId,
				...voiceChannelOptions[club.voiceType](interaction.guild, modRoleId, host)
			});
		}).then(newVoiceChannel => {
			const oldVoiceChannelId = club.voiceChannelId;
			club.voiceChannelId = newVoiceChannel.id;
			updateClub(club);
			interaction.guild.channels.delete(oldVoiceChannelId, "club voice type switched");
			interaction.reply({ content: `${newVoiceChannel} has been changed to a ${club.voiceType} channel.`, flags: MessageFlags.Ephemeral });
		})
	}
);

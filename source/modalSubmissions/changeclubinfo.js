const { Interaction } = require('discord.js');
const ModalSubmission = require('../classes/ModalSubmission.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { getClubDictionary, updateClub, updateClubDetails, updateList } = require('../helpers.js');

const id = "changeclubinfo";
module.exports = new ModalSubmission(id,
	/** Set the name, description, game, image and/or color for the club with provided id
	 * @param {Interaction} interaction
	 * @param {Array<string>} args
	 */
	async (interaction, [clubId]) => {
		const club = getClubDictionary()[clubId];
		const { fields } = interaction;

		if (fields.fields.has("title")) {
			const titleInput = fields.getTextInputValue("title");
			club.title = titleInput;
			const textChannel = await interaction.guild.channels.fetch(club.id);
			textChannel.setName(titleInput);
			const voiceChannel = await interaction.guild.channels.fetch(club.voiceChannelId);
			voiceChannel.setName(titleInput + " Voice")
		}
		if (fields.fields.has("description")) {
			const descriptionInput = fields.getTextInputValue("description");
			club.description = descriptionInput;
			const textChannel = await interaction.guild.channels.fetch(club.id);
			textChannel.setTopic(descriptionInput);
		}
		["system", "imageURL", "color"].forEach(simpleStringKey => {
			if (fields.fields.has(simpleStringKey)) {
				const value = fields.getTextInputValue(simpleStringKey);
				club[simpleStringKey] = value;
			}
		});
		updateClubDetails(club, interaction.channel);
		updateList(interaction.guild.channels, "clubs");
		updateClub(club);

		interaction.update({ embeds: [clubEmbedBuilder(club)] });
	});

const ModalSubmission = require('../classes/ModalSubmission.js');
const { updateClubDetails } = require('../engines/clubEngine.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { getClubDictionary, updateClub, updateList } = require('../engines/referenceEngine.js');


const id = "changeclubinfo";
module.exports = new ModalSubmission(id,
	/** Set the name, description, game, image and/or color for the club with provided id */
	async (interaction, [clubId]) => {
		const club = getClubDictionary()[clubId];
		const { fields } = interaction;
		const errors = {};

		if (fields.fields.has("title") || fields.fields.has("description")) {
			const textChannel = await interaction.guild.channels.fetch(club.id);

			const titleInput = fields.getTextInputValue("title");
			if (club.title !== titleInput) {
				club.title = titleInput;
				textChannel.setName(titleInput);
				const voiceChannel = await interaction.guild.channels.fetch(club.voiceChannelId);
				voiceChannel.setName(titleInput + " Voice");
			}
			const descriptionInput = fields.getTextInputValue("description");
			if (club.description !== descriptionInput) {
				club.description = descriptionInput;
				textChannel.setTopic(descriptionInput);
			}
		}
		if (fields.fields.has("imageURL")) {
			const unvalidatedURL = fields.getTextInputValue("imageURL");
			try {
				new URL(unvalidatedURL);
				club.imageURL = unvalidatedURL;
			} catch (error) {
				errors.imageURL = error.message;
			}
		}

		["system", "color"].forEach(simpleStringKey => {
			if (fields.fields.has(simpleStringKey)) {
				const value = fields.getTextInputValue(simpleStringKey);
				club[simpleStringKey] = value;
			}
		});
		updateClubDetails(club, interaction.channel);
		updateList(interaction.guild.channels, "club");
		updateClub(club);

		const payload = { embeds: [clubEmbedBuilder(club)] };
		if (Object.keys(errors).length > 0) {
			payload.content = Object.keys(errors).reduce((errorMessage, field) => {
				return errorMessage + `${field} - ${errors[field]}`
			}, "The following settings were not set because they encountered errors:\n")
		}
		interaction.update(payload);
	});

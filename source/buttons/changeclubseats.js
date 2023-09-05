const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const Button = require('../classes/Button.js');
const { SAFE_DELIMITER } = require('../constants.js');
const { getClubDictionary, updateClub, updateList } = require('../engines/referenceEngine.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { updateClubDetails } = require('../engines/clubEngine.js');

const id = "changeclubseats";
module.exports = new Button(id, 3000,
	/** Set the max members and isRecruting for the club with provided id */
	(interaction, [clubId]) => {
		const club = getClubDictionary()[clubId];
		const modal = new ModalBuilder().setCustomId(`${id}${SAFE_DELIMITER}${clubId}`)
			.setTitle("Club Membership Settings")
			.addComponents(
				new ActionRowBuilder().addComponents(
					new TextInputBuilder().setCustomId("seats")
						.setLabel("Max Members")
						.setValue(club.seats.toString())
						.setStyle(TextInputStyle.Short)
						.setRequired(false)
						.setPlaceholder("Set to -1 to turn off")
				),
			);
		interaction.showModal(modal);
		interaction.awaitModalSubmit({ filter: interaction => interaction.customId === customId, time: timeConversion(5, "m", "ms") }).then(modalSubmission => {
			const { fields } = modalSubmission;
			const errors = {};

			["seats"].forEach(simpleIntegerKey => {
				if (fields.fields.has(simpleIntegerKey)) {
					const unparsedValue = fields.getTextInputValue(simpleIntegerKey);
					const value = parseInt(unparsedValue);
					if (value) {
						club[simpleIntegerKey] = value;
					} else {
						errors[simpleIntegerKey] = `Could not interpret ${unparsedValue} as integer`;
					}
				}
			})
			updateClubDetails(club, modalSubmission.channel);
			updateList(modalSubmission.guild.channels, "club");
			updateClub(club);

			const payload = { embeds: [clubEmbedBuilder(club)] };
			if (Object.keys(errors).length > 0) {
				payload.content = Object.keys(errors).reduce((errorMessage, field) => {
					return errorMessage + `${field} - ${errors[field]}`
				}, "The following settings were not set because they encountered errors:\n")
			}
			modalSubmission.update(payload);
		})
	});

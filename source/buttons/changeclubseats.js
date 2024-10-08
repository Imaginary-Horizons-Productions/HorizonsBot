const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { ButtonWrapper } = require('../classes');
const { getClubDictionary, updateClub, updateListReference } = require('../engines/referenceEngine.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { updateClubDetails } = require('../engines/clubEngine.js');
const { timeConversion } = require('../util/mathUtil.js');
const { SKIP_INTERACTION_HANDLING, SAFE_DELIMITER } = require('../constants.js');

const mainId = "changeclubseats";
module.exports = new ButtonWrapper(mainId, 3000,
	/** Set the max members and isRecruting for the club with provided id */
	(interaction, [clubId]) => {
		const club = getClubDictionary()[clubId];
		const modalCustomId = `${SKIP_INTERACTION_HANDLING}${SAFE_DELIMITER}${interaction.id}`;
		const modal = new ModalBuilder().setCustomId(modalCustomId)
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
		interaction.awaitModalSubmit({ filter: submission => submission.customId === modalCustomId, time: timeConversion(5, "m", "ms") }).then(modalSubmission => {
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
			updateListReference(modalSubmission.guild.channels, "club");
			updateClub(club);

			const payload = { embeds: [clubEmbedBuilder(club)] };
			if (Object.keys(errors).length > 0) {
				payload.content = Object.keys(errors).reduce((errorMessage, field) => {
					return errorMessage + `${field} - ${errors[field]}`
				}, "The following settings were not set because they encountered errors:\n")
			} else {
				payload.content = "";
			}
			modalSubmission.update(payload);
		}).catch(console.error);
	}
);

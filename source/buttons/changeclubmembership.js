const { ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder, TextDisplayBuilder } = require('discord.js');
const { ButtonWrapper } = require('../classes/index.js');
const { updateClub, updateListReference, getClub } = require('../engines/referenceEngine.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { updateClubDetails } = require('../engines/clubEngine.js');
const { timeConversion } = require('../util/mathUtil.js');
const { SKIP_INTERACTION_HANDLING, SAFE_DELIMITER } = require('../constants.js');
const { butIgnoreInteractionCollectorErrors } = require('../util/dAPIResponses.js');

const mainId = "changeclubmembership";
module.exports = new ButtonWrapper(mainId, 3000,
	/** Set the ideal member count for the club with provided id */
	(interaction, [clubId]) => {
		const club = getClub(clubId);
		const labelIdealMemberCount = "Ideal Member Count";
		const inputIdIdIdealMemberCount = "max-members";
		const modal = new ModalBuilder().setCustomId(`${SKIP_INTERACTION_HANDLING}${SAFE_DELIMITER}${interaction.id}`)
			.setTitle("Club Membership Settings")
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent("Ideal Member Count has the following effects:\n- HorizonsBot automatically creates Discord Events for club meetings for clubs below their ideal member count\n- A club is considered full when at or above its ideal member count")
			)
			.addLabelComponents(
				new LabelBuilder()
					.setLabel(labelIdealMemberCount)
					.setDescription("Remember to include the host in the count! Leave empty to turn off.")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId(inputIdIdIdealMemberCount)
							.setValue(club.idealMemberCount?.toString() ?? "")
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
					)
			);
		interaction.showModal(modal);
		interaction.awaitModalSubmit({ filter: submission => submission.customId === modal.data.custom_id, time: timeConversion(5, "m", "ms") }).then(modalSubmission => {
			const unparsedIdealMemberCount = modalSubmission.fields.getTextInputValue(inputIdIdIdealMemberCount);

			const errors = {};
			let didValuesChange = false;
			const idealMemberCountInput = unparsedIdealMemberCount === "" ? null : parseInt(unparsedIdealMemberCount);

			// Explicit null check because `null < 1` evaluates to `true`
			if (isNaN(idealMemberCountInput) || idealMemberCountInput !== null && idealMemberCountInput < 1) {
				errors[labelIdealMemberCount] = `Could not interpret "${unparsedIdealMemberCount}" as a positive integer.`;
			} else {
				didValuesChange |= idealMemberCountInput !== club.idealMemberCount;
				club.idealMemberCount = idealMemberCountInput;
			}

			if (didValuesChange) {
				updateClubDetails(club, modalSubmission.channel);
				updateListReference(modalSubmission.guild.channels, "club");
				updateClub(club);
			}

			const payload = { embeds: [clubEmbedBuilder(club)] };
			if (Object.keys(errors).length > 0) {
				payload.content = Object.keys(errors).reduce((errorMessage, field) => {
					return errorMessage + `${field} - ${errors[field]}`
				}, "The following settings were not set because they encountered errors:\n")
			}
			modalSubmission.update(payload);
		}).catch(butIgnoreInteractionCollectorErrors);
	}
);

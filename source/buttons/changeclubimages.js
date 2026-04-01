const { ModalBuilder, LabelBuilder, FileUploadBuilder, CheckboxBuilder } = require('discord.js');
const { ButtonWrapper } = require('../classes/index.js');
const { updateClub, updateListReference, getClub } = require('../engines/referenceEngine.js');
const { timeConversion } = require('../util/mathUtil.js');
const { updateClubDetails } = require('../engines/clubEngine.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { SAFE_DELIMITER, SKIP_INTERACTION_HANDLING } = require('../constants.js');
const { butIgnoreInteractionCollectorErrors } = require('../util/dAPIResponses.js');

const mainId = "changeclubimages";
module.exports = new ButtonWrapper(mainId, 3000,
	/** Set the image for the club with provided id */
	(interaction, [clubId]) => {
		const club = getClub(clubId);
		const modalCustomId = `${SKIP_INTERACTION_HANDLING}${SAFE_DELIMITER}${interaction.id}`;
		const inputIdImage = "image";
		const inputIdClearImage = "clear-image";
		const modal = new ModalBuilder().setCustomId(modalCustomId)
			.setTitle("Change Club Images")
			.addLabelComponents(
				new LabelBuilder().setLabel("Image")
					.setDescription("An image for the club summary and recruitment events.")
					.setFileUploadComponent(
						new FileUploadBuilder().setCustomId(inputIdImage)
							.setRequired(false)
					),
				new LabelBuilder().setLabel("Clear Image")
					.setCheckboxComponent(
						new CheckboxBuilder().setCustomId(inputIdClearImage)
					)
			);
		interaction.showModal(modal);
		interaction.awaitModalSubmit({ filter: submission => submission.customId === modalCustomId, time: timeConversion(5, "m", "ms") }).then(async modalSubmission => {
			const imageFileCollection = modalSubmission.fields.getUploadedFiles(inputIdImage);
			const clearImageInput = modalSubmission.fields.getCheckbox(inputIdClearImage);

			let imageURLInput = null;
			if (!clearImageInput) {
				if (imageFileCollection) {
					const firstAttachment = imageFileCollection.first();
					if (firstAttachment) {
						imageURLInput = firstAttachment.url;
					}
				} else {
					imageURLInput = club.imageURL;
				}
			}

			if (club.imageURL !== imageURLInput) {
				club.imageURL = imageURLInput;
				updateClubDetails(club, modalSubmission.channel);
				updateListReference(modalSubmission.guild.channels, "club");
				updateClub(club);
			}

			modalSubmission.update({ embeds: [clubEmbedBuilder(club)] });
		}).catch(butIgnoreInteractionCollectorErrors);
	}
);

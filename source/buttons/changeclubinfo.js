const { ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder, FileUploadBuilder } = require('discord.js');
const { ButtonWrapper } = require('../classes');
const { updateClub, updateListReference, getClub } = require('../engines/referenceEngine.js');
const { timeConversion } = require('../util/mathUtil.js');
const { updateClubDetails } = require('../engines/clubEngine.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { SAFE_DELIMITER, SKIP_INTERACTION_HANDLING } = require('../constants.js');
const { ChannelLimits, ButtonLimits } = require('@sapphire/discord.js-utilities');
const { butIgnoreInteractionCollectorErrors } = require('../util/dAPIResponses.js');

const mainId = "changeclubinfo";
module.exports = new ButtonWrapper(mainId, 3000,
	/** Set the name, description, game, image and/or color for the club with provided id */
	(interaction, [clubId]) => {
		const club = getClub(clubId);
		const modalCustomId = `${SKIP_INTERACTION_HANDLING}${SAFE_DELIMITER}${interaction.id}`;
		const nameMaxLength = ButtonLimits.MaximumLabelCharacters - "Join ".length;
		const activityMaxLength = 1024; // The text input limit got raised to 4k, but that's probably unnecessary
		const labelIdName = "name";
		const labelIdDescription = "description";
		const labelIdActivity = "activity";
		const labelIdImage = "image";
		const labelIdColor = "color";
		const modal = new ModalBuilder().setCustomId(modalCustomId)
			.setTitle("Set Club Info")
			.addLabelComponents(
				new LabelBuilder().setLabel("Club Name")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId(labelIdName)
							.setValue(club.name)
							.setStyle(TextInputStyle.Short)
							.setMinLength(1)
							.setMaxLength(nameMaxLength)
					),
				new LabelBuilder().setLabel("Description/Topic")
					.setDescription("This also sets the text channel's topic (top text channel ui)")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId(labelIdDescription)
							.setValue(club.description)
							.setStyle(TextInputStyle.Paragraph)
							.setMaxLength(ChannelLimits.MaximumDescriptionLength)
							.setRequired(false)
					),
				new LabelBuilder().setLabel("Activity")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId(labelIdActivity)
							.setValue(club.activity)
							.setStyle(TextInputStyle.Short)
							.setMaxLength(activityMaxLength)
							.setRequired(false)
					),
				new LabelBuilder().setLabel("Image")
					.setDescription("Send an image as an attachment (DM HorizonsBot?) then right-click -> 'Copy Link' to get a url")
					.setFileUploadComponent(
						new FileUploadBuilder().setCustomId(labelIdImage)
							.setRequired(false)
					),
				new LabelBuilder().setLabel("Color")
					.setDescription("Hexcode format (eg #6b81eb)")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId(labelIdColor)
							.setValue(club.color || "#6b81eb")
							.setStyle(TextInputStyle.Short)
							.setMinLength(6)
							.setMaxLength(7)
							.setRequired(false)
					)
			);
		interaction.showModal(modal);
		interaction.awaitModalSubmit({ filter: submission => submission.customId === modalCustomId, time: timeConversion(5, "m", "ms") }).then(async modalSubmission => {
			const { fields } = modalSubmission;
			const errors = {};

			if (fields.fields.has(labelIdName) || fields.fields.has(labelIdDescription)) {
				const textChannel = await modalSubmission.guild.channels.fetch(club.id);

				const nameInput = fields.getTextInputValue(labelIdName);
				if (club.name !== nameInput) {
					club.name = nameInput;
					textChannel.setName(nameInput);
					const voiceChannel = await modalSubmission.guild.channels.fetch(club.voiceChannelId);
					voiceChannel.setName(`${nameInput} ${club.voiceType === "private" ? "Voice" : "Stage"}`);
				}
				const descriptionInput = fields.getTextInputValue(labelIdDescription);
				if (club.description !== descriptionInput) {
					club.description = descriptionInput;
					textChannel.setTopic(descriptionInput);
				}
			}
			const imageFileCollection = modalSubmission.fields.getUploadedFiles(labelIdImage);
			if (imageFileCollection) {
				const firstAttachment = imageFileCollection.first();
				if (firstAttachment) {
					club.imageURL = firstAttachment.url;
				}
			}

			[labelIdActivity, labelIdColor].forEach(simpleStringKey => {
				if (fields.fields.has(simpleStringKey)) {
					const value = fields.getTextInputValue(simpleStringKey);
					club[simpleStringKey] = value;
				}
			});
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
		}).catch(butIgnoreInteractionCollectorErrors);
	}
);

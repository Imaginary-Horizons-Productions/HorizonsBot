const { ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder } = require('discord.js');
const { ButtonWrapper } = require('../classes/index.js');
const { updateClub, updateListReference, getClub } = require('../engines/referenceEngine.js');
const { timeConversion } = require('../util/mathUtil.js');
const { updateClubDetails } = require('../engines/clubEngine.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { SAFE_DELIMITER, SKIP_INTERACTION_HANDLING } = require('../constants.js');
const { ChannelLimits, ButtonLimits } = require('@sapphire/discord.js-utilities');
const { butIgnoreInteractionCollectorErrors } = require('../util/dAPIResponses.js');

const mainId = "changeclubdescriptors";
module.exports = new ButtonWrapper(mainId, 3000,
	/** Set the name, description, activity, and/or color for the club with provided id */
	(interaction, [clubId]) => {
		const club = getClub(clubId);
		const modalCustomId = `${SKIP_INTERACTION_HANDLING}${SAFE_DELIMITER}${interaction.id}`;
		const nameMaxLength = ButtonLimits.MaximumLabelCharacters - "Join ".length;
		const activityMaxLength = 1024; // The text input limit got raised to 4k, but that's probably unnecessary
		const inputIdName = "name";
		const inputIdDescription = "description";
		const inputIdActivity = "activity";
		const inputIdColor = "color";
		const modal = new ModalBuilder().setCustomId(modalCustomId)
			.setTitle("Change Club Description")
			.addLabelComponents(
				new LabelBuilder().setLabel("Club Name")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId(inputIdName)
							.setValue(club.name)
							.setStyle(TextInputStyle.Short)
							.setMaxLength(nameMaxLength)
					),
				new LabelBuilder().setLabel("Description")
					.setDescription("Also the text channel's topic and recruitment event descriptions.")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId(inputIdDescription)
							.setValue(club.description)
							.setStyle(TextInputStyle.Paragraph)
							.setMaxLength(ChannelLimits.MaximumDescriptionLength)
					),
				new LabelBuilder().setLabel("Activity")
					.setDescription("A short summary of the club's activities. Leave empty to clear.")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId(inputIdActivity)
							.setValue(club.activity || "")
							.setStyle(TextInputStyle.Short)
							.setMaxLength(activityMaxLength)
							.setRequired(false)
					),
				new LabelBuilder().setLabel("Color")
					.setDescription("Hexcode format (eg #6b81eb). Leave empty to clear.")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId(inputIdColor)
							.setValue(club.color || "#6b81eb")
							.setStyle(TextInputStyle.Short)
							.setMinLength(6)
							.setMaxLength(7)
							.setRequired(false)
					)
			);
		interaction.showModal(modal);
		interaction.awaitModalSubmit({ filter: submission => submission.customId === modalCustomId, time: timeConversion(5, "m", "ms") }).then(async modalSubmission => {
			const nameInput = modalSubmission.fields.getTextInputValue(inputIdName);
			const descriptionInput = modalSubmission.fields.getTextInputValue(inputIdDescription);
			const unparsedActivity = modalSubmission.fields.getTextInputValue(inputIdActivity);
			const unparsedColor = modalSubmission.fields.getTextInputValue(inputIdColor);

			const activityInput = unparsedActivity === "" ? null : unparsedActivity;
			const colorInput = unparsedColor === "" ? null : unparsedColor.length < 7 ? `#${unparsedColor}` : unparsedColor;

			const errors = {};
			const didNameChange = club.name !== nameInput;
			const didDescriptionChange = club.description !== descriptionInput;
			const didActivityChange = club.activity !== activityInput;
			const didColorChange = club.color !== colorInput;
			const didValuesChange = didNameChange || didDescriptionChange || didActivityChange || didColorChange;

			if (didColorChange) {
				const colorErrors = [];
				if (colorInput.length === 7 && colorInput[0] !== "#") {
					colorErrors.push("Color codes of length 7 must start with #.");
				}
				if (unparsedColor.slice(7 - colorInput.length).search(/[^\dAaBbCcDdEeFf]+/) !== -1) {
					colorErrors.push("Each pair of characters in the color code must be a base-16 number.");
				}
				if (colorErrors.length > 0) {
					errors.Color = colorErrors;
				}
			}

			if (didNameChange || didDescriptionChange) {
				const textChannel = await modalSubmission.guild.channels.fetch(club.id);
				if (didNameChange) {
					club.name = nameInput;
					textChannel.setName(nameInput);
					const voiceChannel = await modalSubmission.guild.channels.fetch(club.voiceChannelId);
					voiceChannel.setName(`${nameInput} Voice`);
				}

				if (didDescriptionChange) {
					club.description = descriptionInput;
					textChannel.setTopic(descriptionInput);
				}
			}

			if (didActivityChange) {
				club.activity = activityInput;
			}

			if (didColorChange) {
				club.color = unparsedColor;
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
			} else {
				payload.content = "";
			}
			modalSubmission.update(payload);
		}).catch(butIgnoreInteractionCollectorErrors);
	}
);

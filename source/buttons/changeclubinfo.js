const { ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder } = require('discord.js');
const { ButtonWrapper } = require('../classes');
const { updateClub, updateListReference, getClub } = require('../engines/referenceEngine.js');
const { timeConversion } = require('../util/mathUtil.js');
const { updateClubDetails } = require('../engines/clubEngine.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { SAFE_DELIMITER, SKIP_INTERACTION_HANDLING } = require('../constants.js');
const { ChannelLimits, ButtonLimits } = require('@sapphire/discord.js-utilities');

const mainId = "changeclubinfo";
module.exports = new ButtonWrapper(mainId, 3000,
	/** Set the name, description, game, image and/or color for the club with provided id */
	(interaction, [clubId]) => {
		const club = getClub(clubId);
		const modalCustomId = `${SKIP_INTERACTION_HANDLING}${SAFE_DELIMITER}${interaction.id}`;
		const nameMaxLength = ButtonLimits.MaximumLabelCharacters - "Join ".length;
		const activityMaxLength = 1024; // The text input limit got raised to 4k, but that's probably unnecessary
		const modal = new ModalBuilder().setCustomId(modalCustomId)
			.setTitle("Set Club Info")
			.addLabelComponents(
				new LabelBuilder().setLabel("Club Name")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId("title")
							.setValue(club.title)
							.setStyle(TextInputStyle.Short)
							.setMinLength(1)
							.setMaxLength(nameMaxLength)
					),
				new LabelBuilder().setLabel("Description/Topic")
					.setDescription("This also sets the text channel's topic (top text channel ui)")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId("description")
							.setValue(club.description)
							.setStyle(TextInputStyle.Paragraph)
							.setMaxLength(ChannelLimits.MaximumDescriptionLength)
							.setRequired(false)
					),
				new LabelBuilder().setLabel("Activity")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId("system")
							.setValue(club.system)
							.setStyle(TextInputStyle.Short)
							.setMaxLength(activityMaxLength)
							.setRequired(false)
					),
				new LabelBuilder().setLabel("Image")
					.setDescription("Send an image as an attachment (DM HorizonsBot?) then right-click -> 'Copy Link' to get a url")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId("imageURL")
							.setValue(club.imageURL)
							.setStyle(TextInputStyle.Paragraph)
							.setRequired(false)
					),
				new LabelBuilder().setLabel("Color")
					.setDescription("Hexcode format (eg #6b81eb)")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId("color")
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

			if (fields.fields.has("title") || fields.fields.has("description")) {
				const textChannel = await modalSubmission.guild.channels.fetch(club.id);

				const titleInput = fields.getTextInputValue("title");
				if (club.title !== titleInput) {
					club.title = titleInput;
					textChannel.setName(titleInput);
					const voiceChannel = await modalSubmission.guild.channels.fetch(club.voiceChannelId);
					voiceChannel.setName(`${titleInput} ${club.voiceType === "private" ? "Voice" : "Stage"}`);
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

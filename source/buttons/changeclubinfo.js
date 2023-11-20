const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { ButtonWrapper } = require('../classes');
const { getClubDictionary, updateClub, updateList } = require('../engines/referenceEngine.js');
const { timeConversion } = require('../helpers.js');
const { updateClubDetails } = require('../engines/clubEngine.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');

const mainId = "changeclubinfo";
module.exports = new ButtonWrapper(mainId, 3000,
	/** Set the name, description, game, image and/or color for the club with provided id */
	(interaction, [clubId]) => {
		const club = getClubDictionary()[clubId];
		const modal = new ModalBuilder().setCustomId(mainId)
			.setTitle("Set Club Info")
			.addComponents(
				new ActionRowBuilder().addComponents(
					new TextInputBuilder().setCustomId("title")
						.setLabel("Club Name")
						.setValue(club.title)
						.setStyle(TextInputStyle.Short)
						.setMinLength(1)
						.setMaxLength(94)
				),
				new ActionRowBuilder().addComponents(
					new TextInputBuilder().setCustomId("description")
						.setLabel("Description/Topic")
						.setValue(club.description)
						.setStyle(TextInputStyle.Paragraph)
						.setMaxLength(1024)
						.setRequired(false)
						.setPlaceholder("This is also set as the text channel's topic (top text channel ui)")
				),
				new ActionRowBuilder().addComponents(
					new TextInputBuilder().setCustomId("system")
						.setLabel("Game")
						.setValue(club.system)
						.setStyle(TextInputStyle.Short)
						.setMaxLength(1024)
						.setRequired(false)
				),
				new ActionRowBuilder().addComponents(
					new TextInputBuilder().setCustomId("imageURL")
						.setLabel("Image")
						.setValue(club.imageURL)
						.setStyle(TextInputStyle.Paragraph)
						.setRequired(false)
						.setPlaceholder("Send an image as an attachment (DM HorizonsBot?) then right-click -> 'Copy Link' to get a url")
				),
				new ActionRowBuilder().addComponents(
					new TextInputBuilder().setCustomId("color")
						.setLabel("Color")
						.setValue(club.color || "#6b81eb")
						.setStyle(TextInputStyle.Short)
						.setMinLength(6)
						.setMaxLength(7)
						.setRequired(false)
						.setPlaceholder("Hexcode format (eg #6b81eb)")
				)
			);
		interaction.showModal(modal);
		interaction.awaitModalSubmit({ filter: interaction => interaction.customId === mainId, time: timeConversion(5, "m", "ms") }).then(async modalSubmission => {
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
			updateList(modalSubmission.guild.channels, "club");
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

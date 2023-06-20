const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const Button = require('../classes/Button.js');
const { SAFE_DELIMITER } = require('../constants.js');
const { getClubDictionary } = require('../engines/referenceEngine.js');

const id = "changeclubinfo";
module.exports = new Button(id, 3000,
	/** Opens a modal to change the name, description, game, imageURL, or color of the club */
	(interaction, [clubId]) => {
		const club = getClubDictionary()[clubId];
		const modal = new ModalBuilder().setCustomId(`${id}${SAFE_DELIMITER}${clubId}`)
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
	});

const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const Button = require('../classes/Button.js');
const { SAFE_DELIMITER } = require('../constants.js');
const { getClubDictionary } = require('../engines/referenceEngine.js');

const id = "changeclubseats";
module.exports = new Button(id,
	/** Opens a modal to change the max seats and recruiting toggle of the club */
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
	});

const { Interaction, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const Button = require('../classes/Button.js');
const { SAFE_DELIMITER } = require('../constants.js');
const { getClubDictionary } = require('../helpers.js');

const id = "changeclubseats";
module.exports = new Button(id,
	/** Opens a modal to change the max seats and recruiting toggle of the club
	 * @param {Interaction} interaction
	 * @param {Array<string>} args
	 */
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
				// new ActionRowBuilder().addComponents(
				// 	new TextInputBuilder().setCustomId("isRecruiting")
				// 		.setLabel("Active Recruiting")
				// 		.setValue(club.color) //TODONOW update Club type
				// 		.setStyle(TextInputStyle.Short)
				// 		.setMaxLength(7)
				// 		.setRequired(false)
				// )
			);
		interaction.showModal(modal);
	});

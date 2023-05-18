const { Interaction } = require('discord.js');
const ModalSubmission = require('../classes/ModalSubmission.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { getClubDictionary, updateClub, updateClubDetails, updateList } = require('../helpers.js');

const id = "changeclubseats";
module.exports = new ModalSubmission(id,
	/** Set the max members and isRecruting for the club with provided id
	 * @param {Interaction} interaction
	 * @param {Array<string>} args
	 */
	async (interaction, [clubId]) => {
		const club = getClubDictionary()[clubId];
		const { fields } = interaction;
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
		updateClubDetails(club, interaction.channel);
		updateList(interaction.guild.channels, "club");
		updateClub(club);

		const payload = { embeds: [clubEmbedBuilder(club)] };
		if (Object.keys(errors).length > 0) {
			payload.content = Object.keys(errors).reduce((errorMessage, field) => {
				return errorMessage + `${field} - ${errors[field]}`
			}, "The following settings were not set because they encountered errors:\n")
		}
		interaction.update(payload);
	});

const { Interaction } = require('discord.js');
const ModalSubmission = require('../classes/ModalSubmission.js');
const { getClubDictionary, updateClub, updateClubDetails, updateList, clubInviteBuilder } = require('../helpers.js');

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
		//TODONOW isRecruiting (cast to boolean)
		updateClubDetails(club, interaction.channel);
		updateList(interaction.guild.channels, "clubs");
		updateClub(club);

		const { embeds } = clubInviteBuilder(club, false);
		const payload = { embeds };
		if (Object.keys(errors).length > 0) {
			payload.content = Object.keys(errors).reduce((errorMessage, field) => {
				return errorMessage + `${field} - ${errors[field]}`
			}, "The following settings were not set because they encountered errors:\n")
		}
		interaction.update(payload);
	});

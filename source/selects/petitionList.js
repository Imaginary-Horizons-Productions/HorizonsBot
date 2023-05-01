const Select = require('../classes/Select.js');
const { checkPetition } = require('../helpers.js');

module.exports = new Select("petitionList",
	/** Have the user petition for the selected topics
	 * @param {import('discord.js').Interaction} interaction
	 * @param {string[]} args
	 */
	(interaction, args) => {
		interaction.values.forEach(petition => {
			checkPetition(interaction.guild, petition, interaction.user);
		})
		interaction.reply({ content: `You have petitioned for the following topics: ${interaction.values.join(", ")}`, ephemeral: true });
	}
);
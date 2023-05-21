const Select = require('../classes/Select.js');
const { checkPetition } = require('../engines/referenceEngine.js');

module.exports = new Select("petitionList",
	/** Have the user petition for the selected topics */
	(interaction, args) => {
		interaction.values.forEach(petition => {
			checkPetition(interaction.guild, petition, interaction.user);
		})
		interaction.reply({ content: `You have petitioned for the following topics: ${interaction.values.join(", ")}`, ephemeral: true });
	}
);

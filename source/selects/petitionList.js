const { SelectWrapper } = require('../classes/InteractionWrapper.js');
const { checkPetition } = require('../engines/referenceEngine.js');

const mainId = "petitionList";
module.exports = new SelectWrapper(mainId, 3000,
	/** Have the user petition for the selected topics */
	(interaction, args) => {
		interaction.values.forEach(petition => {
			checkPetition(interaction.guild, petition, interaction.user);
		})
		interaction.reply({ content: `You have petitioned for the following topics: ${interaction.values.join(", ")}`, ephemeral: true });
	}
);

const { PermissionFlagsBits } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { getPetitions, setPetitions } = require('../engines/referenceEngine.js');

const mainId = "petition-veto";
const options = [
	{ type: "String", name: "topic", description: "The petition to close", required: true, choices: [] },
];
const subcomands = [];
module.exports = new CommandWrapper(mainId, "Veto a petition", PermissionFlagsBits.ManageChannels, true, 3000, options, subcomands,
	/** Remove the given petition from the petition list */
	(interaction) => {
		const vetoedPetition = interaction.options.getString('topic');
		const petitions = getPetitions();
		if (vetoedPetition in petitions) {
			delete petitions[vetoedPetition];
			setPetitions(petitions, interaction.guild.channels);
			interaction.reply(`The petition for ${vetoedPetition} has been vetoed.`)
				.catch(console.error);
		} else {
			interaction.reply(`There doesn't seem to be an open petition for ${vetoedPetition}.`)
				.catch(console.error);
		}
	}
);

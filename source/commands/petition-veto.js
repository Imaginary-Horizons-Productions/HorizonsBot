const { PermissionFlagsBits } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { getPetitions, setPetitions } = require('../engines/referenceEngine.js');
const { isModerator } = require('../engines/permissionEngine.js');

const mainId = "petition-veto";
module.exports = new CommandWrapper(mainId, "Veto a petition", PermissionFlagsBits.ManageChannels, true, 3000,
	/** Remove the given petition from the petition list */
	(interaction) => {
		if (!isModerator(interaction.member)) {
			interaction.reply(`\`/${interaction.commandName}\` is a moderator-only command.`);
			return;
		}

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
).setOptions(
	{ type: "String", name: "topic", description: "The petition to close", required: true, choices: [] }
);

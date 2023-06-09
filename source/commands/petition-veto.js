const Command = require('../classes/Command.js');
const { getPetitions, setPetitions } = require('../engines/referenceEngine.js');

const options = [
	{ type: "String", name: "topic", description: "The petition to close", required: true, choices: [] },
];
const subcomands = [];
module.exports = new Command("petition-veto", "Veto a petition", true, "moderator", options, subcomands);

/** Remove the given petition from the petition list
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	let vetoedPetition = interaction.options.getString('topic');
	let petitions = getPetitions();
	let petitionersIDs = petitions[vetoedPetition];
	if (petitionersIDs) {
		delete petitions[vetoedPetition];
		setPetitions(petitions, interaction.guild.channels);
		interaction.reply(`The petition for ${vetoedPetition} has been vetoed.`)
			.catch(console.error);
	} else {
		interaction.reply(`There doesn't seem to be an open petition for ${vetoedPetition}.`)
			.catch(console.error);
	}
}

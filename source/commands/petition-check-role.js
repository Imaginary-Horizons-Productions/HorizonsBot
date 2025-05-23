const { InteractionContextType, MessageFlags } = require('discord.js');
const { CommandWrapper } = require('../classes/index.js');
const { checkRolePetition, getRolePetitions } = require('../engines/customizationEngine.js');

const mainId = "petition-check-role";
module.exports = new CommandWrapper(mainId, "Check how many more signatures a role petition needs", null, [InteractionContextType.Guild], 3000,
	(interaction) => {
		const rolePetition = interaction.options.getString("role-petition").toLowerCase();
		const { petitionCount: roleSignatures, threshold: roleThreshold } = checkRolePetition(interaction.guild, rolePetition);
		interaction.reply({ content: `The role petition for ${rolePetition} has ${roleSignatures} signatures (needs ${roleThreshold}).`, flags: MessageFlags.Ephemeral });
	}
).setOptions(
	{
		type: "String", name: "role-petition", description: "The Pingable Role petition to check", required: false, autocomplete: (input) => {
			return getRolePetitions().map(petition => ({ name: petition.name.toLowerCase(), value: petition.name.toLowerCase() })).filter(option => option.name.includes(input));
		}
	}
);

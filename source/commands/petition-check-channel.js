const { InteractionContextType, MessageFlags } = require('discord.js');
const { CommandWrapper } = require('../classes/index.js');
const { checkChannelPetition, getChannelPetitions } = require('../engines/customizationEngine.js');

const mainId = "petition-check-channel";
module.exports = new CommandWrapper(mainId, "Check how many more signatures a channel petition needs", null, [InteractionContextType.Guild], 3000,
	async (interaction) => {
		const channelPetition = interaction.options.getString("channel-petition").toLowerCase();
		const { petitionCount: channelSignatures, threshold: channelThreshold } = await checkChannelPetition(interaction.guild, channelPetition);
		interaction.reply({ content: `The channel petition for ${channelPetition} has ${channelSignatures} signatures (needs ${channelThreshold}).`, flags: [MessageFlags.Ephemeral] });
	}
).setOptions(
	{
		type: "String", name: "channel-petition", description: "The Opt-In Channel petition to check", required: false, autocomplete: (input) => {
			return getChannelPetitions().map(petition => ({ name: petition.name.toLowerCase(), value: petition.name.toLowerCase() })).filter(option => option.name.includes(input));
		}
	}
);

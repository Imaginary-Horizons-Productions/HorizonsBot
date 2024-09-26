const { PermissionFlagsBits, InteractionContextType } = require('discord.js');
const { CommandWrapper } = require('../classes/index.js');
const { isModerator } = require('../engines/permissionEngine.js');
const { createOptInChannel, findOptInChannelWithName } = require('../engines/customizationEngine.js');

const mainId = "create-opt-in-channel";
module.exports = new CommandWrapper(mainId, "Set up an opt-in channel without petitions", PermissionFlagsBits.ManageChannels, [InteractionContextType.Guild], 3000,
	async (interaction) => {
		if (!isModerator(interaction.member)) {
			interaction.reply(`\`/${interaction.commandName}\` is a moderator-only command.`);
			return;
		}

		const channelName = interaction.options.getString("channel-name");
		const dupeChannel = await findOptInChannelWithName(channelName, interaction.guild);
		if (dupeChannel) {
			interaction.reply({ content: `${dupeChannel} already exists.`, ephemeral: true });
			return;
		}

		createOptInChannel(interaction.guild, channelName, interaction.user.displayName).then(channel => {
			interaction.reply(`A new opt-in channel has been created: ${channel}`)
				.catch(console.error);
		});
	}
).setOptions(
	{ type: "String", name: "channel-name", description: "Discord forces channel names to lowercase", required: true, choices: [] }
);

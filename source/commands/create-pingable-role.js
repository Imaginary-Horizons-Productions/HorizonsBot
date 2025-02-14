const { PermissionFlagsBits, InteractionContextType, MessageFlags } = require('discord.js');
const { CommandWrapper } = require('../classes/index.js');
const { isModerator } = require('../engines/permissionEngine.js');
const { createPingableRole, findPingableRoleWithName } = require('../engines/customizationEngine.js');

const mainId = "create-pingable-role";
module.exports = new CommandWrapper(mainId, "Set up a Pingable Role without petitions", PermissionFlagsBits.ManageRoles, [InteractionContextType.Guild], 3000,
	async (interaction) => {
		if (!isModerator(interaction.member)) {
			interaction.reply(`\`/${interaction.commandName}\` is a moderator-only command.`);
			return;
		}

		const roleName = interaction.options.getString("role-name");
		const dupeRole = await findPingableRoleWithName(roleName, interaction.guild);
		if (dupeRole) {
			interaction.reply({ content: `${dupeRole} already exists.`, flags: [MessageFlags.Ephemeral] });
			return;
		}

		createPingableRole(interaction.guild, roleName, interaction.user.displayName).then(role => {
			interaction.reply(`A new Pingable Role has been created: ${role}`)
				.catch(console.error);
		});
	}
).setOptions(
	{ type: "String", name: "role-name", description: "Make sure the role doesn't already exist", required: true, choices: [] }
);

const { CommandInteraction, MessageFlags } = require("discord.js");
const { checkRolePetition, findPingableRoleWithName } = require("../../engines/customizationEngine");
const { updateListReference } = require("../../engines/referenceEngine");

/**
 * @param {CommandInteraction} interaction
 * @param {...unknown} args
 */
async function executeSubcommand(interaction, ...args) {
	const roleName = interaction.options.getString("role-name");
	const dupeRole = await findPingableRoleWithName(roleName, interaction.guild);
	if (dupeRole) {
		interaction.reply({ content: `${dupeRole} already exists. You can use <id:customize> to get it.`, flags: MessageFlags.Ephemeral });
		return;
	}

	const stats = checkRolePetition(interaction.guild, roleName, interaction.user);
	switch (stats.result) {
		case "signatureAdded":
			interaction.reply({ content: `Your petition has been recorded. ${stats.threshold - stats.petitionCount} more petitions are needed to create the role.`, flags: MessageFlags.Ephemeral });
			break;
		case "duplicateSignature":
			interaction.reply({ content: `You've already petitioned for a ${roleName} Pingable Role.`, flags: MessageFlags.Ephemeral });
			break;
		case "petitionFulfilled":
			interaction.reply({ content: `The ${roleName} Pingable Role has been created and given to petitioners.`, flags: MessageFlags.Ephemeral });
			break;
	}
	updateListReference(interaction.guild.channels, "petition");
};

module.exports = {
	data: {
		name: "pingable-role",
		description: "A role for pinging server members for grouping up",
		optionsInput: [
			{
				type: "String",
				name: "role-name",
				description: "Make sure the role doesn't already exist",
				required: true
			}
		]
	},
	executeSubcommand
};

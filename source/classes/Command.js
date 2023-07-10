const { SlashCommandBuilder } = require("discord.js");

module.exports = class Command {
	/** IHP wrapper for slash commands
	 * @param {string} customIdInput
	 * @param {string} descriptionInput
	 * @param {import("discord.js").PermissionFlags | null} defaultPermission
	 * @param {number} cooldownInMS
	 * @param {Array} optionsInput
	 * @param {Array} subcommandsInput
	 */
	constructor(customIdInput, descriptionInput, isDMCommand, defaultPermission, cooldownInMS, optionsInput, subcommandsInput) {
		this.customId = customIdInput;
		this.permissionLevel = defaultPermission;
		this.cooldown = cooldownInMS;
		this.data = new SlashCommandBuilder()
			.setName(customIdInput)
			.setDescription(descriptionInput)
			.setDMPermission(isDMCommand);
		if (defaultPermission) {
			this.data.setDefaultMemberPermissions(defaultPermission);
		}
		optionsInput.forEach(option => {
			this.data[`add${option.type}Option`](built => {
				built.setName(option.name).setDescription(option.description).setRequired(option.required);
				if (option.choices === null || option.choices === undefined) {
					throw `Error: ${this.nameInput} (${descriptionInput}) ${option.type} Option was nullish.`;
				}
				if (option.choices.length) {
					built.addChoices(...option.choices);
				}
				return built;
			})
		})
		subcommandsInput.forEach(subcommand => {
			this.data.addSubcommand(built => {
				built.setName(subcommand.name).setDescription(subcommand.description);
				subcommand.optionsInput.forEach(option => {
					built[`add${option.type}Option`](subBuilt => {
						subBuilt.setName(option.name).setDescription(option.description).setRequired(option.required);
						if (option.choices === null || option.choices === undefined) {
							throw `Error: ${this.nameInput} (${descriptionInput}) ${option.type} Option was nullish.`;
						}
						let choiceEntries = Object.entries(option.choices);
						if (choiceEntries.length) {
							subBuilt.addChoices(Object.entries(option.choices));
						}
						return subBuilt;
					})
				})
				return built;
			})
		})
	}

	execute(interaction) { }
}

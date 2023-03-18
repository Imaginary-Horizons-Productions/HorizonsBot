const { SlashCommandBuilder } = require("discord.js");

module.exports = class Command {
	/** IHP wrapper for slash commands
	 * @param {string} nameInput
	 * @param {string} descriptionInput
	 * @param {"none" | "moderator" | "moderator/club host"} permissionLevelEnum
	 * @param {Array} optionsInput
	 * @param {Array} subcommandsInput
	 */
	constructor(nameInput, descriptionInput, permissionLevelEnum, optionsInput, subcommandsInput) {
		this.name = nameInput;
		switch (permissionLevelEnum) {
			case "moderator":
				this.description = `(moderator) ${descriptionInput}`;
				break;
			case "moderator or club host":
				this.description = `(moderator/club host) ${descriptionInput}`;
				break;
			default:
				this.description = descriptionInput;
		}
		this.permissionLevel = permissionLevelEnum;
		this.data = new SlashCommandBuilder()
			.setName(nameInput)
			.setDescription(this.description);
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

const Command = require('../classes/Command.js');
const CommandSet = require('../classes/CommandSet.js');

// A maximum of 25 command sets are supported by /commands to conform with MessageEmbed limit of 25 fields
exports.commandSets = [
	new CommandSet("General Commands", "These commands are general use utilities for the server.", false,
		["at-channel.js", "timestamp.js", "roll.js", "join.js", "leave.js", "petition.js"]),
	new CommandSet("Informantional Commands", "Use these commands to learn more about this server or HorizonsBot.", false,
		["rules.js", "commands.js", "roles.js", "list.js", "about.js", "version.js", "data-policy.js", "press-kit.js"]),
	new CommandSet("Topic Commands", "This server has opt-in topic channels (hidden by default). New topics are automatically generated when enough members /petition for them.", false,
		["topic-add.js", "remove-user.js"]),
	new CommandSet("Club Commands", "Clubs are private text and voice channels that include organization utilities like automatic reminders.", false,
		["club-add.js", "club-send-reminder.js", "club-config.js", "club-promote-host.js"]),
	new CommandSet("Moderation Commands", "Commands for moderators. Required permissions are listed in (parenthesis) at the beginning of the description.", true,
		["at-permission.js", "petition-check.js", "delete.js", "manage-mods.js", "pin-list.js"])
];

exports.commandFiles = exports.commandSets.reduce((allFiles, set) => allFiles.concat(set.fileNames), []);
const commandDictionary = {};
exports.slashData = [];

for (const file of exports.commandFiles) {
	const command = require(`./${file}`);
	commandDictionary[command.name] = command;
	exports.slashData.push(command.data.toJSON());
}

/**
 * @param {string} commandName
 * @returns {Command}
 */
exports.getCommand = function (commandName) {
	return commandDictionary[commandName];
}

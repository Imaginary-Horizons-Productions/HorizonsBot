const Command = require('../classes/Command.js');
const CommandSet = require('../classes/CommandSet.js');

// A maximum of 25 command sets are supported by /commands to conform with MessageEmbed limit of 25 fields
exports.commandSets = [
	new CommandSet("General Commands", "These commands are general use utilities for the server.", false,
		["at-channel.js", "timestamp.js", "roll.js", "petition.js"]),
	new CommandSet("Informantional Commands", "Use these commands to learn more about this server or HorizonsBot.", false,
		["info.js", "commands.js", "list.js", "version.js", "petition-check.js"]),
	new CommandSet("Club Commands", "Clubs are private text and voice channels that include organization utilities like automatic reminders.", false,
		["club-invite.js", "club-kick.js", "club-leave.js", "club-send-reminder.js", "club-config.js", "club-promote-host.js", "club-add.js", "club-sunset.js"]),
	new CommandSet("Moderation Commands", "Commands for moderators. Required permissions are listed in (parenthesis) at the beginning of the description.", true,
		["at-permission.js", "petition-veto.js", "topic-add.js", "manage-mods.js", "post-reference.js"])
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

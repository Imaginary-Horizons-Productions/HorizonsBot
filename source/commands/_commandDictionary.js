const CommandSet = require('../classes/CommandSet.js');

// A maximum of 25 command sets are supported by /commands to conform with MessageEmbed limit of 25 fields
exports.commandSets = [
	new CommandSet("General Commands", "These commands are general use utilities for the server.", false,
		["at-channel.js", "timestamp.js"]),
	new CommandSet("Informantional Commands", "Use these commands to learn more about HorizonsBot or this server.", false,
		["rules.js", "commands.js", "roles.js", "about.js", "version.js", "data-policy.js", "press-kit.js"]),
	// new CommandSet("Topic Commands", "This server has opt-in topic channels that are automatically generated when enough members petition for them.", false,
	// 	[]),
	// new CommandSet("Club Commands", "Clubs are private text and voice channels that include organization utilities like automatic reminders.", false,
	// 	[]),
	new CommandSet("Moderation Commands", "Commands for moderators. Required permissions are listed in (parenthesis) at the beginning of the description.", true,
		["at-permission.js"])
];

exports.commandFiles = exports.commandSets.reduce((allFiles, set) => allFiles.concat(set.fileNames), []);
const commandDictionary = {};
exports.slashData = [];

for (const file of exports.commandFiles) {
	const command = require(`./${file}`);
	commandDictionary[command.name] = command;
	exports.slashData.push(command.data.toJSON());
}

exports.getCommand = function (commandName) {
	return commandDictionary[commandName];
}

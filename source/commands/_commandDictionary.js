const Command = require('../classes/Command.js');

exports.commandFiles = [
	"at-channel.js",
	"at-event.js",
	"at-permission.js",
	"club-add.js",
	"club-config.js",
	"club-invite.js",
	"club-kick.js",
	"club-leave.js",
	"club-promote-host.js",
	"club-send-reminder.js",
	"club-sunset.js",
	"commands.js",
	"data-policy.js",
	"info.js",
	"list.js",
	"manage-mods.js",
	"petition-check.js",
	"petition-veto.js",
	"petition.js",
	"post-reference.js",
	"roll.js",
	"timestamp.js",
	"topic-add.js",
	"version.js"
];
const commandDictionary = {};
exports.slashData = [];

for (const file of exports.commandFiles) {
	const command = require(`./${file}`);
	commandDictionary[command.customId] = command;
	exports.slashData.push(command.data.toJSON());
}

/**
 * @param {string} commandName
 * @returns {Command}
 */
exports.getCommand = function (commandName) {
	return commandDictionary[commandName];
}

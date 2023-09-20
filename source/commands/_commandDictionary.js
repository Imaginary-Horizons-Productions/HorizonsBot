const { CommandWrapper } = require('../classes');

exports.commandFiles = [
	"about.js",
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
	"list.js",
	"manage-mods.js",
	"petition-check.js",
	"petition-veto.js",
	"petition.js",
	"post-reference.js",
	"press-kit.js",
	"roles-rundown.js",
	"roll.js",
	"server-rules.js",
	"timestamp.js",
	"topic-add.js",
	"version.js"
];
/** @type {Record<string, CommandWrapper>} */
const commandDictionary = {};
exports.slashData = [];

for (const file of exports.commandFiles) {
	/** @type {CommandWrapper} */
	const command = require(`./${file}`);
	commandDictionary[command.mainId] = command;
	exports.slashData.push(command.builder.toJSON());
}

/** @param {string} mainId */
exports.getCommand = function (mainId) {
	return commandDictionary[mainId];
}

const { CommandWrapper } = require('../classes');

const commandFiles = [
	"about.js",
	"at-channel.js",
	"at-event.js",
	"at-permission",
	"club-add.js",
	"club-config.js",
	"club-invite.js",
	"club-kick.js",
	"club-leave.js",
	"club-promote-host.js",
	"club-send-reminder.js",
	"club-skip-meeting.js",
	"club-sunset.js",
	"commands.js",
	"data-policy.js",
	"list",
	"manage-mods",
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
const slashData = [];

for (const file of commandFiles) {
	/** @type {CommandWrapper} */
	const command = require(`./${file}`);
	commandDictionary[command.mainId] = command;
	slashData.push(command.builder.toJSON());
}

/** @param {string} mainId */
function getCommand(mainId) {
	return commandDictionary[mainId];
}

module.exports = {
	commandFiles,
	slashData,
	getCommand
};

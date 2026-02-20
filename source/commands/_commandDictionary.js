const { CommandWrapper, BuildError } = require('../classes');

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
	"create-opt-in-channel.js",
	"create-pingable-role.js",
	"data-policy.js",
	"list",
	"manage-mods",
	"petition-check-channel.js",
	"petition-check-role.js",
	"petition-veto.js",
	"petition",
	"post-reference.js",
	"press-kit.js",
	"proxy-thread",
	"roles-rundown.js",
	"roll.js",
	"server-rules.js",
	"set-pingable-role-emoji.js",
	"upload-emote.js",
	"version.js"
];
/** @type {Record<string, CommandWrapper>} */
const commandDictionary = {};
const slashData = [];

for (const file of commandFiles) {
	/** @type {CommandWrapper} */
	const command = require(`./${file}`);
	if (command.mainId in commandDictionary) {
		throw new BuildError(`Duplicate command custom id: ${command.mainId}`);
	}
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

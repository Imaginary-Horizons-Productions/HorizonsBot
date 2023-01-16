const modalSubmissionDictionary = {};

for (const file of [
	"changeclubinfo.js",
	"changeclubmeeting.js",
	"changeclubseats.js"
]) {
	const modalSubmission = require(`./${file}`);
	modalSubmissionDictionary[modalSubmission.name] = modalSubmission;
}

/**
 * @param {string} mainId
 * @param {import("discord.js").Interaction} interaction
 * @param {string[]} args
 */
exports.callModalSubmission = function (mainId, interaction, args) {
	modalSubmissionDictionary[mainId].execute(interaction, args);
}

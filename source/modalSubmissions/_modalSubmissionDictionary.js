const modalSubmissionDictionary = {};

for (const file of [
	"setclub.js"
]) {
	const modalSubmission = require(`./${file}`);
	modalSubmissionDictionary[modalSubmission.name] = modalSubmission;
}

exports.callModalSubmission = function (mainId, interaction, args) {
	modalSubmissionDictionary[mainId].execute(interaction, args);
}

const modalSubmissionDictionary = {};

for (const file of [
	"changeclubinfo.js",
	"changeclubmeeting.js",
	"changeclubseats.js"
]) {
	const modalSubmission = require(`./${file}`);
	modalSubmissionDictionary[modalSubmission.customId] = modalSubmission;
}

/**
 * @param {string} mainId
 */
exports.getModal = function (mainId) {
	return modalSubmissionDictionary[mainId];
}

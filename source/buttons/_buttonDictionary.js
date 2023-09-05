const buttonDictionary = {};

for (const file of [
	"changeclubinfo.js",
	"changeclubmeeting.js",
	"changeclubseats.js",
	"delete.js",
	"join.js",
	"startevent.js",
	"switchclubvoicetype.js"
]) {
	const button = require(`./${file}`);
	buttonDictionary[button.customId] = button;
}

/**
 * @param {string} mainId
 */
exports.getButton = function (mainId) {
	return buttonDictionary[mainId];
}

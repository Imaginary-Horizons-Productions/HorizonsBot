const { ButtonWrapper } = require("../classes");

/** @type {Record<string, ButtonWrapper>} */
const buttonDictionary = {};

for (const file of [
	"changeclubinfo.js",
	"changeclubmeeting.js",
	"changeclubseats.js",
	"clearclubmeeting.js",
	"delete.js",
	"join.js",
	"proxydisband.js",
	"proxyrename.js",
	"startevent.js",
	"switchclubvoicetype.js"
]) {
	/** @type {ButtonWrapper} */
	const button = require(`./${file}`);
	buttonDictionary[button.mainId] = button;
}

/** @param {string} mainId */
function getButton(mainId) {
	return buttonDictionary[mainId];
}

module.exports = {
	getButton
};

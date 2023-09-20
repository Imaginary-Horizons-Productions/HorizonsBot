const { SelectWrapper } = require("../classes");

/** @type {Record<string, SelectWrapper>} */
const selectDictionary = {};

for (const file of [
	"clubList.js",
	"joinclubs.js",
	"petitionList.js"
]) {
	/** @type {SelectWrapper} */
	const select = require(`./${file}`);
	selectDictionary[select.mainId] = select;
}

/** @param {string} mainId */
exports.getSelect = function (mainId) {
	return selectDictionary[mainId];
}

const selectDictionary = {};

for (const file of [
	"clubList.js",
	"joinclubs.js",
	"petitionList.js"
]) {
	const select = require(`./${file}`);
	selectDictionary[select.customId] = select;
}

/**
 * @param {string} mainId
 */
exports.getSelect = function (mainId) {
	return selectDictionary[mainId];
}

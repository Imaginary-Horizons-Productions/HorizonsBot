const selectDictionary = {};

for (const file of [
	"clubList.js",
	"petitionList.js",
	"topicList.js"
]) {
	const select = require(`./${file}`);
	selectDictionary[select.name] = select;
}

/**
 * @param {string} mainId
 * @param {import("discord.js").Interaction} interaction
 * @param {string[]} args
 */
exports.callSelect = function (mainId, interaction, args) {
	selectDictionary[mainId].execute(interaction, args);
}

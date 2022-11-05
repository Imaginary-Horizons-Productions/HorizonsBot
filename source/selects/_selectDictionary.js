const selectDictionary = {};

for (const file of [
]) {
	const select = require(`./${file}`);
	selectDictionary[select.name] = select;
}

exports.callSelect = function (mainId, interaction, args) {
	selectDictionary[mainId].execute(interaction, args);
}

const buttonDictionary = {};

for (const file of [
]) {
	const button = require(`./${file}`);
	buttonDictionary[button.name] = button;
}

exports.callButton = function (mainId, interaction, args) {
	buttonDictionary[mainId].execute(interaction, args);
}

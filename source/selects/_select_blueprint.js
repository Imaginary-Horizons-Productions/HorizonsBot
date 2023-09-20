const { SelectWrapper } = require('../classes');
const { SAFE_DELIMITER } = require('../constants');

const mainId = "";
module.exports = new SelectWrapper(mainId, 3000,
	/** Specs */
	(interaction, args) => {
		const customId = [mainId, ...args].join(SAFE_DELIMITER);

	}
);

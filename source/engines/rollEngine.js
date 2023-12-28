class Result {
	#result;

	constructor(result) {
		this.#result = result;
	}

	getResult() {
		return this.#result;
	}

	toString() {
		return `${this.#result}`;
	}
}

class RollResult extends Result {
	#dieSides;

	constructor(dieSides) {
		super(Math.floor(Math.random() * dieSides) + 1);
		this.#dieSides = dieSides;
	}

	getMaxValue() {
		return this.#dieSides;
	}

	toString(frac = false) {
		return frac ? `${this.getResult()}/${this.getMaxValue()}` : `${this.getResult()}`;
	}
}

class StringResult extends Result {
	#optList;

	constructor(result, optList) {
		super(result);
		this.#optList = optList;
	}

	getMaxValue() {
		return this.getResult();
	}

	toString(frac = false) {
		return frac ? `${this.getResult()} from the list ${this.#optList}` : this.getResult();
	}
}

const two_ops = { // Mathematical operations we currently support for rolls that use two arguments
	ADD: '+',
	SUBTRACT: '-',
	MULTIPLY: '*'
}

const keep_ops = { // Operations for keeping or dropping rolls of a result set
	KEEP: 'k',
	KEEP_HIGHEST: 'kh',
	DROP_LOWEST: 'dl',
	DROP: 'd',
	DROP_HIGHEST: 'dh',
	KEEP_LOWEST: 'kl'
}

class ResultSet {

	constructor() { }

	static #surroundedByParens(str, symbolPos) {
		var rightParensUnenclosed = 0,
			leftParensUnenclosed = 0;
		var leftSide = str.slice(0, symbolPos),
			rightSide = str.slice(symbolPos + 1, str.length - 1);
		for (var i = leftSide.length - 1; i >= 0; i -= 1) {
			if (leftSide[i] == ')' && leftParensUnenclosed <= 0) {
				leftParensUnenclosed -= 1;
			} else if (leftSide[i] == '(') {
				leftParensUnenclosed += 1;
			}
		}
		for (var i = 0; i < rightSide.length; i += 1) {
			if (rightSide[i] == '(' && rightParensUnenclosed <= 0) {
				rightParensUnenclosed -= 1;
			} else if (rightSide[i] == ')') {
				rightParensUnenclosed += 1;
			}
		}
		return rightParensUnenclosed > 0 && leftParensUnenclosed > 0;
	}

	static #parseStringList(str) {
		let strList = [];
		let newEntry = "";
		let startQuote = false;
		let endQuote = false;
		let spaceCount = 0;
		for (var i = 0; i < str.length; i++) {
			const bothQuotes = startQuote && endQuote;
			const isSkippableCharacter = (str[i] == '[' && i == 0) ||
				(!bothQuotes && str[i] == ']' && i == str.length - 1) ||
				(bothQuotes && str[i] == ' ');
			if (isSkippableCharacter) {
				continue;
			} else if (isSkippableCharacter && str[i] == ' ') {
				spaceCount++;
				continue;
			} else if (bothQuotes && str[i] == ']' && i == str.length - 1) {
				strList.push(newEntry.trim());
				newEntry = "";
				startQuote = false;
				endQuote = false;
				spaceCount = 0;
				continue;
			} else if (bothQuotes && str[i] === ',') {
				strList.push(newEntry.trim());
				newEntry = "";
				startQuote = false;
				endQuote = false;
				spaceCount = 0;
				continue;
			} else if (bothQuotes) {
				newEntry = `"${newEntry}"${' '.repeat(spaceCount)}${str[i]}`;
				startQuote = false;
				endQuote = false;
				spaceCount = 0;
				continue;
			} else if (startQuote && !endQuote && str[i] == "\"") {
				endQuote = true;
				continue;
			} else if (!startQuote && !endQuote && str[i] == "\"") {
				startQuote = true;
				continue;
			} else if (!startQuote && str[i] == ",") {
				strList.push(newEntry.trim());
				startQuote = false;
				endQuote = false;
				spaceCount = 0;
				newEntry = "";
				continue;
			}
			newEntry = newEntry + str[i];
		}
		if (startQuote && !endQuote) {
			throw `Mismatched quotation marks in list:\n${str}`;
		}
		let lastEntry = newEntry.trim();
		if (lastEntry) {
			strList.push(lastEntry);
		}
		return strList;
	}

	static parse(value) { // Calls the right ResultSet constructor for the given string
		var parsingString = value.slice(0); // Copy the string
		parsingString = parsingString.replace(/(?<!\[[^\]]*)\s(?![^\[]*\])/g, ''); //Remove all white space
		parsingString = parsingString.replace(/\+\s*\-/g, '-'); //Simplify adding a negative to subtraction
		while (parsingString[0] == '(' && parsingString[parsingString.length - 1] == ')') { // If parentheses wrap the expression, remove them
			parsingString = parsingString.slice(1, value.length - 1);
		}
		// Handle base cases
		if (/^1?d(\%|\d+)$/.test(parsingString)) { //parse single die roll //(\%|\d+) -> d%, 1d5, d75
			return new SingleResultSet(parsingString);
		} else if (/^\d+d(\%|\d+)[dk][lh]?\d+$/.test(parsingString)) { //parse multiple die with selection // 1d20dl, 2d4kh2
			var dPos = parsingString.search('d');
			var selPos = parsingString.search(/[dk][lh]?\d+$/);
			var endNumPos = parsingString.search(/\d+$/);
			return new DieSelectResultSet(parsingString.slice(0, dPos), parsingString.slice(dPos - parsingString.length, selPos), parsingString.slice(selPos - parsingString.length, endNumPos), parsingString.slice(endNumPos, parsingString.length))
		} else if (/^\d+d(\%|\d+)$/.test(parsingString)) { //parse multiple die roll // 1d20 + 1d6
			var dPos = parsingString.search('d');
			return new MultiDieResultSet(parsingString.slice(0, dPos), parsingString.slice(dPos - parsingString.length));
		} else if (/^-?\d+$/.test(parsingString)) { //parse number result // 20, -3
			return new SingleResultSet(parsingString, false);
		} else if (/^1?u?l\[.*\]/.test(parsingString)) { //parse single list roll // 1l["a", "b", "c"], 1ul[a, b, c, d]
			var bracketList = parsingString.replace(/^1?u?l/, '');
			return new ListResultSet(1, this.#parseStringList(bracketList));
		} else if (/^\d+l\[.*\]/.test(parsingString)) { // parse multiple list pick // 2l["a", "b", "c"]
			var bracketList = parsingString.replace(/^\d+l/, '');
			var num = parsingString.replace(/l\[.*\]/, '');
			return new ListResultSet(num, this.#parseStringList(bracketList));
		} else if (/^\d+ul\[.*\]/.test(parsingString)) { // parse multiple list pick with unique selections // 2ul[a, b, c, d]
			var bracketList = parsingString.replace(/^\d+ul/, '');
			var num = parsingString.replace(/ul\[.*\]/, '');
			var forceUnique = !(num === '' || Number.parseInt(num) === 1);
			return new ListResultSet(num, this.#parseStringList(bracketList), forceUnique);
		}
		/*
		 * Find the appropriate symbol, right to left
		 * If the symbol is not surrounded by parens, turn into a TwoOpResultSet
		 * Otherwise, continue try again
		 * If the conditions are not met, try the next symbol set
		 */
		//Handle addition/subtraction
		var addSubPattern = /[\+\-]/;
		var multPattern = /\*/;
		var hasListPattern = /\d*u?l\[.*\]/;
		if (!multPattern.test(parsingString) && !hasListPattern.test(parsingString) && addSubPattern.test(parsingString)) {
			var toPureSums = parsingString.replace(/\-/g, '+-');
			var parsableList = toPureSums.split('+');
			return new SumSeriesResultSet(parsableList);
		}
		if (addSubPattern.test(parsingString)) {
			for (var i = parsingString.length - 1; i >= 0; i -= 1) {
				if (addSubPattern.test(parsingString[i]) && !this.#surroundedByParens(parsingString, i)) {
					return new TwoOpResultSet(parsingString.slice(0, i), parsingString.slice(i + 1, parsingString.length), parsingString[i]);
				}
			}
		}
		if (multPattern.test(parsingString)) {
			for (var i = parsingString.length - 1; i >= 0; i -= 1) {
				if (multPattern.test(parsingString[i]) && !this.#surroundedByParens(parsingString, i)) {
					return new TwoOpResultSet(parsingString.slice(0, i), parsingString.slice(i + 1, parsingString.length), parsingString[i]);
				}
			}
		}
		//string does not match any expected combination - throw error
		throw `Part of the input to parse into a roll is malformed: ${parsingString}`;
	}

	getResults() { throw new Error(`ResultSet function 'getResults' not properly implemented by child class ${this.constructor.name}.`); } // Implemented by child classes

	getMaxResults() { throw new Error(`ResultSet function 'getMaxResults' not properly implemented by child class ${this.constructor.name}.`); } // Implemented by child classes

	getMinResults() { throw new Error(`ResultSet function 'getMinResults' not properly implemented by child class ${this.constructor.name}.`); } // Implemented by child classes

	toString(frac = false) { throw new Error(`ResultSet function 'toString' not properly implemented by child class ${this.constructor.name}.`); } // Implemented by child classes

	toResultArray() { throw new Error(`ResultSet function 'toResultArray' not properly implemented by child class ${this.constructor.name}.`); } // Implemented by child classes
}

class SingleResultSet extends ResultSet {
	#result

	constructor(value, isRoll = true) {
		super();
		if (isRoll) {
			var valueArr = value.split('d');
			var poppedVal = valueArr.pop();
			poppedVal = poppedVal == '%' ? '100' : poppedVal;
			this.#result = new RollResult(parseInt(poppedVal));
		} else {
			this.#result = new Result(parseInt(value));
		}
	}

	getResults() { return this.#result.getResult(); }

	getMaxResults() { return this.#result.getMaxValue ? this.#result.getMaxValue() : this.#result.getResult(); }

	getMinResults() { return this.#result.getMaxValue ? 1 : this.#result.getResult(); }

	toString(frac = false) {
		return this.#result.toString(frac);
	}

	toResultArray() { return [this.#result.getResult()]; }
}

class ListResultSet extends ResultSet {
	#result
	#choices
	#stringList
	#forceUnique

	constructor(choices, list, forceUnique = false) {
		super();
		this.#result = []; // The options we have chosen
		this.#choices = choices;
		this.#forceUnique = forceUnique;
		this.#stringList = list;
		var tempUsedList = list.slice();
		for (var i = 0; i < choices; i++) {
			var randomSelection = tempUsedList[Math.floor(Math.random() * tempUsedList.length)];
			this.#result.push(new StringResult(randomSelection, tempUsedList));
			if (forceUnique) {
				tempUsedList = tempUsedList.filter(str => str != randomSelection);
			}
		}
	}

	getResults() { return this.#result.map(r => r.getResult()).join(', '); }

	getMaxResults() { return `${this.#choices}${this.#forceUnique ? ' unique choices' : ''} from the list ${this.#stringList.join(', ')}` }

	getMinResults() { return `${this.#choices}${this.#forceUnique ? ' unique choices' : ''} from the list ${this.#stringList.join(', ')}` }

	toString(frac = false) { return this.#result.map(r => r.toString(frac)).join(', '); }

	toResultArray() { return this.#result.flatMap(r => r.getResult()); }
}

class TwoOpResultSet extends ResultSet {
	#left
	#right
	#op

	constructor(left, right, op) {
		super();
		this.#left = ResultSet.parse(left);
		this.#right = ResultSet.parse(right);
		this.#op = op;
	}

	getResults() {
		switch (this.#op) {
			case two_ops.ADD:
				if (this.hasStringInTree()) {
					return [this.#left.getResults(), this.#right.getResults()].join(' ');
				}
				return this.#left.getResults() + this.#right.getResults();
			case two_ops.SUBTRACT:
				if (this.#left instanceof ListResultSet || this.#right instanceof ListResultSet) {
					throw 'It is not possible to use subtraction on list rolls. Make sure you are not using subtraction on a list and your parentheses are correct.';
				}
				return this.#left.getResults() - this.#right.getResults();
			case two_ops.MULTIPLY:
				if (this.hasStringInLeft()) {
					throw 'Cannot multiply two strings. Multiplication with a number and a string must have the number on the left side of the string to repeat the string.';
				}
				if (this.hasStringInRight()) {
					let resultArray = new Array(this.#left.getResults()).fill(this.#right.getResults())
					return resultArray.join(' ');
				}
				return this.#left.getResults() * this.#right.getResults();
		}
	}

	getMaxResults() {
		switch (this.#op) {
			case two_ops.ADD:
				var leftPart = this.hasStringInLeft() ? `${this.#left.getMaxResults()} ` : this.#left.getMaxResults();
				var rightPart = this.hasStringInRight() ? ` ${this.#right.getMaxResults()}` : this.#right.getMaxResults();
				return leftPart + rightPart;
			case two_ops.SUBTRACT:
				if (this.#left instanceof ListResultSet || this.#right instanceof ListResultSet) {
					throw 'It is not possible to use subtraction on list rolls. Make sure you are not using subtraction on a list and your parentheses are correct.';
				}
				return this.#left.getMaxResults() - this.#right.getMinResults();
			case two_ops.MULTIPLY:
				if (this.hasStringInLeft()) {
					throw 'Cannot multiply two strings. Multiplication with a number and a string must have the number on the left side of the string to repeat the string.';
				}
				if (this.hasStringInRight()) {
					return `${this.#right.getMaxResults()} `.repeat(this.#left.getMaxResults());
				}
				return this.#left.getMaxResults() * this.#right.getMaxResults();
		}
	}

	getMinResults() {
		switch (this.#op) {
			case two_ops.ADD:
				var leftPart = this.hasStringInLeft() ? `${this.#left.getMinResults()} ` : this.#left.getMinResults();
				var rightPart = this.hasStringInRight() ? ` ${this.#right.getMinResults()}` : this.#right.getMinResults();
				return leftPart + rightPart;
			case two_ops.SUBTRACT:
				if (this.#left instanceof ListResultSet || this.#right instanceof ListResultSet) {
					throw 'It is not possible to use subtraction on list rolls. Make sure you are not using subtraction on a list and your parentheses are correct.';
				}
				return this.#left.getMinResults() - this.#right.getMaxResults();
			case two_ops.MULTIPLY:
				if (this.hasStringInLeft()) {
					throw 'Cannot multiply two strings. Multiplication with a number and a string must have the number on the left side of the string to repeat the string.';
				}
				if (this.hasStringInRight()) {
					return `${this.#right.getMinResults()} `.repeat(this.#left.getMinResults());
				}
				return this.#left.getMinResults() * this.#right.getMinResults();
		}
	}

	toString(frac = false) {
		if (this.#op == two_ops.SUBTRACT && (this.#left instanceof ListResultSet || this.#right instanceof ListResultSet)) {
			throw 'It is not possible to use subtraction on list rolls. Make sure you are not using subtraction on a list and your parentheses are correct.';
		}
		var leftString = this.#left.toString(frac);
		var rightString = this.#right.toString(frac)
		return `(${leftString} ${this.#op} ${rightString})`;
	}

	hasStringInLeft() {
		if (this.#left instanceof ListResultSet) {
			return true;
		} else if (this.#left instanceof TwoOpResultSet) {
			return this.#right.hasStringInTree();
		} else {
			return false;
		}
	}

	hasStringInRight() {
		if (this.#right instanceof ListResultSet) {
			return true;
		} else if (this.#right instanceof TwoOpResultSet) {
			return this.#right.hasStringInTree();
		} else {
			return false;
		}
	}

	hasStringInTree() {
		return this.hasStringInLeft() || this.hasStringInRight();
	}

	toResultArray() {
		return [this.#left.toResultArray(), this.#right.toResultArray()].flat();
	}
}

class MultiDieResultSet extends ResultSet {
	#dieList = []
	#dieSides

	constructor(numDice, dieSides) {
		super();
		let convertedDieSides = dieSides.replace('d', '');
		convertedDieSides = convertedDieSides == '%' ? '100' : convertedDieSides;
		this.#dieSides = parseInt(convertedDieSides);
		for (var i = 0; i < parseInt(numDice); i += 1) {
			this.#dieList.push(new RollResult(this.#dieSides));
		}

	}

	getResults() { return this.#dieList.reduce((acc, roll) => acc + roll.getResult(), 0); }

	getMaxResults() { return this.#dieList.length * this.#dieSides; }

	getMinResults() { return this.#dieList.length; }

	toString(frac = false) {
		return `(${this.#dieList.map(roll => roll.toString(frac)).join(' + ')})`;
	}

	toResultArray() {
		return this.#dieList.flatMap(r => r.getResult());
	}
}

class SumSeriesResultSet extends ResultSet {
	#resultList = []
	#opList = []

	constructor(listToSum) {
		super();
		for (var i = 0; i < listToSum.length; i += 1) {
			if (listToSum[i][0] == '-') {
				this.#opList.push(two_ops.SUBTRACT);
				listToSum[i] = listToSum[i].slice(1);
			} else {
				this.#opList.push(two_ops.ADD);
			}
		}
		this.#resultList = listToSum.map(str => ResultSet.parse(str));
	}

	getResults() {
		var sum = 0;
		for (var i = 0; i < this.#resultList.length; i += 1) {
			if (this.#opList[i] == two_ops.ADD) {
				sum += this.#resultList[i].getResults();
			} else {
				sum -= this.#resultList[i].getResults();
			}
		}
		return sum;
	}

	getMaxResults() {
		var max = 0;
		for (var i = 0; i < this.#resultList.length; i += 1) {
			if (this.#opList[i] = two_ops.ADD) {
				max += this.#resultList[i].getMaxResults();
			} else {
				max -= this.#resultList[i].getMinResults();
			}
		}
		return max;
	}

	getMinResults() {
		var min = 0;
		for (var i = 0; i < this.#resultList.length; i += 1) {
			if (this.#opList[i] = two_ops.ADD) {
				min += this.#resultList[i].getMinResults();
			} else {
				min -= this.#resultList[i].getMaxResults();
			}
		}
		return min;
	}

	toString(frac = false) {
		var output = `${this.#opList[0] == two_ops.SUBTRACT ? '-' : ''}`;
		var i = 0;
		while (i < this.#resultList.length) {
			output += this.#resultList[i].toString(frac);
			i += 1;
			if (i < this.#resultList.length) {
				output += ` ${this.#opList[i]} `;
			}
		}
		return `(${output})`;
	}

	toResultArray() {
		return this.#resultList.flatMap(r => r.toResultArray());
	}
}

class DieSelectResultSet extends ResultSet {
	#dieList = []
	#dieSides
	#selectOp
	#selectNum

	constructor(numDice, dieSides, selectOp, selectNum) {
		super();
		let convertedDieSides = dieSides.replace('d', '');
		convertedDieSides = convertedDieSides == '%' ? '100' : convertedDieSides;
		this.#dieSides = parseInt(convertedDieSides);
		this.#selectNum = selectNum ? parseInt(selectNum) : 1;
		this.#selectOp = selectOp;
		var numDice = parseInt(numDice);
		if (numDice - this.#selectNum <= 0) {
			switch (this.#selectOp) {
				case keep_ops.KEEP:
				case keep_ops.KEEP_HIGHEST:
				case keep_ops.KEEP_LOWEST:
					this.#selectNum = numDice;
					for (var i = 0; i < numDice; i += 1) {
						this.#dieList.push(new RollResult(this.#dieSides));
					}
					break;
				case keep_ops.DROP:
				case keep_ops.DROP_LOWEST:
				case keep_ops.DROP_HIGHEST:
					this.#dieList = [];
					this.#selectNum = 0;
					break;
			}
		} else {
			for (var i = 0; i < parseInt(numDice); i += 1) {
				this.#dieList.push(new RollResult(this.#dieSides));
			}
		}
	}

	getResults() {
		if (this.#dieList.length == 0) {
			return 0;
		}
		var kept = [],
			resultDice = this.#dieList.slice().sort((r1, r2) => r1.getResult() - r2.getResult());
		switch (this.#selectOp) {
			case keep_ops.KEEP:
			case keep_ops.KEEP_HIGHEST:
				kept = resultDice.slice(-this.#selectNum);
				break;
			case keep_ops.KEEP_LOWEST:
				kept = resultDice.slice(0, this.#selectNum);
				break;
			case keep_ops.DROP:
			case keep_ops.DROP_LOWEST:
				kept = resultDice.slice(this.#selectNum);
				break;
			case keep_ops.DROP_HIGHEST:
				kept = resultDice.slice(0, -this.#selectNum);
				break;
		}
		return kept.reduce((acc, roll) => acc + roll.getResult(), 0);
	}

	getMaxResults() {
		if (this.#dieList.length == 0) {
			return 0;
		}
		var trueDieLength = this.#dieList.length;
		switch (this.#selectOp) {
			case keep_ops.KEEP:
			case keep_ops.KEEP_HIGHEST:
			case keep_ops.KEEP_LOWEST:
				trueDieLength = this.#selectNum;
				break;
			case keep_ops.DROP:
			case keep_ops.DROP_LOWEST:
			case keep_ops.DROP_HIGHEST:
				trueDieLength -= this.#selectNum;
				break;
		}
		return trueDieLength * this.#dieSides;
	}

	getMinResults() {
		if (this.#dieList.length == 0) {
			return 0;
		}
		var trueDieLength = this.#dieList.length;
		switch (this.#selectOp) {
			case keep_ops.KEEP:
			case keep_ops.KEEP_HIGHEST:
			case keep_ops.KEEP_LOWEST:
				trueDieLength = this.#selectNum;
				break;
			case keep_ops.DROP:
			case keep_ops.DROP_LOWEST:
			case keep_ops.DROP_HIGHEST:
				trueDieLength -= this.#selectNum;
				break;
		}
		return trueDieLength;
	}

	toString(frac = false) {
		if (this.#dieList.length == 0) {
			return frac ? `0/0` : `0`;
		}
		var isKeep = this.#selectOp.startsWith('k'),
			dieMap = this.#dieList.map(result => { return { roll: result, keep: !isKeep } });
		var skipIndices = [], repeats = this.#selectNum;
		switch (this.#selectOp) {
			case keep_ops.KEEP:
			case keep_ops.KEEP_HIGHEST:
				while (repeats > 0) {
					var highIndex = -1;
					var highValue = -1;
					for (var i = 0; i < dieMap.length; i++) {
						if (!skipIndices.includes(i) && dieMap[i].roll.getResult() > highValue) {
							highValue = dieMap[i].roll.getResult();
							highIndex = i;
						}
					}
					dieMap[highIndex].keep = true;
					skipIndices.push(highIndex);
					repeats--;
				}
				break;
			case keep_ops.KEEP_LOWEST:
				while (repeats > 0) {
					var lowIndex = -1;
					var lowValue = Number.POSITIVE_INFINITY;
					for (var i = 0; i < dieMap.length; i++) {
						if (!skipIndices.includes(i) && dieMap[i].roll.getResult() < lowValue) {
							lowValue = dieMap[i].roll.getResult();
							lowIndex = i;
						}
					}
					dieMap[lowIndex].keep = true;
					skipIndices.push(lowIndex);
					repeats--;
				}
				break;
			case keep_ops.DROP:
			case keep_ops.DROP_LOWEST:
				while (repeats > 0) {
					var lowIndex = -1;
					var lowValue = Number.POSITIVE_INFINITY;
					for (var i = 0; i < dieMap.length; i++) {
						if (!skipIndices.includes(i) && dieMap[i].roll.getResult() < lowValue) {
							lowValue = dieMap[i].roll.getResult();
							lowIndex = i;
						}
					}
					dieMap[lowIndex].keep = false;
					skipIndices.push(lowIndex);
					repeats--;
				}
				break;
			case keep_ops.DROP_HIGHEST:
				while (repeats > 0) {
					var highIndex = -1;
					var highValue = -1;
					for (var i = 0; i < dieMap.length; i++) {
						if (!skipIndices.includes(i) && dieMap[i].roll.getResult() > highValue) {
							highValue = dieMap[i].roll.getResult();
							highIndex = i;
						}
					}
					dieMap[highIndex].keep = false;
					skipIndices.push(highIndex);
					repeats--;
				}
				break;
		}
		return `(${dieMap.map(dieInfo => dieInfo.keep ? dieInfo.roll.toString(frac) : `~~${dieInfo.roll.toString(frac)} dropped~~${frac ? '0/0' : '0'}`).join(' + ')})`;
	}

	toResultArray() {
		return this.#dieList.flatMap(r => r.getResult());
	}
}

class ResultBundle {
	#resultset
	#extraText

	constructor(rs, et = "") {
		this.#resultset = rs instanceof ResultSet ? rs : ResultSet.parse(rs);
		this.#extraText = et;
	}

	getResultSet() {
		return this.#resultset;
	}

	getExtraText() {
		return this.#extraText;
	}

	toString(frac = false, simple = false) {
		if (simple && frac) {
			return `${this.#resultset.getResults()}/${this.#resultset.getMaxResults()}${this.#extraText ? ` ${this.#extraText}` : ''}`;
		} else if (simple && !frac) {
			return `${this.#resultset.getResults()}${this.#extraText ? ` ${this.#extraText}` : ''}`;
		} else if (!simple && frac) {
			return `${this.#resultset.toString(frac)} = ${this.#resultset.getResults()}/${this.#resultset.getMaxResults()}${this.#extraText ? ` ${this.#extraText}` : ''}`;
		} else {
			return `${this.#resultset.toString(frac)} = ${this.#resultset.getResults()}${this.#extraText ? ` ${this.#extraText}` : ''}`;
		}
	}

	toResultArray() {
		return this.#resultset.toResultArray();
	}
}

function parseRoll(input) { //This needs some wild revision before it'll work
	input = input.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').replace(/\+/g, ' + ').replace(/\*/g, ' * ').replace(/\-(^\d)/g, ' - ');
	var splitInput = input.split(/(?<!\[[^\]]*) (?![^\[]*\])/);
	var rollArray = splitInput.reduce((acc, cur) => {
		if (acc[acc.length - 1] == '║' || cur == '') {
			return acc;
		} else if (/[\+\-\*]/.test(cur) || /\-?\d+$/.test(cur) || /\d*d(\%|\d+)([dk][lh]?\d+)?$/.test(cur) || /\d*u?l\[.*\]$/.test(cur) || /\(/.test(cur) || /\)/.test(cur)) {
			acc.push(cur);
			return acc;
		} else { //stop on the first non-roll
			acc.push('║');
			return acc;
		}
	}, []);
	rollArray[rollArray.length - 1] == '║' ? rollArray.pop() : () => { };
	var textArray = splitInput.reduceRight((acc, cur) => {
		if (acc[0] == '║' || cur == '') {
			return acc;
		} else if (/\-?\d+$/.test(cur) || /\d*d(\%|\d+)([dk][lh]?\d+)?$/.test(cur) || /\d*u?l\[.*\]$/.test(cur) || /\)/.test(cur)) {
			acc.unshift('║');
			return acc;
		} else {
			acc.unshift(cur);
			return acc;
		}
	}, []);
	textArray[0] == '║' ? textArray.shift() : () => { };
	return new ResultBundle(rollArray.join(''), textArray.join(' '));
}

function getRollString(input, frac = false, simple = false) {
	return parseRoll(input).toString(frac, simple);
}

function getRollArray(input) {
	return parseRoll(input).toResultArray();
}

module.exports = { parseRoll, getRollString, getRollArray }

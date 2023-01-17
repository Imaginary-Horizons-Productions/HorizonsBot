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

	constructor() {}

	static #surroundedByParens(str, symbolPos) {
		var rightParensUnenclosed = 0,
			leftParensUnenclosed = 0;
		var leftSide = str.slice(0,symbolPos),
			rightSide = str.slice(symbolPos+1,str.length-1);
		for (var i = leftSide.length - 1; i >= 0 ; i-=1) {
			if (leftSide[i] == ')' && leftParensUnenclosed <= 0) {
				leftParensUnenclosed -= 1;
			} else if (leftSide[i] == '(') {
				leftParensUnenclosed += 1;
			}
		}
		for (var i = 0; i < rightSide.length; i+=1) {
			if (rightSide[i] == '(' && rightParensUnenclosed <= 0) {
				rightParensUnenclosed -= 1;
			} else if (rightSide[i] == ')') {
				rightParensUnenclosed += 1;
			}
		}
		return rightParensUnenclosed > 0 && leftParensUnenclosed > 0;
	}

	static parse(value) { // Calls the right ResultSet constructor for the given string
		var parsingString = value.slice(0); // Copy the string
		parsingString = parsingString.replace(/\s/g,''); //Remove all white space
		parsingString = parsingString.replace(/\+\s*\-/g,'-'); //Simplify adding a negative to subtraction
		while (parsingString[0] == '(' && parsingString[parsingString.length-1] == ')') { // If parentheses wrap the expression, remove them
			parsingString = parsingString.slice(1, value.length-1);
		}
		// Handle base cases
		if (/^1?d[0-9]+$/.test(parsingString)) { //parse single die roll
			return new SingleResultSet(parsingString);
		} else if (/^[0-9]+d[0-9]+[dk][lh]?[0-9]+$/.test(parsingString)) { //parse multiple die with selection
			var dPos = parsingString.search('d');
			var selPos = parsingString.search(/[dk][lh]?[0-9]+$/);
			var endNumPos = parsingString.search(/[0-9]+$/);
			return new DieSelectResultSet(parsingString.slice(0,dPos),parsingString.slice(dPos - parsingString.length, selPos), parsingString.slice(selPos - parsingString.length, endNumPos), parsingString.slice(endNumPos,parsingString.length))
		} else if (/^[0-9]+d[0-9]+$/.test(parsingString)) { //parse multiple die roll
			var dPos = parsingString.search('d');
			return new MultiDieResultSet(parsingString.slice(0,dPos),parsingString.slice(dPos - parsingString.length));
		} else if (/^-?[0-9]+$/.test(parsingString)) { //parse number result
			return new SingleResultSet(parsingString,false);
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
		if(!multPattern.test(parsingString) && addSubPattern.test(parsingString)) {
			var toPureSums = parsingString.replace(/\-/g,'+-');
			var parsableList = toPureSums.split('+');
			return new SumSeriesResultSet(parsableList);
		}
		if (addSubPattern.test(parsingString)) {
			for (var i = parsingString.length - 1; i >= 0; i-=1) {
				if (addSubPattern.test(parsingString[i]) && !this.#surroundedByParens(parsingString,i)) {
					return new TwoOpResultSet(parsingString.slice(0,i),parsingString.slice(i+1,parsingString.length),parsingString[i]);
				}
			}
		}
		if (multPattern.test(parsingString)) {
			for (var i = parsingString.length - 1; i >= 0; i-=1) {
				if (multPattern.test(parsingString[i]) && !this.#surroundedByParens(parsingString,i)) {
					return new TwoOpResultSet(parsingString.slice(0,i),parsingString.slice(i+1,parsingString.length),parsingString[i]);
				}
			}
		}
		//string does not match any expected combination - throw error
		throw `Part of the input to parse into a roll is malformed: ${parsingString}`;
	}

	getResults() { throw `ResultSet function 'getResults' not properly thrown by child class ${typeof this}.`; } // Implemented by child classes

	getMaxResults() { throw `ResultSet function 'getMaxResults' not properly thrown by child class ${typeof this}.`; } // Implemented by child classes

	getMinResults() { throw `ResultSet function 'getMinResults' not properly thrown by child class ${typeof this}.`; } // Implemented by child classes

	toString(frac = false) { throw `ResultSet function 'toString' not properly thrown by child class ${typeof this}.`; } // Implemented by child classes
}

class SingleResultSet extends ResultSet {
	#result

	constructor(value, isRoll = true) {
		super();
		if (isRoll) {
			var valueArr = value.split('d');
			this.#result = new RollResult(parseInt(valueArr.pop()));
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
				return this.#left.getResults() + this.#right.getResults();
			case two_ops.SUBTRACT:
				return this.#left.getResults() - this.#right.getResults();
			case two_ops.MULTIPLY:
				return this.#left.getResults() * this.#right.getResults();
		}
	}

	getMaxResults() {
		switch (this.#op) {
			case two_ops.ADD:
				return this.#left.getMaxResults() + this.#right.getMaxResults();
			case two_ops.SUBTRACT:
				return this.#left.getMaxResults() - this.#right.getMinResults();
			case two_ops.MULTIPLY:
				return this.#left.getMaxResults() * this.#right.getMaxResults();
		}
	}

	getMinResults() {
		switch (this.#op) {
			case two_ops.ADD:
				return this.#left.getMinResults() + this.#right.getMinResults();
			case two_ops.SUBTRACT:
				return this.#left.getMinResults() - this.#right.getMaxResults();
			case two_ops.MULTIPLY:
				return this.#left.getMinResults() * this.#right.getMinResults();
		}
	}

	toString(frac = false) {
		return `(${this.#left.toString(frac)} ${this.#op} ${this.#right.toString(frac)})`;
	}
}

class MultiDieResultSet extends ResultSet {
	#dieList = []
	#dieSides

	constructor(numDice,dieSides) {
		super();
		this.#dieSides = parseInt(dieSides.replace('d',''));
		for(var i = 0; i < parseInt(numDice); i+=1) {
			this.#dieList.push(new RollResult(this.#dieSides));
		}

	}

	getResults() { return this.#dieList.reduce((acc, roll) => acc + roll.getResult(),0); }

	getMaxResults() { return this.#dieList.length * this.#dieSides; }

	getMinResults() { return this.#dieList.length; }

	toString(frac = false) {
		return `(${this.#dieList.map(roll => roll.toString(frac)).join(' + ')})`;
	}
}

class SumSeriesResultSet extends ResultSet {
	#resultList = []
	#opList = []

	constructor(listToSum) {
		super();
		for (var i = 0; i < listToSum.length; i+=1) {
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
		for (var i = 0; i < this.#resultList.length; i+=1) {
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
		for (var i = 0; i < this.#resultList.length; i+=1) {
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
		for (var i = 0; i < this.#resultList.length; i+=1) {
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
}

class DieSelectResultSet extends ResultSet {
	#dieList = []
	#dieSides
	#selectOp
	#selectNum

	constructor(numDice,dieSides,selectOp,selectNum) {
		super();
		this.#dieSides = parseInt(dieSides.replace('d',''));
		this.#selectNum = selectNum ? parseInt(selectNum) : 1;
		this.#selectOp = selectOp;
		var numDice = parseInt(numDice);
		if (numDice - this.#selectNum <= 0) {
			switch (this.#selectOp) {
				case keep_ops.KEEP:
				case keep_ops.KEEP_HIGHEST:
				case keep_ops.KEEP_LOWEST:
					this.#selectNum = numDice;
					for(var i = 0; i < numDice; i+=1) {
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
			for(var i = 0; i < parseInt(numDice); i+=1) {
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
				kept = resultDice.slice(0,this.#selectNum);
				break;
			case keep_ops.DROP:
			case keep_ops.DROP_LOWEST:
				kept = resultDice.slice(this.#selectNum);
				break;
			case keep_ops.DROP_HIGHEST:
				kept = resultDice.slice(0,-this.#selectNum);
				break;
		}
		return kept.reduce((acc, roll) => acc + roll.getResult(),0);
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

	toString(frac = false) { // TODO
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
}

class ResultBundle {
	#resultset
	#extraText

	constructor(rs, et = ""){
		var resultSet;
		if (rs instanceof ResultSet) { // If it is a result set, just use it as-is
			resultSet = rs;
		} else { // Parse the string into a roll set
			resultSet = ResultSet.parse(rs);
		}
		this.#resultset = resultSet;
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
}

function parseRoll(input) { //This needs some wild revision before it'll work
	input = input.replace(/\(/g,' ( ').replace(/\)/g,' ) ')
	var splitInput = input.split(' ');
	var rollArray = splitInput.reduce((acc, cur) => {
		if (acc[acc.length-1] == '║' || cur == '') {
			return acc;
		} else if (/[\+\-\*]/.test(cur) || /([0-9]+|[0-9]+d[0-9]+([dk][lh]?[0-9]+)?)([\+\-\*]([0-9]+|[0-9]+d[0-9]+([dk][lh]?[0-9]+)?))*$/.test(cur) || /\(/.test(cur) || /\)/.test(cur)) {
			acc.push(cur);
			return acc;
		} else { //stop on the first non-roll
			acc.push('║');
			return acc;
		}
	}, []);
	rollArray[rollArray.length-1] == '║' ? rollArray.pop() : ()=>{};
	var textArray = splitInput.reduceRight((acc, cur) => {
		if (acc[0] == '║' || cur == '') {
			return acc;
		} else if (/([0-9]+|[0-9]+d[0-9]+([dk][lh]?[0-9]+)?)([\+\-\*]([0-9]+|[0-9]+d[0-9]+([dk][lh]?[0-9]+)?))*$/.test(cur) || /[0-9]+$/.test(cur) || /\)/.test(cur)) {
			acc.unshift('║');
			return acc;
		} else {
			acc.unshift(cur);
			return acc;
		}
	}, []);
	textArray[0] == '║' ? textArray.shift() : ()=>{};
	return new ResultBundle(rollArray.join(''),textArray.join(' '));
}

function getRollString(input, frac = false, simple = false) {
	return parseRoll(input).toString(frac, simple);
}

module.exports = {parseRoll, getRollString}

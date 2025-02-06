class Result {
	#result;

	/**
	 * Constructs the representation of the result of a random roll or calculation
	 * in its simplest form.
	 * @param {number} result 
	 */
	constructor(result) {
		this.#result = result;
	}

	/**
	 * Returns the value of the result
	 * @returns {number}
	 */
	getResult() {
		return this.#result;
	}

	/**
	 * Returns the result as a string
	 * @returns {string}
	 */
	toString() {
		return `${this.#result}`;
	}
}

class RollResult extends Result {
	#dieSides;

	/**
	 * Constructs a representation of a randomized roll, including information
	 *  about the die used.
	 * @param {number} dieSides 
	 */
	constructor(dieSides) {
		super(Math.floor(Math.random() * dieSides) + 1);
		this.#dieSides = dieSides;
	}

	/**
	 * Gives the maximum possible result of the roll, independent of the real result.
	 * @returns 
	 */
	getMaxValue() {
		return this.#dieSides;
	}

	/**
	 * Returns the result as a string, including a fractional representation option
	 * @param {boolean} frac 
	 * @returns 
	 */
	toString(frac = false) {
		return frac ? `${this.getResult()}/${this.getMaxValue()}` : `${this.getResult()}`;
	}
}

class StringResult extends Result {
	#optList;

	/**
	 * Constructs a representation of a randomized roll on a string table,
	 *  including 
	 * @param {string} result 
	 * @param {Array<string>} optList 
	 */
	constructor(result, optList) {
		super(result);
		this.#optList = optList;
	}

	/**
	 * String tables do not have a "maximum," so the result is returned for the maximum.
	 * @returns 
	 */
	getMaxValue() {
		return this.getResult();
	}

	/**
	 * Returns the result as a string. If the more detailed result is requested, provide
	 * the string list used as well.
	 * @param {boolean} frac 
	 * @returns 
	 */
	toString(frac = false) {
		return frac ? `${this.getResult()} from the list ${this.#optList}` : this.getResult();
	}
}

/**
 * Mathematical operations we currently support for rolls that use two arguments
 */
const two_ops = {
	ADD: '+',
	SUBTRACT: '-',
	MULTIPLY: '*'
}

/**
 * Representations of operations for keeping or dropping rolls of a result set
 */
const keep_ops = {
	KEEP: 'k',
	KEEP_HIGHEST: 'kh',
	DROP_LOWEST: 'dl',
	DROP: 'd',
	DROP_HIGHEST: 'dh',
	KEEP_LOWEST: 'kl'
}

/**
 * Represents a set of rolls and how they are processed together.
 * This is the parent class of the child classes that represent those
 * processes. Also contains static functions to parse a string that
 * has rolls into the ResultSet representation of that string, in addition
 * to any functionality required to do this parsing. Functions expected
 * to be implemented by child classes are implemented here, but throw
 * errors.
 */
class ResultSet {

	/**
	 * Creates an empty ResultSet. Invalid and requires calling a child class to construct.
	 */
	constructor() { if (this.constructor.name === "ResultSet") throw new Error(`ResultSet cannot be constructed directly, or child class ${this.constructor.name} did not properly implement a constructor.`); }

	/**
	 * Checks to see if a string is surrounded by a parentheses set. Confirms that
	 * the parentheses are matching.
	 * @param {string} str 
	 * @param {number} symbolPos 
	 * @returns {boolean}
	 */
	static #surroundedByParens(str, symbolPos) {
		let rightParensUnenclosed = 0,
			leftParensUnenclosed = 0;
		const leftSide = str.slice(0, symbolPos),
			rightSide = str.slice(symbolPos + 1, str.length - 1);
		for (let i = leftSide.length - 1; i >= 0; i -= 1) {
			if (leftSide[i] == ')' && leftParensUnenclosed <= 0) {
				leftParensUnenclosed -= 1;
			} else if (leftSide[i] == '(') {
				leftParensUnenclosed += 1;
			}
		}
		for (let i = 0; i < rightSide.length; i += 1) {
			if (rightSide[i] == '(' && rightParensUnenclosed <= 0) {
				rightParensUnenclosed -= 1;
			} else if (rightSide[i] == ')') {
				rightParensUnenclosed += 1;
			}
		}
		return rightParensUnenclosed > 0 && leftParensUnenclosed > 0;
	}

	/**
	 * Takes a string and parses it into a list of strings. Used to create string
	 * roll tables. Strings in the list are separated by commas, with commas escaped by
	 * having the list entry surrounded in quotes. Leading and trailing space is
	 * trimmed unless escaped by the entry being surrounded in quotes.
	 * @param {string} str 
	 * @returns {Array<string>}
	 */
	static #parseStringList(str) {
		let strList = [];
		let newEntry = "";
		let startQuote = false;
		let endQuote = false;
		let spaceCount = 0;
		for (let i = 0; i < str.length; i++) {
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
		const lastEntry = newEntry.trim();
		if (lastEntry) {
			strList.push(lastEntry);
		}
		return strList;
	}

	/**
	 * Parses the roll string into a nested series of @type {ResultSet} object(s) and/or @type {Result} object(s)
	 * for the given string. Proceeds to call appropriate constructors of @type {ResultSet}(s) recursively
	 * to break down the string into something that can be processed.
	 * @param {string} value 
	 * @returns {ResultSet} The result set constructed from the given string
	 */
	static parse(value) {
		let parsingString = value.slice(0); // Copy the string
		parsingString = parsingString.replace(/(?<!\[[^\]]*)\s(?![^\[]*\])/g, ''); //Remove all white space
		parsingString = parsingString.replace(/\+\s*\-/g, '-'); //Simplify adding a negative to subtraction
		while (parsingString[0] == '(' && parsingString[parsingString.length - 1] == ')') { // If parentheses wrap the expression, remove them
			parsingString = parsingString.slice(1, value.length - 1);
		}
		// Handle base cases
		if (/^1?d(\%|\d+)$/.test(parsingString)) { //parse single die roll //(\%|\d+) -> d%, 1d5, d75
			return new SingleResultSet(parsingString);
		} else if (/^\d+d(\%|\d+)[dk][lh]?\d+$/.test(parsingString)) { //parse multiple die with selection // 2d20dl1, 2d4kh2
			const dPos = parsingString.search('d');
			const selPos = parsingString.search(/[dk][lh]?\d+$/);
			const endNumPos = parsingString.search(/\d+$/);
			return new DieSelectResultSet(parsingString.slice(0, dPos), parsingString.slice(dPos - parsingString.length, selPos), parsingString.slice(selPos - parsingString.length, endNumPos), parsingString.slice(endNumPos, parsingString.length))
		} else if (/^\d+d(\%|\d+)$/.test(parsingString)) { //parse multiple die roll // 1d20, 2d6
			const dPos = parsingString.search('d');
			return new MultiDieResultSet(parsingString.slice(0, dPos), parsingString.slice(dPos - parsingString.length));
		} else if (/^-?\d+$/.test(parsingString)) { //parse number result // 20, -3
			return new SingleResultSet(parsingString, false);
		} else if (/^1?u?l\[.*\]/.test(parsingString)) { //parse single list roll // l["a", "b", "c"], 1ul[a, b, c, d]
			const bracketList = parsingString.replace(/^1?u?l/, '');
			return new ListResultSet(1, this.#parseStringList(bracketList));
		} else if (/^\d+l\[.*\]/.test(parsingString)) { // parse multiple list pick // 2l["a", "b", "c"]
			const bracketList = parsingString.replace(/^\d+l/, '');
			const num = parsingString.replace(/l\[.*\]/, '');
			return new ListResultSet(num, this.#parseStringList(bracketList));
		} else if (/^\d+ul\[.*\]/.test(parsingString)) { // parse multiple list pick with unique selections // 2ul[a, b, c, d]
			const bracketList = parsingString.replace(/^\d+ul/, '');
			const num = parsingString.replace(/ul\[.*\]/, '');
			const forceUnique = !(num === '' || Number.parseInt(num) === 1);
			return new ListResultSet(num, this.#parseStringList(bracketList), forceUnique);
		}
		/*
		 * Find the appropriate symbol, right to left
		 * If the symbol is not surrounded by parens, turn into a TwoOpResultSet
		 * Otherwise, continue try again
		 * If the conditions are not met, try the next symbol set
		 */
		//Handle addition/subtraction
		const addSubPattern = /[\+\-]/;
		const multPattern = /\*/;
		const hasListPattern = /\d*u?l\[.*\]/;
		if (!multPattern.test(parsingString) && !hasListPattern.test(parsingString) && addSubPattern.test(parsingString)) { // eg 1 + 3, 20 - 2, 1 + 2 + 3
			const toPureSums = parsingString.replace(/\-/g, '+-');
			const parsableList = toPureSums.split('+');
			return new SumSeriesResultSet(parsableList);
		}
		if (addSubPattern.test(parsingString)) { // eg 3 + 8, 2 - 1
			for (let i = parsingString.length - 1; i >= 0; i -= 1) {
				if (addSubPattern.test(parsingString[i]) && !this.#surroundedByParens(parsingString, i)) {
					return new TwoOpResultSet(parsingString.slice(0, i), parsingString.slice(i + 1, parsingString.length), parsingString[i]);
				}
			}
		}
		if (multPattern.test(parsingString)) { // eg 7 * 4
			for (let i = parsingString.length - 1; i >= 0; i -= 1) {
				if (multPattern.test(parsingString[i]) && !this.#surroundedByParens(parsingString, i)) {
					return new TwoOpResultSet(parsingString.slice(0, i), parsingString.slice(i + 1, parsingString.length), parsingString[i]);
				}
			}
		}
		//string does not match any expected combination - throw error
		throw `Part of the input to parse into a roll is malformed: ${parsingString}`;
	}

	/**
	 * Fetches the results from the set. Must be implemented by the child classes.
	 */
	getResults() { throw new Error(`ResultSet function 'getResults' not properly implemented by child class ${this.constructor.name}.`); } // Implemented by child classes

	/**
	 * Fetches the maximum potential value of results from the set. Must be implemented by the child classes.
	 */
	getMaxResults() { throw new Error(`ResultSet function 'getMaxResults' not properly implemented by child class ${this.constructor.name}.`); } // Implemented by child classes

	/**
	 * Fetches the minimum potential value of results from the set. Must be implemented by the child classes.
	 */
	getMinResults() { throw new Error(`ResultSet function 'getMinResults' not properly implemented by child class ${this.constructor.name}.`); } // Implemented by child classes

	/**
	 * Fetches a formatted string form of the results set of rolls. Must be implemented by the child classes.
	 * @param {*} frac 
	 */
	toString(frac = false) { throw new Error(`ResultSet function 'toString' not properly implemented by child class ${this.constructor.name}.`); } // Implemented by child classes

	/**
	 * Fetches the roll results as an array. Must be implemented by the child classes.
	 */
	toResultArray() { throw new Error(`ResultSet function 'toResultArray' not properly implemented by child class ${this.constructor.name}.`); } // Implemented by child classes
}

/**
 * A @type {ResultSet} that contains only a single numbered die roll.
 */
class SingleResultSet extends ResultSet {
	#result

	/**
	 * Represents a single result, either numeric or from a die roll
	 * @param {number} value 
	 * @param {boolean} isRoll 
	 */
	constructor(value, isRoll = true) {
		super();
		if (isRoll) {
			const valueArr = value.split('d');
			let poppedVal = valueArr.pop();
			poppedVal = poppedVal == '%' ? '100' : poppedVal;
			this.#result = new RollResult(parseInt(poppedVal));
		} else {
			this.#result = new Result(parseInt(value));
		}
	}

	/**
	 * Returns the value of the contained result.
	 * @returns {number}
	 */
	getResults() { return this.#result.getResult(); }

	/**
	 * Returns the maximum value of the contained result, if it exists.
	 * Otherwise, returns the contained result.
	 * @returns {number}
	 */
	getMaxResults() { return this.#result.getMaxValue ? this.#result.getMaxValue() : this.#result.getResult(); }

	/**
	 * Returns the minimum of the potentail result. For rolled results
	 * with a `getMaxValue`, 1 is returned. Otherwise, the minimum is 
	 * just the result.
	 * @returns {number}
	 */
	getMinResults() { return this.#result.getMaxValue ? 1 : this.#result.getResult(); }

	/**
	 * Returns a string representation of the result. Die roll results
	 * can be represented as a fraction of their maximum result.
	 * @param {*} frac 
	 * @returns {string}
	 */
	toString(frac = false) {
		return this.#result.toString(frac);
	}

	/**
	 * Returns the result in an array representation
	 * @returns {Array<number>}
	 */
	toResultArray() { return [this.#result.getResult()]; }
}

/**
 * A @type {ResultSet} that represents choosing one or more results from a list
 * of strings.
 */
class ListResultSet extends ResultSet {
	#result
	#choices
	#stringList
	#forceUnique

	/**
	 * Creates a representation of randomly choosing a number of options 
	 * from the given list of strings. Can be forced to make unique choices.
	 * @param {number} choices 
	 * @param {Array<string>} list 
	 * @param {boolean} forceUnique 
	 */
	constructor(choices, list, forceUnique = false) {
		super();
		this.#result = []; // The options we have chosen
		this.#choices = choices;
		this.#forceUnique = forceUnique;
		this.#stringList = list;
		let tempUsedList = list.slice();
		for (let i = 0; i < choices; i++) {
			const randomSelection = tempUsedList[Math.floor(Math.random() * tempUsedList.length)];
			this.#result.push(new StringResult(randomSelection, tempUsedList));
			if (forceUnique) {
				tempUsedList = tempUsedList.filter(str => str != randomSelection);
			}
		}
	}

	/**
	 * Returns the string choice results as a comma separated list
	 * @returns {string}
	 */
	getResults() { return this.#result.map(r => r.getResult()).join(', '); }

	/**
	 * Since a "maximum" result does not make sense, a verbose return of the
	 * results is given.
	 * @returns {string}
	 */
	getMaxResults() { return `${this.#choices}${this.#forceUnique ? ' unique choices' : ''} from the list ${this.#stringList.join(', ')}` }

	/**
	 * Since a "minimum" result does not make sense, a verbose return of the
	 * results is given.
	 * @returns {string}
	 */
	getMinResults() { return `${this.#choices}${this.#forceUnique ? ' unique choices' : ''} from the list ${this.#stringList.join(', ')}` }

	/**
	 * Returns a string representation of the list roll results, with 
	 * additional detail if the parameter is true
	 * @param {boolean} frac 
	 * @returns 
	 */
	toString(frac = false) { return this.#result.map(r => r.toString(frac)).join(', '); }

	/**
	 * Returns the results as a list of strings
	 * @returns {Array<string>}
	 */
	toResultArray() { return this.#result.flatMap(r => r.getResult()); }
}

/**
 * A @type {ResultSet} representing a mathematical operation between two other
 * @type {ResultSet} objects. Additionally checks when getting results if the
 * specified operation is possible with the given {ResultSet} objects it
 * contains.
 */
class TwoOpResultSet extends ResultSet {
	/** @type {ResultSet} */ #left
	/** @type {ResultSet} */ #right
	/** @type {(two_ops.ADD|two_ops.SUBTRACT|two_ops.MULTIPLY)} */ #op

	/**
	 * Creates a set of two @type {ResultSet}s that are combined with a simple two-operand 
	 * mathematical operator. The two operands are parsed immediately, and can be checked to
	 * see if they return numbers or strings. Addition is supported for both numbers and strings 
	 * (through concatenation). Subtraction is supported for numbers, but not strings.
	 * Multiplication is supported for pure numbers and for cases where there is a number on the
	 * left and a string on the right (string repetition), but not for other configurations.
	 * @param {string} left 
	 * @param {string} right 
	 * @param {(two_ops.ADD|two_ops.SUBTRACT|two_ops.MULTIPLY)} op 
	 */
	constructor(left, right, op) {
		super();
		this.#left = ResultSet.parse(left);
		this.#right = ResultSet.parse(right);
		this.#op = op;
	}

	/**
	 * Returns the result of this result set. The way this is calculated is based on both
	 * the operation (addition, subtraction, or multiplication) and the end type of the inputs
	 * on either side of the operation. All three operations can be used when both sides of
	 * the operation are numbers. Strings can only be used on addition and multiplication, with
	 * addition having no restrictions (concatenation) and multiplication only able to have strings
	 * as the right operand (to repeat the string a number of times).
	 * @returns {(number|string)}
	 */
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
					const resultArray = new Array(this.#left.getResults()).fill(this.#right.getResults())
					return resultArray.join(' ');
				}
				return this.#left.getResults() * this.#right.getResults();
		}
	}

	/**
	 * Finds the maximum possible result for this result set. Maximum results of addition and multiplication
	 * of numbers are simply the sum or product of the maximums of the rolls, respectively. Subtraction maximums
	 * are the maximum of the left operand minus the minimum of the right operand. Addition/multiplication that involves
	 * strings uses string concatenation/repetition on the string portion, and the maximum of the numeric portions that
	 * exist.
	 * 
	 * Throws an error if the operation cannot be done with the given operands. See @function {getResults} for
	 * what is allowed.
	 * @returns {(number|string)}
	 */
	getMaxResults() {
		switch (this.#op) {
			case two_ops.ADD:
				const leftPart = this.hasStringInLeft() ? `${this.#left.getMaxResults()} ` : this.#left.getMaxResults();
				const rightPart = this.hasStringInRight() ? ` ${this.#right.getMaxResults()}` : this.#right.getMaxResults();
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

	/**
	 * Finds the minimum possible result for this result set. Minimum results of addition and multiplication
	 * of numbers are simply the sum or product of the minimums of the rolls, respectively. Subtraction minimums
	 * are the minimum of the left operand minus the maximum of the right operand. Addition/multiplication that involves
	 * strings uses string concatenation/repetition on the string portion, and the minimum of the numeric portions that
	 * exist.
	 * 
	 * Throws an error if the operation cannot be done with the given operands. See @function {getResults} for
	 * what is allowed.
	 * @returns {(number|string)}
	 */
	getMinResults() {
		switch (this.#op) {
			case two_ops.ADD:
				const leftPart = this.hasStringInLeft() ? `${this.#left.getMinResults()} ` : this.#left.getMinResults();
				const rightPart = this.hasStringInRight() ? ` ${this.#right.getMinResults()}` : this.#right.getMinResults();
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

	/**
	 * Returns a string representation of the list roll results, with 
	 * additional detail if the parameter is true.
	 * @param {boolean} frac 
	 * @returns {string}
	 */
	toString(frac = false) {
		if (this.#op == two_ops.SUBTRACT && (this.#left instanceof ListResultSet || this.#right instanceof ListResultSet)) {
			throw 'It is not possible to use subtraction on list rolls. Make sure you are not using subtraction on a list and your parentheses are correct.';
		}
		const leftString = this.#left.toString(frac);
		const rightString = this.#right.toString(frac)
		return `(${leftString} ${this.#op} ${rightString})`;
	}

	/**
	 * Recursively checks if a string can be returned by any portion of the left operand.
	 * @returns {boolean}
	 */
	hasStringInLeft() {
		if (this.#left instanceof ListResultSet) {
			return true;
		} else if (this.#left instanceof TwoOpResultSet) {
			return this.#right.hasStringInTree();
		} else {
			return false;
		}
	}

	/**
	 * Recursively checks if a string can be returned by any portion of the right operand.
	 * @returns {boolean}
	 */
	hasStringInRight() {
		if (this.#right instanceof ListResultSet) {
			return true;
		} else if (this.#right instanceof TwoOpResultSet) {
			return this.#right.hasStringInTree();
		} else {
			return false;
		}
	}

	/**
	 * Recursively checks if a string can be returned by any portion of either operand.
	 * @returns {boolean}
	 */
	hasStringInTree() {
		return this.hasStringInLeft() || this.hasStringInRight();
	}

	/**
	 * Returns the result in an array representation. This is at least two entries, starting
	 * with the entries on the "left" of the operand and ending with the entries on the "right".
	 * The array is flattened for usability in later chains.
	 * @returns {Array<(number|string)>}
	 */
	toResultArray() {
		return [this.#left.toResultArray(), this.#right.toResultArray()].flat();
	}
}

/**
 * A @type {ResultSet} that represents rolling multiple dice with a
 * given number of sides, keeping all results.
 */
class MultiDieResultSet extends ResultSet {
	#dieList = []
	#dieSides

	/**
	 * A @type {ResultSet} that represents rolling multiple dice that have the same
	 * number of sides, including limited means to interpret special notation (% -> 100).
	 * @param {number} numDice 
	 * @param {number} dieSides 
	 */
	constructor(numDice, dieSides) {
		super();
		let convertedDieSides = dieSides.replace('d', '');
		convertedDieSides = convertedDieSides == '%' ? '100' : convertedDieSides;
		this.#dieSides = parseInt(convertedDieSides);
		for (let i = 0; i < parseInt(numDice); i += 1) {
			this.#dieList.push(new RollResult(this.#dieSides));
		}

	}

	/**
	 * Returns the result of the rolls contained in this set, adding all of them together.
	 * @returns {number}
	 */
	getResults() { return this.#dieList.reduce((acc, roll) => acc + roll.getResult(), 0); }

	/**
	 * Finds the maximum possible result for this result set, which is the number of
	 * sides on the die multiplied by the number of dice rolled.
	 * @returns {number}
	 */
	getMaxResults() { return this.#dieList.length * this.#dieSides; }

	/**
	 * Finds the minimum possible result for this result set, which is the number of dice rolled.
	 * @returns {number}
	 */
	getMinResults() { return this.#dieList.length; }

	/**
	 * Returns a string representation of the list roll results, with 
	 * additional detail if the parameter is true
	 * @param {boolean} frac 
	 * @returns {string}
	 */
	toString(frac = false) {
		return `(${this.#dieList.map(roll => roll.toString(frac)).join(' + ')})`;
	}

	/**
	 * Returns the result in an array representation, one entry for each result.
	 * The array is flattened for usability in later chains.
	 * @returns {Array<number>}
	 */
	toResultArray() {
		return this.#dieList.flatMap(r => r.getResult());
	}
}

/**
 * A @type {ResultSet} representing a direct series of addition/subtraction,
 * on other @type {ResultSet} objects with no other operation types intervening.
 */
class SumSeriesResultSet extends ResultSet {
	#resultList = []
	#opList = []

	/**
	 * A @type {ResultSet} that represents a list of @type {ResultSet}s that are
	 * all added (or subtracted) in sequence. As a result, it is a simpler and more 
	 * efficient representation of sums than what @type {TwoOpResultSet} can provide.
	 * Additionally, it only represents numbers for simplicity.
	 * @param {Array<string>} listToSum 
	 */
	constructor(listToSum) {
		super();
		for (let i = 0; i < listToSum.length; i += 1) {
			if (listToSum[i][0] == '-') {
				this.#opList.push(two_ops.SUBTRACT);
				listToSum[i] = listToSum[i].slice(1);
			} else {
				this.#opList.push(two_ops.ADD);
			}
		}
		this.#resultList = listToSum.map(str => ResultSet.parse(str));
	}

	/**
	 * Returns the result of the rolls contained in this set, adding/subtracting all of them together.
	 * @returns {number|string}
	 */
	getResults() {
		let sum = 0;
		for (let i = 0; i < this.#resultList.length; i += 1) {
			if (this.#opList[i] == two_ops.ADD) {
				sum += this.#resultList[i].getResults();
			} else {
				sum -= this.#resultList[i].getResults();
			}
		}
		return sum;
	}

	/**
	 * Finds the maximum possible result for this result set. For each result element,
	 * if it is added to the result, its maximum is added to the maximum, or if it is
	 * subtracted from the result, its minimum is subtracted from the maximum.
	 * @returns {number|string}
	 */
	getMaxResults() {
		let max = 0;
		for (let i = 0; i < this.#resultList.length; i += 1) {
			if (this.#opList[i] = two_ops.ADD) {
				max += this.#resultList[i].getMaxResults();
			} else {
				max -= this.#resultList[i].getMinResults();
			}
		}
		return max;
	}

	/**
	 * Finds the minimum possible result for this result set. For each result element,
	 * if it is added to the result, its minimum is added to the minimum, or if it is
	 * subtracted from the result, its maximum is subtracted from the minimum.
	 * @returns {number|string}
	 */
	getMinResults() {
		let min = 0;
		for (let i = 0; i < this.#resultList.length; i += 1) {
			if (this.#opList[i] = two_ops.ADD) {
				min += this.#resultList[i].getMinResults();
			} else {
				min -= this.#resultList[i].getMaxResults();
			}
		}
		return min;
	}

	/**
	 * Returns a string representation of the list roll results, with 
	 * additional detail if the parameter is true
	 * @param {boolean} frac 
	 * @returns {number|string}
	 */
	toString(frac = false) {
		let output = `${this.#opList[0] == two_ops.SUBTRACT ? '-' : ''}`;
		let i = 0;
		while (i < this.#resultList.length) {
			output += this.#resultList[i].toString(frac);
			i += 1;
			if (i < this.#resultList.length) {
				output += ` ${this.#opList[i]} `;
			}
		}
		return `(${output})`;
	}

	/**
	 * Returns the result in an array representation, one for each entry in the series.
	 * The array is flattened for usability in later chains.
	 * @returns {Array<(number|string)>}
	 */
	toResultArray() {
		return this.#resultList.flatMap(r => r.toResultArray());
	}
}

/**
 * A @type {ResultSet} that represents rolling multiple dice of the same type
 * while only keeping a certain number of them based on certain pre-
 * defined rules.
 */
class DieSelectResultSet extends ResultSet {
	#dieList = []
	#dieSides
	#selectOp
	#selectNum

	/**
	 * Creates a @type {ResultSet} that represents a number of rolls that can also keep or drop
	 * a number of the rolls in that set. Die rolls are done on creation, while the keep/drop calculations
	 * are done once a result is requested.
	 * @param {number} numDice 
	 * @param {number} dieSides 
	 * @param {keep_ops.values()} selectOp 
	 * @param {number} selectNum 
	 */
	constructor(numDice, dieSides, selectOp, selectNum) {
		super();
		let convertedDieSides = dieSides.replace('d', '');
		convertedDieSides = convertedDieSides == '%' ? '100' : convertedDieSides;
		this.#dieSides = parseInt(convertedDieSides);
		this.#selectNum = selectNum ? parseInt(selectNum) : 1;
		this.#selectOp = selectOp;
		const parsedNumDice = parseInt(numDice);
		if (parsedNumDice - this.#selectNum <= 0) {
			switch (this.#selectOp) {
				case keep_ops.KEEP:
				case keep_ops.KEEP_HIGHEST:
				case keep_ops.KEEP_LOWEST:
					this.#selectNum = parsedNumDice;
					for (let i = 0; i < parsedNumDice; i += 1) {
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
			for (let i = 0; i < parsedNumDice; i += 1) {
				this.#dieList.push(new RollResult(this.#dieSides));
			}
		}
	}

	/**
	 * Returns the result of the rolls contained in this set. Dice are kept/dropped based on the rule
	 * applied on construction.
	 * @returns {number}
	 */
	getResults() {
		if (this.#dieList.length == 0) {
			return 0;
		}
		let kept = [];
		const resultDice = this.#dieList.slice().sort((r1, r2) => r1.getResult() - r2.getResult());
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

	/**
	 * Finds the maximum possible result of this result set. This is always equal
	 * to the number of sides on the die times the number of dice kept. The number of
	 * dice kept is the number of dice rolled minus the number of dice dropped for drop rolls.
	 * @returns {number}
	 */
	getMaxResults() {
		if (this.#dieList.length == 0) {
			return 0;
		}
		let trueDieLength = this.#dieList.length;
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

	/**
	 * Finds the minimum possible result for this result set. This is equal to
	 * the number of dice kept in all situations. For drop rolls, the number of dice kept
	 * is equal to the dice rolled minus the dice dropped.
	 * @returns {number}
	 */
	getMinResults() {
		if (this.#dieList.length == 0) {
			return 0;
		}
		let trueDieLength = this.#dieList.length;
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

	/**
	 * Returns a string representation of the list roll results, with 
	 * additional detail if the parameter is true
	 * @param {boolean} frac 
	 * @returns {string}
	 */
	toString(frac = false) {
		if (this.#dieList.length == 0) {
			return frac ? `0/0` : `0`;
		}
		let isKeep = this.#selectOp.startsWith('k'),
			dieMap = this.#dieList.map(result => { return { roll: result, keep: !isKeep } });
		let skipIndices = [], repeats = this.#selectNum;
		switch (this.#selectOp) {
			case keep_ops.KEEP:
			case keep_ops.KEEP_HIGHEST:
				while (repeats > 0) {
					let highIndex = -1;
					let highValue = -1;
					for (let i = 0; i < dieMap.length; i++) {
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
					let lowIndex = -1;
					let lowValue = Number.POSITIVE_INFINITY;
					for (let i = 0; i < dieMap.length; i++) {
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
					let lowIndex = -1;
					let lowValue = Number.POSITIVE_INFINITY;
					for (let i = 0; i < dieMap.length; i++) {
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
					let highIndex = -1;
					let highValue = -1;
					for (let i = 0; i < dieMap.length; i++) {
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

	/**
	 * Returns the result in an array representation, one entry for each die rolled in the selection.
	 * The array is flattened for usability in later chains, and includes results that are excluded
	 * due to the die selection type.
	 * @returns {Array<number>}
	 */
	toResultArray() {
		return this.#dieList.flatMap(r => r.getResult());
	}
}

/**
 * A bundle object that represents a {ResultSet} parsed from a string
 * and some additional labelling text for the output.
 */
class ResultBundle {
	#resultset
	#extraText

	/**
	 * Constructs a manager for a set of parsed rolls with its label text
	 * @param {ResultSet|string} rs the set of results to manage
	 * @param {string} et extra text for the output
	 */
	constructor(rs, et = "") {
		this.#resultset = rs instanceof ResultSet ? rs : ResultSet.parse(rs);
		this.#extraText = et;
	}

	/**
	 * Returns the rolls done for this bundle as an object
	 * @returns {ResultSet}
	 */
	getResultSet() {
		return this.#resultset;
	}

	/**
	 * Returns the stored label text
	 * @returns {string} text to attach to the end of a result string
	 */
	getExtraText() {
		return this.#extraText;
	}

	/**
	 * Converts this result bundle into a readable string based on
	 * the passed parameters.
	 * @param {boolean} frac Shows results over the maximum results when true, and just rolls when false
	 * @param {boolean} simple Shows only results when true, and individual rolls when false
	 * @returns {string}
	 */
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

	/**
	 * Returns the result in an array representation.
	 * This is a passthrough function that simply fetches the result array of the internal
	 * @type {ResultSet} object.
	 * @returns {Array<(number|string)>}
	 */
	toResultArray() {
		return this.#resultset.toResultArray();
	}
}

/**
 * Does some initial processing on the rolling input before passing the portion relevant to the rolls
 * and the portion relevant to labelling to the {ResultBundle} for further processing.
 * @param {string} input 
 * @returns {ResultBundle}
 */
function parseRoll(input) {
	input = input.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').replace(/\+/g, ' + ').replace(/\*/g, ' * ').replace(/\-(^\d)/g, ' - ');
	const splitInput = input.split(/(?<!\[[^\]]*) (?![^\[]*\])/);
	const rollArray = splitInput.reduce((acc, cur) => {
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
	const textArray = splitInput.reduceRight((acc, cur) => {
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

	// Early error cases
	let errMsgArray = []
	let listEmptyErrRolls = [];
	for (const roll of rollArray) {
		if (/\d*u?l\[\]/.test(roll)) { // 1l[], ul[]
			listEmptyErrRolls.push(roll);
		}
	}
	if (listEmptyErrRolls.length) {
		errMsgArray.push(`The list of items to roll cannot be empty. The following rolls had this issue: ${listEmptyErrRolls.join('; ')}`);
	}
	if (errMsgArray.length) {
		throw `The following issues have been found:\n\t${errMsgArray.join('\n\t')}`;
	}

	// Generate the roll bundle that can have extracted results
	return new ResultBundle(rollArray.join(''), textArray.join(' '));
}

/**
 * Fetches the relevant roll string by parsing the input and immediately 
 * converting that back into a string based on the passed parameters.
 * @param {string} input 
 * @param {boolean} frac 
 * @param {boolean} simple 
 * @returns {string} a string that represents the results of the roll with proper labelling
 */
function getRollString(input, frac = false, simple = false) {
	return parseRoll(input).toString(frac, simple);
}

/**
 * Takes a rolling string, passes it through the roll parsing system, and
 * returns the results as an array of {RollResult} objects
 * @param {string} input 
 * @returns {RollResult[]}
 */
function getRollArray(input) {
	return parseRoll(input).toResultArray();
}

module.exports = { parseRoll, getRollString, getRollArray }

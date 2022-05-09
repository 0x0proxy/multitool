// mutli.js
// utiltiy module for developing, testing, and deploying solidity code
// born on 14 Jan 2022, created by 0x0proxy.eth
// Licensed under the MIT License

// This is a collection of simple tools and utility functions that
// we've found helpful in developing smart contracts in Solidity using
// hardhat.
//
// Intended use is:
// const multi = require('multi');
// inside a Node.js script foo.js that is being run by means of:
// npx hardhat run --network <yournetwork> foo.js
//
// Multi.js is a bit of a mishmash; hence the mutlitool name.  Some or
// all of this script's functionality is available elsewhere but with
// annoyingly excessive dependencies or with frustrating limitations.
// I hate the massive dependency rush you get with "npm install," so I
// wanted to create a light-weight support script that had nearly all
// of what I used on a routine basis, all in once place.
//
// The testing/assert stuff can be found in dedicated testing
// frameworks, but under hardhat at the time of this writing it was
// impossible to do certain basic things inside the frameworks (such
// as modify the frequency of block updates, or assert exceptions)
// without doing really awkward things that involved combining
// otherwise incompatible test frameworks
//
// There is even a little truffle-like deployment management in the
// form of a simple utility to record the latest contract deployment
// addresses.
//
// Hope you find this useful, please feel free to make
// improvements. If you do, I hope you will commit them back to the
// multitool repo on a branch and make a pull request.

//const debug = true;
const debug = false;

// ***************************
// dependencies
// ***************************

// NOTE: we assume that ethers is already part of the environment, so
// no explicit "require" for ethers here.

// FS is the only named external dependency
const fs = require('fs');

// ******************************************
// Terminal output color formatting
// ******************************************

// colors for console formatting
exports.cdict = {
    "Reset":  "\x1b[0m",
    "Bright": "\x1b[1m",
    "Dim": "\x1b[2m",
    "Underscore": "\x1b[4m",
    "Blink": "\x1b[5m",
    "Reverse": "\x1b[7m",
    "Hidden": "\x1b[8m",

    "FgBlack": "\x1b[30m",
    "FgRed": "\x1b[31m",
    "FgGreen": "\x1b[32m",
    "FgYellow": "\x1b[33m",
    "FgBlue": "\x1b[34m",
    "FgMagenta": "\x1b[35m",
    "FgCyan": "\x1b[36m",
    "FgWhite": "\x1b[37m",
    
    "BgBlack": "\x1b[40m",
    "BgRed": "\x1b[41m",
    "BgGreen": "\x1b[42m",
    "BgYellow": "\x1b[43m",
    "BgBlue": "\x1b[44m",
    "BgMagenta": "\x1b[45m",
    "BgCyan": "\x1b[46m",
    "BgWhite": "\x1b[47m"
}

// various color formatting functions

exports.colorstring = function(c,s) {
    str = exports.cdict[c]+s+exports.cdict['Reset'];
    return str;
}

exports.blue = function(s) {
    return exports.colorstring('FgBlue',s);
}
exports.red = function(s) {
    return exports.colorstring('FgRed',s);
}

exports.green = function (s) {
    return exports.colorstring('FgGreen',s);
}

exports.amber = function (s) {
    return exports.colorstring('FgYellow',s);
}

exports.bluelog = function(s) {
    console.log(exports.blue(s));
}
exports.greenlog = function(s) {
    console.log(exports.green(s));
}
exports.redlog = function(s) {
    console.log(exports.red(s));
}
exports.amberlog = function(s) {
    console.log(exports.amber(s));
}

// ******************************
// contract deployment support
// ******************************

// write a contract address to a single-line, single-record file
exports.writeContractAddress=function(fname,address) {
    fs.writeFileSync(fname,
		     address + "\n", { flag: 'w+' },
		     err => {
			 if (err) {
			     mylib.redlog('ERROR! ' + err);
			     throw(err);
			 }
		     });
}

// read a contract address from a single-line, single-record file
exports.readContractAddress= function(fname) {
    var addr = '';
    try {
	const data = fs.readFileSync(fname, 'utf8')
	addr = data.trim();
    } catch (err) {
	console.error(err)
    }
    return addr;
}    


// ****************************************
// lightweight assert testing support
// ****************************************

// **************************************************
// functions for testing closeness of inexact numbers

exports.smallEpsilon= 1.0e-6;
exports.bigEpsilon = ethers.BigNumber.from('10').pow(15);

// Test closeness of floating-point values. Return true if values are
// within epsilon, by default exports.smallEpsilon

exports.close = function(s1,s2,epsilon=exports.smallEpsilon) {
    return Math.abs(s1 - s2) < epsilon;
}

// bigClose() is intended for testing closeness of big-number values
// denominated in ether or similar.  By default bigEpsilon is 10^15,
// since we assume a fixed point denominator of 10^18, and slop for
// gas fees.  Epsilon can be set to a small value (say, 1) if a test
// for true equality is warranted.

exports.bigClose = function(b1,b2,
			    epsilon=exports.bigEpsilon) {
    b1 = ethers.BigNumber.from(String(b1));
    b2 = ethers.BigNumber.from(String(b2));
    if (debug) {
	exports.bluelog("debug: b1: " + b1 +
			", b2: " + b2 +
			", epsilon: " + epsilon);
    }
			
    if (b1.gt(b2)) {
	if (debug) {
	    exports.bluelog("debug: b1-b2: " + b1.sub(b2) );
	}
	return (b1.sub(b2)).lt(epsilon);
    }
    if (debug) {
	exports.bluelog("debug: b2-b1: " + b2.sub(b1) );
    }
    return (b2.sub(b1)).lt(epsilon);
}

// ***************************************************************
// This is a simple set of tools for asserting, recording, reading,
// and writing test records.

exports.total = 0;
exports.pass = 0;
exports.fail = 0;

// clear the pass-fail record
exports.clearCount = function() {
    exports.pass = 0;
    exports.fail = 0;
    exports.total= 0;
}

// basic assert, won't handle exceptions (do that yourself if you need it)
exports.assert = function(condition, passmsg="", failmsg=""){
    if (failmsg == "") {
	failmsg = passmsg;
    }
    if (condition) {
	exports.total ++;
	exports.pass ++;
	console.log(exports.amber("assertion: ") +
		    exports.green(passmsg + " -- PASS"));
    }
    else {
	exports.total++;
	exports.fail ++;
	console.log(exports.amber("assertion: ") +
		    exports.red(failmsg + " -- FAIL"));
    }
}

// Expect a revert -- this is a bit of a hack, but appears to work
// with Node.js scripts running under hardhat
exports.expectRevert = function (promisething, errmessage,
				 passmsg="", failmsg="") {
    promisething.then((resolved,rejected) => {
	failmsg = 'no exception: ' + passmsg;
	exports.assert(false,passmsg,failmsg);
	return("no exception");
    }).catch(e=> {
	// console.log(exports.introspect(e,true));
	if (e.name == "ProviderError") {
	    // console.log(" --> " + e);
	    // console.log(" --> " + mylib.introspect(e,true));
	    failmsg = 'incorrect exception: ' + e.toString() +
		' - ' + passmsg;
	    exports.assert(e.toString().includes(errmessage),
			   passmsg, failmsg);
	    return('provider error with message');
	} else if (typeof(e.error) != "undefined") {
	    failmsg = 'incorrect exception: ' + e.error + ' - ' +failmsg;
	    exports.assert((e.error).toString().includes(errmessage),
			   passmsg, failmsg);
	    return('exception with error message');
	}
	failmsg = 'bad exception type: ' + passmsg;
	exports.assert(false,passmsg,failmsg);
	return('exception with bad type');
    });
}

// ******************************
// test record stuff

// default file name for recording tests
exports.passFailFname='passFail.txt';

// Write the current pass/fail state to a test record file
exports.writePassFail = function(testname='-',
				 total=exports.total,
				 pass =exports.pass,
				 fail = exports.fail,
				 fname=exports.passFailFname) {
    if (total != pass + fail) {
	throw('inconsistent pass-fail-total statistics');
    }
    const date = new Date();
    const content = testname +
	  " total " + total +
	  " pass " + pass +
	  " fail " +fail + " -- " + date.getTime() + "\n";
	  
    fs.writeFileSync(fname,content, { flag: 'a+' }, err => {
	if (err) {
	    console.error(err);
	    throw(err);
	}
    });
}
    
// Write a special counter reset line to the test record file
exports.writeBreak= function(fname=exports.passFailFname) {
    var content = "! Resetting counters at " + new Date + "\n";
    fs.writeFileSync(fname,content, { flag: 'a+' }, err => {
	if (err) {
	    console.error(err);
	    throw(err);
	}
    });
}
    
// Read the contents of a test record file
exports.readPassFail = function(clear=false) {
    if (debug) console.log('debug: readPassFail called');
    if (clear) {
	exports.clearCount();
    }
    
    try {
	const data = fs.readFileSync(exports.passFailFname, 'utf8');
	const lines = data.toString().replace(/\r\n/g,'\n').split('\n');
	const rx = new RegExp('[ ]+');
	for (let i of lines) {
	    if (debug) console.log('debug: reading passFail: ' + i);
	    if (i[0]== '#') continue; //  comment
	    if (i[0]== '!') {	      // reset marker
		exports.bluelog('==> total [' +
				exports.amber(exports.total) +
				exports.blue('] pass [') +
				exports.green(exports.pass) +
				exports.blue('] fail [') +
				exports.red(exports.fail) +
				exports.blue(']'));
		exports.bluelog('==> ' + i);
		exports.clearCount();
		continue;
	    }
	    var iarray = i.split(rx);
	    if (iarray[1] !="total" ||
		iarray[3] !="pass" ||
		iarray[5] !="fail") {
		if (debug) console.log("bad record: " + i);
		continue;
	    }
	    exports.total += Number(iarray[2]);
	    exports.pass += Number(iarray[4]);
	    exports.fail += Number(iarray[6]);
	    if (exports.total != exports.pass + exports.fail) {
		throw("pass, fail, and total don't add up:" +
		      " pass: " + exports.pass +
		      " fail: " + exports.fail +
		      " total: " + exports.total);
	    }
	    console.log('==> ' + iarray[0] +
			': total [' + exports.amber(Number(iarray[2])) +
			'] pass [' + exports.green(Number(iarray[4])) +
			'] fail [' + exports.red(Number(iarray[6])) +
			']');
	}
    }
    catch (err) {
	console.error(err)
	throw(err);
    }
    
}

// testing report function -- optionally reads a report file,
// summarizes testing results, optionally writes an updated report
exports.report = function(tname="-",
			  readreport=false,
			  writereport=true) {
    if (readreport) {
	exports.readPassFail();
    }
    console.log(exports.amber("====================================="));
    exports.bluelog(exports.cdict['BgGreen'] + tname + " TESTING REPORT");
    console.log(exports.amber("====================================="));
    console.log("Total tests: ["+exports.amber(exports.total)
		+"]");
    console.log("pass total: ["+exports.green(exports.pass)+
		"]  fail total: ["+exports.red(exports.fail)+
		"]");
    if (writereport) {
	console.log("writing report...");
	exports.writePassFail(tname);
    }
	
}

// ****************************************
// Misc useful functions and constants
// ****************************************

// zero address for contracts
exports.zeroAddress='0x0000000000000000000000000000000000000000';

// timeout function for introducing delay in test scripts with await
exports.timeoutPromise = function (interval) {
    return new Promise((resolve, reject) => {
	setTimeout(function(){
	    resolve("done");
	}, interval);
    });
};

// convert a number to a bignum representation denominated in ether,
// or similar 10^18 denominator fixpoint
exports.toEth = function (val,
			  precise = 10,
			  denom =
			  ethers.BigNumber.from('10').pow(18)) {
    var v = parseFloat(val).toPrecision(precise) * (10**precise);
    return ethers.BigNumber.from(Math.round(v)).mul(denom)
	.div(ethers.BigNumber.from('10').pow(precise));
}

// do some object introspection -- often useful for debugging
exports.introspect = function(obj,console=false) {
    var proplist = "";
    for (var propName in obj) {
	if(typeof(obj[propName]) != "undefined") {
	    if (proplist != "") proplist +=", ";
	    if (console)
		proplist += (exports.amber(propName) + " = " +
			     exports.green(obj[propName]) );
	    else
		proplist += (propName + " = " + obj[propName] );
	    
	}
    }
    return proplist;
}

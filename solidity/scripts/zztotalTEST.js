// zztotalTEST.js
// created 31 January 2022 by 0x0proxy.eth
// licensed under the MIT license

// Intended for batch testing with scripts using multi.js test recording.
// alphaetically, this script will be run last in a batch, e.g.:
// for i in scripts/*TEST.js; do
//     echo "running $i"
//     npx hardhat run --network localhost $i
//     done

// generate testing report for all tests runs recorded in passFail.txt

var multi = require ('./multi');

async function main() {
    multi.amberlog("============================================");
    multi.bluelog(multi.cdict['BgGreen'] + "--> test run results  <--");
    multi.amberlog("============================================");
    multi.report("SUMMARY",readreport=true,writereport=false);
}
    
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

// aardvark reset test accounting script
// created on 2 Feb 2022 by 0x0proxy.eth
// licensed under the MIT license

// Intended for batch testing with scripts using multi.js test recording.
// Alphaetically, this script will be run first in a batch, e.g.:
// for i in scripts/*TEST.js; do
//     echo "running $i"
//     npx hardhat run --network localhost $i
//     done

var multi = require ('./multi');

async function main() {
    multi.amberlog("============================================");
    multi.bluelog(multi.cdict['BgGreen'] + "--> resetting test accounting  <--");
    multi.amberlog("============================================");
    multi.writeBreak();    
}
    
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

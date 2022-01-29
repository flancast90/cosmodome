/*
 * Copyright 2021 Finn Lancaster
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
 * to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 * FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
*/

/*
 * EDITED BY ziemniakbiznesu FOR PROJECT NEEDS. 
*/



/*
 * dependencies are all native, and are declared here for easy reference. In case they 
 * are not already installed, the user can just `npm install [dependency]`
*/
const fs = require('fs');

var listFileName = 'blacklist.txt';
var blacklist = fs.readFileSync(listFileName, 'utf8').split('\n')

module.exports = {
    check: id => {
        return blacklist.includes(id)
    },

    ban: id => {
        if (this.check(id)) {
            return;
        }

        blacklist.push(id);
        fs.appendFile(listFileName, `${id}\n`, err => console.error(err));
    },

    unban: id => {
        if (blacklist.indexOf(id) == -1) {
            return;
        }

        var content = fs.readFileSync(listFileName, 'utf-8').replace(new RegExp(`${id}\n`), '');
        fs.writeFileSync(listFileName);
        blacklist.pop(blacklist.indexOf(id));
    }
}

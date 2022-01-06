export function utf8ToChar(s) {
    s = s.replace(/%/g, ' ');
    return convertUTF82Char(s);
}


//! below functions taken from https://github.com/r12a/r12a.github.io/blob/master/apps/conversion/conversionfunctions.js
function convertUTF82Char(str) {
    // converts to characters a sequence of space-separated hex numbers representing bytes in utf8
    // str: string, the sequence to be converted
    var outputString = "";
    var counter = 0;
    var n = 0;

    // remove leading and trailing spaces
    str = str.replace(/^\s+/, '');
    str = str.replace(/\s+$/, '');
    if (str.length == 0) {
        return "";
    }
    str = str.replace(/\s+/g, ' ');

    var listArray = str.split(' ');
    for (var i = 0; i < listArray.length; i++) {
        var b = parseInt(listArray[i], 16); // alert('b:'+dec2hex(b));
        switch (counter) {
            case 0:
                if (0 <= b && b <= 0x7F) { // 0xxxxxxx
                    outputString += dec2char(b);
                } else if (0xC0 <= b && b <= 0xDF) { // 110xxxxx
                    counter = 1;
                    n = b & 0x1F;
                } else if (0xE0 <= b && b <= 0xEF) { // 1110xxxx
                    counter = 2;
                    n = b & 0xF;
                } else if (0xF0 <= b && b <= 0xF7) { // 11110xxx
                    counter = 3;
                    n = b & 0x7;
                } else {
                    outputString += 'convertUTF82Char: error1 ' + dec2hex(b) + '! ';
                }
                break;
            case 1:
                if (b < 0x80 || b > 0xBF) {
                    outputString += 'convertUTF82Char: error2 ' + dec2hex(b) + '! ';
                }
                counter--;
                outputString += dec2char((n << 6) | (b - 0x80));
                n = 0;
                break;
            case 2:
            case 3:
                if (b < 0x80 || b > 0xBF) {
                    outputString += 'convertUTF82Char: error3 ' + dec2hex(b) + '! ';
                }
                n = (n << 6) | (b - 0x80);
                counter--;
                break;
        }
    }
    return outputString.replace(/ $/, '');
}

function dec2char(n) {
    // converts a single string representing a decimal number to a character
    // note that no checking is performed to ensure that this is just a hex number, eg. no spaces etc
    // dec: string, the dec codepoint to be converted
    var result = '';
    if (n <= 0xFFFF) {
        result += String.fromCharCode(n);
    } else if (n <= 0x10FFFF) {
        n -= 0x10000
        result += String.fromCharCode(0xD800 | (n >> 10)) + String.fromCharCode(0xDC00 | (n & 0x3FF));
    } else {
        result += 'dec2char error: Code point out of range: ' + dec2hex(n);
    }
    return result;
}

function dec2hex(textString) {
    return (textString + 0).toString(16).toUpperCase();
}
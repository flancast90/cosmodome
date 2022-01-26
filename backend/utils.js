var color = require('./color');

const LogLevel = { info: 0, error: 1, debug: 2, custom: 3 };

function Log(message, loglevel, data) {
    switch (loglevel) {
        case LogLevel.info:
            console.log(color.BgBlack, color.FgBlue, "INFO", color.Reset, `>> ${message}`);
            break;

        case LogLevel.error:
            console.log(color.BgBlack, color.FgRed, "ERROR", color.Reset, `>> ${message}`);
            break;

        case LogLevel.debug:
            console.log(color.BgBlack, color.FgYellow, "DEBUG", color.Reset, `>> ${message}`);
            break;

        case LogLevel.custom:
            console.log(color.BgBlack + color.FgGreen, data, color.Reset,  `>> ${message}`);
            break;
    
        default:
            console.log(`INFO >> ${message}`);
            break;
    }
}

module.exports = { Log, LogLevel };
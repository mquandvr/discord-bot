import winston from "winston";
import { getFileName } from "./path.js";

const logger = winston.createLogger({
    transports: [
      new winston.transports.Console({
        level: 'info',
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
          winston.format.splat(),
          winston.format.printf(options => printf(options)),
        )
      })
    ],
    exceptionHandlers: [
        new winston.transports.Console({
            level: 'error',
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple(),
              winston.format.splat(),
              winston.format.printf(options => printf(options)),
            )
        })
    ]
  });

logger.exitOnError = false;

function printf(options) {
    return `${options.level}: [${options.moduleName}] ${options.message}`;
}

export default function(fileName) {
    return logger.child({moduleName: getFileName(fileName)});
};
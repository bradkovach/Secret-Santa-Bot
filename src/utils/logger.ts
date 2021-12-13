import winston from 'winston';
import { createLogger, format, transports } from 'winston';
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
	return `[${timestamp}] ${level}: ${message}`;
});

const logger = winston.createLogger({
	format: combine(timestamp(), myFormat),
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: 'logs/combined.log' }),
	],
});

export default logger;

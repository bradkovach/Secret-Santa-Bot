import { firstBotName } from './firstBotName';
import { ICommand } from '../ICommand';
import { IConfig } from '../IConfig';

const resolvedConfig = require('../config.json') as IConfig;

export function showCommandUsage(command: ICommand) {
	return firstBotName() + resolvedConfig.prefix + ' ' + command.usage;
}

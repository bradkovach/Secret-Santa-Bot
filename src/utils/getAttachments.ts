import { Message, Embed } from 'discord.js';

export function getAttachments(message: Message, embed: Embed) {
	// let imageAttached = message.attachments.toJSON()

	// if (Array.isArray(imageAttached) && imageAttached.length) {
	// 	if (
	// 		imageAttached[0].url.endsWith('.mp4') ||
	// 		imageAttached[0].url.endsWith('.mp3')
	// 	) {
	// 		embed.addField('File', imageAttached[0].url);
	// 		return { files: [imageAttached[0].url], embed: embed };
	// 		//attachURL = `{name: "File", value: "${imageAttached[0].url}"},`;
	// 		//embedFile = `files: [{attachment: "${imageAttached[0].url}"}], embed: `;
	// 	} else {
	// 		embed.setImage(imageAttached[0].url);
	// 		return embed;
	// 	}
	// }

	return embed;
}

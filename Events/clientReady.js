import { ActivityType } from "discord.js";

export default {
	name: 'clientReady',
	async execute(bot) {
		await bot.application.commands.set(bot.arrayOfSlashCommands);

		bot.user.setPresence({
			activities: [{ name: 'NovaBots', type: ActivityType.Streaming, url: 'https://twitch.tv/P2' }], status: 'online'
		});
	}
};

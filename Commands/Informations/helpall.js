import {
	EmbedBuilder,
	ActionRowBuilder,
	StringSelectMenuBuilder
} from "discord.js";
import db from "../../Events/loadDatabase.js";
import config from "../../config.json" assert { type: "json" };

export const command = {
	name: "helpall",
	helpname: "helpall",
	description: "Affiche les commandes par permissions",
	help: "helpall",
	run: async (bot, message) => {

		const permsList = ["public"];
		for (let i = 1; i <= 12; i++) permsList.push(i.toString());

		/* ========= Récupération rôles par permission ========= */
		const getRolesByPerm = (perm) =>
			new Promise((resolve) => {
				db.all(
					"SELECT id FROM permissions WHERE perm = ? AND guild = ?",
					[perm, message.guild.id],
					(err, rows) => {
						if (err || !rows.length) return resolve("Aucun rôle");
						const roles = rows
							.map(r => message.guild.roles.cache.get(r.id))
							.filter(Boolean)
							.map(r => `<@&${r.id}>`);
						resolve(roles.join(", ") || "Aucun rôle");
					}
				);
			});

		/* ========= Récupération commandes par permission ========= */
		const getCommandsByPerm = (perm) =>
			new Promise((resolve) => {
				db.all(
					"SELECT command FROM cmdperm WHERE perm = ? AND guild = ?",
					[perm, message.guild.id],
					(err, rows) => {
						if (err || !rows.length) return resolve("Aucune commande");
						resolve(rows.map(r => `\`${r.command}\``).join(", "));
					}
				);
			});

		/* ========= Génération des pages ========= */
		const pages = [];
		for (const perm of permsList) {
			pages.push({
				perm,
				roles: await getRolesByPerm(perm),
				commands: await getCommandsByPerm(perm)
			});
		}

		let index = 0;

		const makeEmbed = () =>
			new EmbedBuilder()
				.setTitle(" Commandes par permissions")
				.addFields(
					{ name: " Permission", value: `**${pages[index].perm}**`, inline: true },
					{ name: " Rôles liés", value: pages[index].roles },
					{ name: " Commandes", value: pages[index].commands }
				)
				.setColor(config.color)
				.setFooter({
					text: `Permission ${index + 1}/${pages.length}`
				});

		/* ========= Select Menu ========= */
		const row = new ActionRowBuilder().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId("perm_select")
				.setPlaceholder("Choisis une permission")
				.addOptions(
					pages.map((p, i) => ({
						label: p.perm === "public" ? "Public" : `Permission ${p.perm}`,
						value: i.toString()
					}))
				)
		);

		const msg = await message.reply({
			embeds: [makeEmbed()],
			components: [row]
		});

		const collector = msg.createMessageComponentCollector({
			filter: i => i.user.id === message.author.id,
			time: 120000
		});

		collector.on("collect", async i => {
			index = Number(i.values[0]);
			await i.update({
				embeds: [makeEmbed()],
				components: [row]
			});
		});

		collector.on("end", () => {
			msg.edit({ components: [] }).catch(() => { });
		});
	}
};

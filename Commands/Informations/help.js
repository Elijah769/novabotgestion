import {
	EmbedBuilder,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	ButtonBuilder,
	ButtonStyle,
} from "discord.js";
import fs from "fs";
import path from "node:path";
import { fileURLToPath } from "url";
import config from "../../config.json" assert { type: "json" };
import db from "../../Events/loadDatabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const categories = [
	"Informations",
	"Utilitaires",
	"Modérations",
	"Gestions",
	"Antiraid",
	"Logs",
	"Contact",
	"Paramètres",
];

export const command = {
	name: "help",
	helpname: "help",
	description: "Menu d'aide interactif",
	help: "help [commande]",
	run: async (bot, message, args) => {

		// ================= PERMISSIONS =================
		const checkPerm = async (cmdName) => {
			if (config.owners.includes(message.author.id)) return true;
			return new Promise(resolve => {
				db.get(
					"SELECT command FROM cmdperm WHERE command = ? AND guild = ?",
					[cmdName, message.guild.id],
					(err, row) => resolve(!!row)
				);
			});
		};

		// ================= SEARCH SPECIFIC COMMAND =================
		if (args[0]) {
			for (const category of categories) {
				const dir = path.join(__dirname, `../../Commands/${category}`);
				if (!fs.existsSync(dir)) continue;

				for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".js"))) {
					const cmd = (await import(`../../Commands/${category}/${file}`)).command;

					if (cmd.name === args[0] || (cmd.aliases && cmd.aliases.includes(args[0]))) {
						if (!(await checkPerm(cmd.name))) return message.reply({
							content: "Vous n'avez pas la permission d'utiliser cette commande."
						});

						const embed = new EmbedBuilder()
							.setTitle(`Commande : ${cmd.name}`)
							.setDescription(cmd.description || "Aucune description")
							.addFields(
								{ name: "Utilisation", value: `\`${config.prefix}${cmd.help}\`` },
								{ name: "Catégorie", value: category, inline: true },
								{ name: "Alias", value: cmd.aliases?.join(", ") || "Aucun", inline: true }
							)
							.setColor(config.color);

						return message.reply({ embeds: [embed] });
					}
				}
			}

			return message.reply({
				embeds: [
					new EmbedBuilder()
						.setDescription(`La commande \`${args[0]}\` n'existe pas.`)
						.setColor(config.color)
				]
			});
		}

		// ================= BUILD PAGES =================
		const pages = [];
		for (const category of categories) {
			const dir = path.join(__dirname, `../../Commands/${category}`);
			if (!fs.existsSync(dir)) continue;

			const cmds = [];
			for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".js"))) {
				const cmd = (await import(`../../Commands/${category}/${file}`)).command;
				if (await checkPerm(cmd.name)) cmds.push(`\`${config.prefix}${cmd.helpname || cmd.name}\``);
			}

			if (cmds.length > 0) pages.push({ name: category, cmds });
		}

		let index = 0;

		// ================= CREATE EMBED =================
		const makeEmbed = () => {
			return new EmbedBuilder()
				.setAuthor({ name: `${bot.user.username} • Help`, iconURL: bot.user.displayAvatarURL() })
				.setDescription(
					index === 0
						? `**Version :** 1.0\n\n` +
						`**Syntaxes :**\n` +
						`\`< >\` Obligatoire\n` +
						`\`[ ]\` Optionnel\n` +
						`\`/\` Séparer\n\n` +
						`**Commandes totales :** ${pages.reduce((a, b) => a + b.cmds.length, 0)}`
						: pages[index].cmds.join("  ")
				)
				.addFields({ name: "Catégorie", value: `**${pages[index].name}**` })
				.setFooter({ text: `Page ${index + 1}/${pages.length}` })
				.setColor(config.color);
		};

		// ================= COMPONENTS =================
		const selectRow = new ActionRowBuilder().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId("help_select")
				.setPlaceholder("Choisis une catégorie")
				.addOptions(pages.map((p, i) => ({ label: p.name, value: `${i}` })))
		);

		const buttonRow = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId("prev").setEmoji("⬅️").setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId("next").setEmoji("➡️").setStyle(ButtonStyle.Secondary)
		);

		const msg = await message.reply({
			embeds: [makeEmbed()],
			components: [selectRow, buttonRow]
		});

		// ================= COLLECTOR =================
		const collector = msg.createMessageComponentCollector({
			filter: i => i.user.id === message.author.id,
			time: 120_000
		});

		collector.on("collect", async i => {
			if (i.customId === "help_select") index = Number(i.values[0]);
			else if (i.customId === "prev") index = index === 0 ? pages.length - 1 : index - 1;
			else if (i.customId === "next") index = (index + 1) % pages.length;

			await i.update({ embeds: [makeEmbed()], components: [selectRow, buttonRow] });
		});

		collector.on("end", () => msg.edit({ components: [] }).catch(() => { }));
	}
};

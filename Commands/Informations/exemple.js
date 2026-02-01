import { EmbedBuilder } from "discord.js";
import fs from "fs";
import path from "node:path";
import { fileURLToPath } from "url";
import config from "../../config.json" assert { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Liste des catégories (doit correspondre aux dossiers dans Commands)
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
	name: "exemple",
	helpname: "exemple",
	description: "Affiche toutes les commandes d’une catégorie en embed",
	aliases: ["cat", "commands"],
	help: "exemple [catégorie]",
	run: async (bot, message, args) => {
		if (!args[0]) {
			return message.reply(
				`Veuillez préciser une catégorie : \`${categories.join("`, `")}\``
			);
		}

		const category = categories.find(
			(c) => c.toLowerCase() === args[0].toLowerCase()
		);
		if (!category)
			return message.reply("Cette catégorie n'existe pas.");

		const dir = path.join(__dirname, `../../Commands/${category}`);
		if (!fs.existsSync(dir))
			return message.reply("Aucune commande trouvée pour cette catégorie.");

		const cmds = [];
		for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".js"))) {
			const cmd = (await import(`../../Commands/${category}/${file}`)).command;
			cmds.push(
				`\`${config.prefix}${cmd.helpname || cmd.name}\` - ${cmd.description || "Aucune description"}`
			);
		}

		if (cmds.length === 0)
			return message.reply("Aucune commande disponible dans cette catégorie.");

		const embed = new EmbedBuilder()
			.setTitle(`Commandes de la catégorie : ${category}`)
			.setDescription(cmds.join("\n"))
			.setColor(config.color)
			.setFooter({ text: `Utilisez ${config.prefix}help [commande] pour plus d'infos` });

		message.reply({ embeds: [embed] });
	},
};

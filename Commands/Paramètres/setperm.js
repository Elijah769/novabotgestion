import { EmbedBuilder } from "discord.js";
import db from "../../Events/loadDatabase.js";
import config from "../../config.json" assert { type: "json" };

export const command = {
	name: "setperm",
	helpname: "setperm <permission> <@role>",
	description: "Lie un rôle à une permission",
	help: "setperm <permission> <@role>",
	run: async (bot, message, args) => {

		/* ========= CHECK ARGS ========= */
		if (!args[0] || !args[1]) {
			return message.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(config.color)
						.setDescription(` \`${config.prefix}setperm <permission> <@role>\``)
				]
			});
		}

		const perm = parseInt(args[0]);
		if (isNaN(perm) || perm < 1 || perm > 12) {
			return message.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(config.color)
						.setDescription("La permission doit être entre **1 et 12**.")
				]
			});
		}

		const role =
			message.mentions.roles.first() ||
			message.guild.roles.cache.find(r =>
				r.name.toLowerCase() === args.slice(1).join(" ").toLowerCase()
			);

		if (!role) {
			return message.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(config.color)
						.setDescription(" Rôle invalide.")
				]
			});
		}

		/* ========= INSERT / UPDATE ========= */
		db.get(
			"SELECT perm FROM permissions WHERE id = ? AND guild = ?",
			[role.id, message.guild.id],
			(err, row) => {
				if (err) {
					console.error(err);
					return message.reply(" Erreur base de données.");
				}

				if (row) {
					// UPDATE
					db.run(
						"UPDATE permissions SET perm = ? WHERE id = ? AND guild = ?",
						[perm, role.id, message.guild.id],
						() => {
							message.reply({
								embeds: [
									new EmbedBuilder()
										.setColor(config.color)
										.setDescription(
											` La permission du rôle ${role} a été mise à **${perm}**.`
										)
								]
							});
						}
					);
				} else {
					// INSERT
					db.run(
						"INSERT INTO permissions (perm, id, guild) VALUES (?, ?, ?)",
						[perm, role.id, message.guild.id],
						() => {
							message.reply({
								embeds: [
									new EmbedBuilder()
										.setColor(config.color)
										.setDescription(
											` Le rôle ${role} est maintenant lié à la permission **${perm}**.`
										)
								]
							});
						}
					);
				}
			}
		);
	}
};

import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from "lib/command";
import { EmbedColor } from "lib/config";
import { CaseModel } from "models/Case";
import dayjs from "dayjs";

const description = "Manages the server's moderation cases.";

const _case: InteractionCommand = {
	data: new SlashCommandBuilder()
		.addSubcommand(cmd =>
			cmd
				.addIntegerOption(option =>
					option
						.setName("case-number")
						.setDescription("The case number of the case to display.")
						.setRequired(true)
				)
				.setName("get")
				.setDescription("Displays the information of a specific case.")
		)
		.addSubcommand(cmd =>
			cmd
				.addIntegerOption(option =>
					option
						.setName("case-number")
						.setDescription("The case number of the case to modify.")
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName("reason")
						.setDescription("The new reason of the case.")
						.setRequired(true)
				)
				.setName("modify")
				.setDescription("Modifies the reason of a specific case.")
		)
		.addSubcommand(cmd =>
			cmd
				.addIntegerOption(option =>
					option
						.setName("case-number")
						.setDescription("The case number of the case to delete.")
						.setRequired(true)
				)
				.setName("delete")
				.setDescription("Deletes a specific case.")
		)
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setName("case")
		.setDescription(description),
	exec: async (client, interaction) => {
		if (!(interaction instanceof ChatInputCommandInteraction)) {
			return { error: "Invalid Interaction Type" };
		}

		const permLevel = client.permLevel(interaction.member);
		const subcmd = interaction.options.getSubcommand();

		const adminOnly = ["modify", "delete"];
		const staffOnly = ["get"];

		if ((permLevel < 2 && adminOnly.includes(subcmd)) || (permLevel < 1 && staffOnly.includes(subcmd))) {
			return { error: "Insufficient permissions", ephemeral: true };
		}

		const number = interaction.options.getInteger("case-number", true);

		if (subcmd == "get") {
			const _case = await CaseModel.findOne({ guildId: interaction.guild.id, caseNumber: number });

			if (_case) {
				const target = await client.users.fetch(_case.targetId);
				const moderator = await client.users.fetch(_case.moderatorId);
				const issuedAt = Math.trunc(_case.createdAt / 1000);

				return {
					embeds: [client.simpleEmbed({
						title: `Case ${number}`,
						color: EmbedColor.Neutral,
					}).setFields(
						{ name: "Target", value: `${target} (${_case.targetId})` },
						{ name: "Moderator", value: `${moderator} (${_case.moderatorId})` },
						{ name: "Type", value: _case.caseType, inline: true },
						{ name: "Issued at", value: `<t:${issuedAt}:f>`, inline: true },
						{ name: "Reason", value: _case.reason },
					)]
				};
			} else {
				return { error: `Case number \`${number}\` does not exist` };
			}
		} else if (subcmd == "modify") {
			const reason = interaction.options.getString("reason", true);
			const _case = await CaseModel.findOneAndUpdate(
				{ guildId: interaction.guild.id, caseNumber: number },
				{ reason: reason },
			);

			if (_case) {
				const logChannelId = interaction.settings.events.find(v => v.event == "caseUpdate")?.channel;

				if (logChannelId) {
					const logChannel = await interaction.guild.channels.fetch(logChannelId);

					if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased()) {
						await logChannel.send({
							embeds: [client.simpleEmbed({
								description: `Case ${number} modified by ${interaction.user}`,
								footer: `Case number ${number} · User ID: ${
									interaction.user.id
								} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
								color: EmbedColor.Neutral,
							}).setFields(
								{ name: "Old Reason", value: `\`\`\`${_case.reason}\`\`\`` },
								{ name: "New Reason", value: `\`\`\`${reason}\`\`\`` },
							)]
						});
					}
				}

				return {
					embeds: [client.simpleEmbed({
						description: `Modified case number ${number}`,
						color: EmbedColor.Success,
					})],
				};
			} else {
				return { error: `Case number \`${number}\` does not exist` };
			}
		} else if (subcmd == "delete") {
			const _case = await CaseModel.findOneAndDelete({
				guildId: interaction.guild.id,
				caseNumber: number
			});

			if (_case) {
				const logChannelId = interaction.settings.events.find(v => v.event == "caseDelete")?.channel;

				if (logChannelId) {
					const logChannel = await interaction.guild.channels.fetch(logChannelId);

					if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased()) {
						await logChannel.send({
							embeds: [client.simpleEmbed({
								description: `Case ${number} deleted by ${interaction.user}`,
								footer: `Case number ${number} · User ID: ${interaction.user.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
								color: EmbedColor.Neutral,
							})]
						});
					}
				}

				return {
					embeds: [client.simpleEmbed({
						description: `Deleted case number ${number}`,
						color: EmbedColor.Success,
					})]
				};
			} else {
				return { error: `Case number \`${number}\` does not exist` };
			}
		}

		return { error: "Unknown Error", ephemeral: true };
	},
	help: {
		subcommands: ["get", "modify", "delete"],
		description,
		category: "Moderation",
	},
};

export default _case;

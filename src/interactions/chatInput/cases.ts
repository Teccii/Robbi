import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { EmbedColor } from "lib/config";
import { InteractionCommand } from "lib/command";
import { CaseModel } from "models/Case";

const description = "Looks up a user's cases.";

const cases: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("The target user.")
                .setRequired(true)
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName("cases")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const user = interaction.options.getUser("user", true);
        const cases = await CaseModel.find({ guildId: interaction.guild.id, targetId: user.id });

        if (cases.length == 0) {
            return {
                embeds: [client.simpleEmbed({
                    title: `Cases for ${user.username}`,
                    description: `This user has not been the target of any case`,
                    color: EmbedColor.Neutral,
                })]
            };
        }

        let embed = client.simpleEmbed({
            title: `Cases for ${user.username}`,
            color: EmbedColor.Neutral,
        });

        cases.sort((a, b) => b.caseNumber - a.caseNumber);

        for (const [i, _case] of cases.entries()) {
            if (i == 23) {
                const remainingCases = cases.slice(23, cases.length - 1).map(c => `\`${c.caseNumber}\``).join(", ");
                const lastCase = cases[cases.length - 1];

                embed = embed.addFields({
                    name: "To be continued...",
                    value: `This user also has cases ${remainingCases} and \`${lastCase.caseNumber}\``
                });

                break;
            }

            const moderator = (await interaction.guild.members.fetch(_case.moderatorId)).user;
            const issuedAt = Math.trunc(_case.createdAt / 1000);

            let field = `**Moderator**: ${moderator.username} (${moderator.id})\n**Type**: ${_case.caseType}\n**Reason**: ${_case.reason}\n**Issued at**: <t:${issuedAt}:f>`;

            if (_case.duration) {
                const minute = 60;
                const hour = minute * 60;
                const day = hour * 24;
                const month = day * (365 / 12);
                const year = day * 365;

                const years = Math.floor(_case.duration / year);
                const months = Math.floor((_case.duration % year) / month);
                const days = Math.floor(((_case.duration % year) % month) / day);
                const hours = Math.floor((_case.duration % day) / hour);
                const minutes = Math.floor((_case.duration % hour) / minute);
                const seconds = Math.floor(_case.duration % minute);

                let duration = "";

                if (years !== 0) {
                    duration += `${years}y `;
                }

                if (months !== 0) {
                    duration += `${months}M `;
                }

                if (days !== 0) {
                    duration += `${days}d `;
                }

                if (hours !== 0) {
                    duration += `${hours}hs `;
                }

                if (minutes !== 0) {
                    duration += `${minutes}m `;
                }

                if (seconds !== 0) {
                    duration += `${seconds}s`;
                }

                field += `\n**Duration**: ${duration}\n**Expires at**: <t:${_case.expiresAt!}:f>`;
            }

            embed = embed.addFields({ name: `Case ${_case.caseNumber}`, value: field, inline: true });
        }

        return { embeds: [embed] };
    },
    help: {
        subcommands: [],
        description,
        category: "Moderation"
    }
};

export default cases;
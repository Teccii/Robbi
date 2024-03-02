import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from "lib/command";
import { EmbedColor } from "lib/config";
import { durationToString } from "lib/time";
import { ReminderModel } from "models/Reminder";

const description = "Lists all active reminders.";

const ping: InteractionCommand = {
    data: new SlashCommandBuilder()
        .setName("reminders")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const reminders = await ReminderModel.find({
            guildId: interaction.guild.id,
            userId: interaction.user.id,
        });

        if (reminders.length == 0) {
            return {
                embeds: [client.simpleEmbed({
                    title: `Reminders for ${interaction.user.username}`,
                    description: `You have no active reminders`,
                    color: EmbedColor.Neutral,
                })]
            };
        }

        let embed = client.simpleEmbed({
            title: `Reminders for ${interaction.user.username}`,
            color: EmbedColor.Neutral,
        });

        reminders.sort((a, b) => a.expiresAt - b.expiresAt);

        for (const [i, reminder] of reminders.entries()) {
            if (i == 23) {
                embed = embed.addFields({
                    name: "To be continued...",
                    value: `You also have ${reminders.length - 23} more reminder(s).`
                });
            }

            embed = embed.addFields({
                name: `Reminder ${i + 1}`,
                value: `**Reason**: \`\`\`${reminder.reason}\`\`\`\n**Started**: <t:${Math.trunc(reminder.createdAt / 1000)}:f>\n**Ends**: <t:${reminder.expiresAt}:R>\n**Duration**: ${durationToString(reminder.duration)}`
            });
        }

        return {
            embeds: [embed]
        };
    },
    help: {
        subcommands: [],
        description,
        category: "Information"
    }
};

export default ping;
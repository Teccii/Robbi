import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { EmbedColor } from "lib/config";
import { InteractionCommand } from "lib/command";

const description = "Displays information about the bot's commands.";

const help: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addStringOption(option =>
            option
                .setRequired(false)
                .setName("command")
                .setDescription("The command.")
        )
        .setName("help")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const _cmd = interaction.options.getString("command", false);

        if (_cmd) {
            const cmd = client.commands.get(_cmd);

            if (cmd) {
                let embed = client.simpleEmbed({
                    title: `Help: /${_cmd}`,
                    color: EmbedColor.Neutral,
                });

                if (cmd.help.subcommands.length != 0) {
                    const subcommands = cmd.help.subcommands.map(v => `\`${v}\``).join(", ");

                    embed = embed.addFields({
                        name: "Subcommands",
                        value: subcommands,
                    });
                }

                embed = embed.addFields(
                    { name: "Description", value: cmd.help.description },
                    { name: "Category", value: cmd.help.category },
                );

                return { embeds: [embed] };
            } else {
                return { error: `No command with the name \`${_cmd}\` exists` }
            }
        } else {
            const cmds: Map<string, string[]> = new Map();

            for (const [key, cmd] of client.commands) {
                if (cmds.get(cmd.help.category)) {
                    cmds.get(cmd.help.category)?.push(key);
                } else {
                    cmds.set(cmd.help.category, [key]);
                }
            }

            let embed = client.simpleEmbed({
                title: "Commands",
                color: EmbedColor.Neutral,
            });

            cmds.forEach((commands, category) => {
                embed = embed.addFields({
                    name: category,
                    value: commands.map(v => `\`${v}\``).join(", "),
                });
            });

            return { embeds: [embed] };
        }
    },
    help: {
        subcommands: [],
        description,
        category: "Information"
    }
};

export default help;
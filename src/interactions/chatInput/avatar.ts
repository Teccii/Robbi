import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from "lib/command";
import { EmbedColor } from "lib/config";

const description = "Gets the avatar of a specific user."

const avatar: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("The target user.")
                .setRequired(true)
        )
        .setName("avatar")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }


        const member = interaction.options.getMember("user");

        if (!member) {
            const user = interaction.options.getUser("user", true);

            return {
                embeds: [client.simpleEmbed({
                    title: `${user.username}'s Avatar`,
                    color: EmbedColor.Neutral
                }).setImage(user.avatarURL())]
            }
        }

        const user = member.user;
        const globalUrl = user.avatarURL();
        const serverUrl = member.avatarURL();

        if (globalUrl && serverUrl && globalUrl !== serverUrl) {
            return {
                embeds: [
                    client.simpleEmbed({
                        title: `${user.username}'s Avatar`,
                        color: EmbedColor.Neutral,
                    }).setImage(globalUrl),
                    client.simpleEmbed({
                        title: `${user.username}'s Server Avatar`,
                        color: EmbedColor.Neutral
                    }).setImage(serverUrl),
                ]
            };
        } else if (globalUrl) {
            return {
                embeds: [client.simpleEmbed({
                    title: `${user.username}'s Avatar`,
                    color: EmbedColor.Neutral,
                }).setImage(globalUrl)]
            };
        } else {
            return { errors: `Failed to get ${user.username}'s avatar` };
        }
    },
    help: {
        subcommands: [],
        description,
        category: "Information"
    }
};

export default avatar;
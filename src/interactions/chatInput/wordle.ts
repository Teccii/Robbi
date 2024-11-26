import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from "lib/command";
import {
    getWordleOngoingEmbed,
    getWordleCanceledEmbed,
    getWordleLossEmbed,
    getWordleVictoryEmbed
} from "lib/wordle";
import { WordleModel } from "models/Wordle";
import words from "../../../words.json";
import _ from "lodash";

const description = "Play Wordle!";

const wordle: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addSubcommand(subcmd =>
            subcmd
                .setName("start")
                .setDescription("Start a new game of Wordle.")
        )
        .addSubcommand(subcmd =>
            subcmd
                .setName("stop")
                .setDescription("Stop a game of Wordle.")
        )
        .addSubcommand(subcmd =>
            subcmd
                .addStringOption(option =>
                    option
                        .setMaxLength(5)
                        .setMinLength(5)
                        .setRequired(true)
                        .setName("word")
                        .setDescription("The word to guess.")
                )
                .setName("guess")
                .setDescription("Guess a word.")
        )
        .setDMPermission(false)
        .setName("wordle")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const subcmd = interaction.options.getSubcommand(true);
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        if (subcmd == "guess") {
            const word = interaction.options.getString("word", true).trim().toLowerCase();

            if (!words.includes(word)) {
                return { error: `${word} is not a valid word to guess.`, ephemeral: true };
            }

            const endsAt = Math.trunc(Date.now() / 1000) + 30 * 60;

            const wordle = await WordleModel.findOneAndUpdate(
                { guildId, userId },
                { $push: { guesses: word }, endsAt },
                { new: true }
            );

            if (wordle) {
                if (word == wordle.answer) {
                    await interaction.reply({
                        embeds: [await getWordleVictoryEmbed(client, interaction.user.displayName, interaction.user.id, wordle.answer, wordle.guesses)]
                    });
                    await wordle.deleteOne();
                } else if (wordle.guesses.length >= 6) {
                    await interaction.reply({
                        embeds: [await getWordleLossEmbed(client, interaction.user.displayName, interaction.user.id, wordle.answer, wordle.guesses)]
                    });
                    await wordle.deleteOne();
                } else {
                    return {
                        embeds: [getWordleOngoingEmbed(client, interaction.user.displayName, wordle.answer, wordle.guesses)]
                    }
                }
            } else {
                return { error: "You don't have an ongoing Wordle game." };
            }
        } else if (subcmd == "start") {
            if (await WordleModel.exists({ guildId, userId })) {
                return { error: "You already have an ongoing Wordle game." };
            } else {
                try {
                    const endsAt = Math.trunc(Date.now() / 1000) + 30 * 60;

                    const wordle = await new WordleModel({
                        guildId,
                        userId,
                        guesses: [],
                        answer: _.sample(words),
                        endsAt
                    }).save();
    
                    return {
                        embeds: [getWordleOngoingEmbed(client, interaction.user.displayName, wordle.answer, wordle.guesses)]
                    };
                } catch (e) {
                    console.log(e);
                }
            }
        } else if (subcmd == "stop") {
            const wordle = await WordleModel.findOneAndDelete({ guildId, userId });

            if (wordle) {
                return {
                    embeds: [await getWordleCanceledEmbed(client, interaction.user.displayName, interaction.user.id, wordle.answer, wordle.guesses)]
                };
            } else {
                return { error: "You don't have an ongoing Wordle game." };
            }
        }

        return { };
    },
    help: {
        subcommands: [ "start", "stop", "guess" ],
        description,
        category: "Fun"
    }
};

export default wordle;
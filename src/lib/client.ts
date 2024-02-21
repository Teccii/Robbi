import {
    Client,
    ClientOptions,
    Collection,
    EmbedBuilder,
    REST,
    Routes
} from "discord.js";
import { AutocompleteOptionGenerators, InteractionCommand } from "./command";
import ClientConfig, { EmbedColor } from "./config";
import { ISettings } from "models/Settings";
import { CounterModel } from "models/Counter";
import { CooldownHandler } from "./cooldownHandler";
import { readdirSync } from "fs";
import { readdir } from "fs/promises";
import { join, resolve } from "path";
import { error, load } from "lib/log";
import Event from "./event";
import dayjs from "dayjs";


export default class CustomClient extends Client {
    commands: Collection<string, InteractionCommand>;
    autocompleteOptions: Collection<string, AutocompleteOptionGenerators>;
    cooldownHandler: CooldownHandler;
    settings: Collection<string, ISettings>;
    config: ClientConfig;

    constructor (config: ClientConfig, options: ClientOptions) {
        super(options);

        this.commands = new Collection();
        this.autocompleteOptions = new Collection();
        this.cooldownHandler = new CooldownHandler();
        this.settings = new Collection();
        this.config = config;
    }

    simpleEmbed(options: { title?: string, description?: string, color?: EmbedColor, footer?: string }): EmbedBuilder {
        let color = this.config.embedColors.neutral;

        if (options.color) {
            if (options.color == EmbedColor.Success) {
                color = this.config.embedColors.success;
            } else if (options.color == EmbedColor.Warning) {
                color = this.config.embedColors.warning;
            } else if (options.color == EmbedColor.Error) {
                color = this.config.embedColors.error;
            }
        }

        let embed = new EmbedBuilder().setColor(color);

        if (options.title) {
            embed = embed.setTitle(options.title);
        }

        if (options.description) {
            embed = embed.setDescription(options.description);
        }

        if (options.footer) {
            embed = embed.setFooter({ text: options.footer });
        }

        return embed;
    }

    simpleError(error: string): EmbedBuilder {
        return this.simpleEmbed({
            description: error,
            footer: dayjs().format("DD/MM/YYYY HH:mm"),
            color: EmbedColor.Error,
        });
    }

    async nextCounter(id: string): Promise<number> {
        return (await CounterModel.findOneAndUpdate(
            { _id: id },
            { $inc: { index: 1 } },
            { upsert: true, setDefaultsOnInsert: true, new: true }
        )).index;
    }

    loadEvents() {
        load("Loading events...");

        const files = readdirSync(join(__dirname, "..", "events"));
        let count = 0;

        for (const file of files.filter(f => f.endsWith(".ts") || f.endsWith(".js"))) {
            const path = join(__dirname, "..", "events", file);

            this.loadEvent(path);

            count++;
        }

        load(`Successfully loaded ${count} event(s)!`);
    }

    private loadEvent(path: string) {
        try {
            const event: Event = require(path).default;

            if (event.once) {
                this.once(event.name, (...args) => event.exec(this, ...args));
            } else {
                this.on(event.name, (...args) => event.exec(this, ...args));
            }
        } catch (e) {
            error(`Caught an error while trying to load event: ${e}`);
        }
    }

    async loadCommands() {
        load("Loading commands...");

        const folders = await readdir(join(__dirname, "..", "interactions"));
        let count = 0;

        for (const folder of folders) {
            const files = await readdir(join(__dirname, "..", "interactions", folder));

            for (const file of files.filter(f => f.endsWith(".ts") || f.endsWith(".js"))) {
                const path = join(__dirname, "..", "interactions", folder, file);

                this.loadCommand(path);

                count++;
            }
        }

        load(`Successfully loaded ${count} command(s)!`);
    }

    loadCommand(path: string) {
        try {
            const command: InteractionCommand = require(path).default;
            const data = command.data.toJSON();

            this.commands.set(data.name, command);

            if (command.autocompleteOptions) {
                this.autocompleteOptions.set(data.name, command.autocompleteOptions);
            }
        } catch (e) {
            error(`Caught an error while trying to load command: ${e}`)
        }
    }

    async refreshCommands() {
        const commands = this.commands.map(cmd => cmd.data);
        const count = commands.length;
        const rest = new REST().setToken(process.env.token!);

        try {
            load("Refreshing commands...");

            await rest.put(
                Routes.applicationCommands(this.user!.id),
                { body: commands }
            );

            load(`Successfully refreshed ${count} command(s)!`);
        } catch (e) {
            error(`Caught an error while trying to refresh commands: ${e}`)
        }
    }
}
import {
  Client,
  ClientOptions,
  Collection,
  EmbedBuilder,
  GuildMember,
  REST,
  Routes,
} from "discord.js";
import { AutocompleteOptionGenerators, InteractionCommand } from "./command";
import ClientConfig, { EmbedColor } from "./config";
import { ContentFilter, ISettings } from "models/Settings";
import { CounterModel } from "models/Counter";
import { readdirSync } from "fs";
import { readdir } from "fs/promises";
import { join } from "path";
import { error, load } from "lib/log";
import Event from "./event";
import { CooldownModel, ICooldown } from "models/Cooldown";
import {ChatSession, GenerativeModel, HarmBlockThreshold, HarmCategory, VertexAI } from "@google-cloud/vertexai";
import credentials from "../../gemini-credentials.json"

export default class CustomClient extends Client {
  commands: Collection<string, InteractionCommand>;
  autocompleteOptions: Collection<string, AutocompleteOptionGenerators>;
  settings: Collection<string, ISettings>;
  config: ClientConfig;
  chats: Collection<string, ChatSession>;
  private genModel: GenerativeModel;

  constructor(config: ClientConfig, options: ClientOptions) {
    super(options);

    this.commands = new Collection();
    this.autocompleteOptions = new Collection();
    this.settings = new Collection();
    this.config = config;

    // Initialize Vertex AI stuff
    const vertexAi = new VertexAI({project: credentials.project_id, location: 'europe-west3', googleAuthOptions: { credentials }});
    const genModel = vertexAi.getGenerativeModel({model: "gemini-1.0-pro"});
    this.genModel = genModel;
    this.chats = new Collection();
  }

  simpleEmbed(options: {
    title?: string;
    description?: string;
    color?: EmbedColor;
    footer?: string;
  }): EmbedBuilder {
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
      color: EmbedColor.Error,
    });
  }

  permLevel(member: GuildMember | undefined): number {
    if (!member) {
      return 0;
    }

    const settings = this.settings.get(member.guild.id);

    if (settings) {
      member.settings = settings;
    }

    for (const permLevel of this.config.permLevels.sort(
      (a, b) => b.level - a.level
    )) {
      if (permLevel.check(member)) {
        return permLevel.level;
      }
    }

    return 0;
  }

  async nextCounter(id: string): Promise<number> {
    return (await CounterModel.findOneAndUpdate(
        { _id: id },
        { $inc: { index: 1 } },
        { upsert: true, setDefaultsOnInsert: true, new: true }
    )).index;
  }

  async getCooldown(id: string): Promise<ICooldown | null> {
    return CooldownModel.findOne({ _id: id });
  }

  async addCooldown(id: string, duration: number): Promise<ICooldown> {
    return await new CooldownModel({
      _id: id,
      duration,
      endsAt: Math.trunc(Date.now() / 1000) + duration
    }).save();
  }

  async removeCooldown(id: string) {
    await CooldownModel.deleteOne({ _id: id });
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
      error(`Caught an error while trying to load command: ${e}`);
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
      error(`Caught an error while trying to refresh commands: ${e}`);
    }
  }

  newChat(guildId: string): boolean {
    const settings = this.settings.get(guildId);

    if (!settings) {
      return false;
    }

    let threshold = HarmBlockThreshold.BLOCK_NONE;
    
    switch (settings.ai.contentFilter) {
      case ContentFilter.None: {
        threshold = HarmBlockThreshold.BLOCK_NONE;
        break;
      }

      case ContentFilter.Low: {
        threshold = HarmBlockThreshold.BLOCK_ONLY_HIGH;
        break;
      }

      case ContentFilter.Medium: {
        threshold = HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE;
        break;
      }

      case ContentFilter.High: {
        threshold = HarmBlockThreshold.BLOCK_LOW_AND_ABOVE;
        break;
      }
    }

    const chat = this.genModel.startChat({
      safety_settings: [
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold },
        { category: HarmCategory.HARM_CATEGORY_UNSPECIFIED, threshold },
      ],
      generation_config: {
        temperature: settings.ai.temperature,
      }
    });

    const prompt = settings.ai.prompt;

    if (prompt) {
      chat.sendMessage(prompt);
    }

    this.chats.set(guildId, chat);

    return true;
  }
}

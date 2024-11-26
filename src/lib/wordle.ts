import { EmbedBuilder } from "discord.js";
import CustomClient from "./client";
import { EmbedColor } from "./config";

const greenChars: {[key: string]: string} = {
    "a": "<:Green_A:1309204215620698203>",
    "b": "<:Green_B:1309204235325538334>",
    "c": "<:Green_C:1309204249887899801>",
    "d": "<:Green_D:1309204260319268914>",
    "e": "<:Green_E:1309204269794197600>",
    "f": "<:Green_F:1309204282721177711>",
    "g": "<:Green_G:1309204292950954015>",
    "h": "<:Green_H:1309204303839498280>",
    "i": "<:Green_I:1309204313255448628>",
    "j": "<:Green_J:1309204321778270270>",
    "k": "<:Green_K:1309204330435313716>",
    "l": "<:Green_L:1309204340593922070>",
    "m": "<:Green_M:1309204349091840030>",
    "n": "<:Green_N:1309204358310658119>",
    "o": "<:Green_O:1309204367731068969>",
    "p": "<:Green_P:1309204377688608859>",
    "q": "<:Green_Q:1309204387993882674>",
    "r": "<:Green_R:1309204397414158529>",
    "s": "<:Green_S:1309204406541090878>",
    "t": "<:Green_T:1309204420499607622>",
    "u": "<:Green_U:1309204429588791426>",
    "v": "<:Green_V:1309204442255458475>",
    "w": "<:Green_W:1309204460471455896>",
    "x": "<:Green_X:1309204481795428362>",
    "y": "<:Green_Y:1309204493228965939>",
    "z": "<:Green_Z:1309204506285965412>",
}

const yellowChars: {[key: string]: string} = {
    "a": "<:Yellow_A:1309206807985655830>",
    "b": "<:Yellow_B:1309206821994758144>",
    "c": "<:Yellow_C:1309206835936628778>",
    "d": "<:Yellow_D:1309206846535368846>",
    "e": "<:Yellow_E:1309206861412696066>",
    "f": "<:Yellow_F:1309206874679283782>",
    "g": "<:Yellow_G:1309206900809793606>",
    "h": "<:Yellow_H:1309206920015642785>",
    "i": "<:Yellow_I:1309206938286030919>",
    "j": "<:Yellow_J:1309206967318876181>",
    "k": "<:Yellow_K:1309206984041566298>",
    "l": "<:Yellow_L:1309207012462039121>",
    "m": "<:Yellow_M:1309207028090011688>",
    "n": "<:Yellow_N:1309207043382706227>",
    "o": "<:Yellow_O:1309207054514257953>",
    "p": "<:Yellow_P:1309207065457332344>",
    "q": "<:Yellow_Q:1309209081952731186>",
    "r": "<:Yellow_R:1309209095454064691>",
    "s": "<:Yellow_S:1309209113489571982>",
    "t": "<:Yellow_T:1309209123958689792>",
    "u": "<:Yellow_U:1309209136801648660>",
    "v": "<:Yellow_V:1309209149950787636>",
    "w": "<:Yellow_W:1309209161044594708>",
    "x": "<:Yellow_X:1309209171773620236>",
    "y": "<:Yellow_Y:1309209184029376513>",
    "z": "<:Yellow_Z:1309209201289199647>",
}

const greyChars: {[key: string]: string} = {
    "a": "<:Grey_A:1309206430741696553>",
    "b": "<:Grey_B:1309206442204467210>",
    "c": "<:Grey_C:1309206455915773975>",
    "d": "<:Grey_D:1309206467169095750>",
    "e": "<:Grey_E:1309206478275481600>",
    "f": "<:Grey_F:1309206488404852736>",
    "g": "<:Grey_G:1309206502711627927>",
    "h": "<:Grey_H:1309206513931386900>",
    "i": "<:Grey_I:1309206525340024842>",
    "j": "<:Grey_J:1309206540602834994>",
    "k": "<:Grey_K:1309206553861296190>",
    "l": "<:Grey_L:1309206568499281950>",
    "m": "<:Grey_M:1309206581921054882>",
    "n": "<:Grey_N:1309206595754000525>",
    "o": "<:Grey_O:1309206623092215879>",
    "p": "<:Grey_P:1309206649960923268>",
    "q": "<:Grey_Q:1309206660929032243>",
    "r": "<:Grey_R:1309206675579863090>",
    "s": "<:Grey_S:1309206689647431822>",
    "t": "<:Grey_T:1309206703702671411>",
    "u": "<:Grey_U:1309206723608707163>",
    "v": "<:Grey_V:1309206740100714638>",
    "w": "<:Grey_W:1309206750989254666>",
    "x": "<:Grey_X:1309206764213895308>",
    "y": "<:Grey_Y:1309206776734023741>",
    "z": "<:Grey_Z:1309206786229796965>",
}

function replaceAt(str: string, index: number, replaceWith: string): string {
    return str.substring(0, index) + replaceWith + str.substring(index + replaceWith.length);
}

export function getWordleOngoingEmbed(client: CustomClient, username: string, answer: string, guesses: string[]): EmbedBuilder {
    return client.simpleEmbed({
        footer: "Do /wordle guess to guess a word!",
        color: EmbedColor.Neutral,
    }).setFields(getFields(username, answer, guesses));
}

export async function getWordleCanceledEmbed(client: CustomClient, username: string, userId: string, answer: string, guesses: string[]): Promise<EmbedBuilder> {
    const fields = getFields(username, answer, guesses);
    fields[0].value += `\n Game canceled! The word was ${answer}`;

    await client.resetCounter(`${userId}-wordle`);

    return client.simpleEmbed({
        footer: "Winstreak reset!",
        color: EmbedColor.Neutral,
    }).setFields(fields);
}

export async function getWordleLossEmbed(client: CustomClient, username: string, userId: string, answer: string, guesses: string[]): Promise<EmbedBuilder> {
    const fields = getFields(username, answer, guesses);
    fields[0].value += `\n You lost! The word was ${answer}`;

    await client.resetCounter(`${userId}-wordle`);

    return client.simpleEmbed({
        footer: `Winstreak reset!`,
        color: EmbedColor.Error,
    }).setFields(fields);
}


export async function getWordleVictoryEmbed(client: CustomClient, username: string, userId: string, answer: string, guesses: string[]): Promise<EmbedBuilder> {    
    const fields = getFields(username, answer, guesses);
    fields[0].value += `\n You won! The word was ${answer}`;
    
    return client.simpleEmbed({
        footer: `Winstreak: ${await client.nextCounter(`${userId}-wordle`)}`,
        color: EmbedColor.Success,
    }).setFields(fields);
}

function getFields(username: string, answer: string, guesses: string[]): { name: string, value: string }[] {
    let desc = "";
    const letters: string[] = [];

    //assume it's valid and 5 letters
    for (const guess of guesses) {
        //fuck this tbh
        const emojis = ["", "", "", "", "", ""];
        let _answer = answer;

        //mark the correct ones and remove them from the answer
        for (let i = 0; i < 5; i++) {
            if (guess[i] == _answer[i]) {
                emojis[i] = greenChars[guess[i]];
                _answer = replaceAt(_answer, i, "-");
            }
        }

        //mark the ones that are there but not in the correct position
        for (let i = 0; i < 5; i++) {
            if (_answer.includes(guess[i]) && emojis[i] == "") {
                emojis[i] = yellowChars[guess[i]];
                _answer = replaceAt(_answer, _answer.indexOf(guess[i]), "-");
            }
        }

        //mark the ones that ain't there
        for (let i = 0; i < 5; i++){
            if (emojis[i] == "") {
                emojis[i] = greyChars[guess[i]];
                
                if (!letters.includes(guess[i])) {
                    letters.push(guess[i]);
                }
            }
        }

        desc += `${emojis.join("")}\n`
    }

    const rowsLeft = 6 - guesses.length;

    for (let i = 0; i < rowsLeft; i++) {
        desc += `${"<:Grey_Empty:1309229812698845194>".repeat(5)}\n`;
    }

    const fields = [{ name: `${username}'s Wordle Game`, value: desc}];

    if (letters.length > 0) {
        fields.push({ name: "Excluded Letters", value: letters.join(" ")});
    }

    return fields;
}
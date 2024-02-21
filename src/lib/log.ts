import colors from "colors";
import dayjs from "dayjs";

export function log(
    label: string,
    color: colors.Color,
    message: string,
) {
    const date = colors.blue.bold(dayjs().format("DD/MM/YY HH:mm:ss.SSS"));
    const _label = color(label.toUpperCase());

    console.log(`[${date}] [${_label}] ${message}`);
}

export function info(label: string, message: string) {
    log(label, colors.magenta, message);
}

export function load(message: string) {
    log("load", colors.green, message);
}

export function warning(message: string) {
    log("warning", colors.yellow, message);
}

export function error(message: string) {
    log("error", colors.red, message);
}
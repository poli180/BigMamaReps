import { hash } from "bcryptjs";
import readline from "node:readline";
import { Writable } from "node:stream";
if (!process.stdin.isTTY)
  throw new Error("Bitte in einem interaktiven Terminal starten.");
let mute = false;
const output = new Writable({
  write(chunk, encoding, done) {
    if (!mute) process.stdout.write(chunk, encoding);
    done();
  },
});
const rl = readline.createInterface({
  input: process.stdin,
  output,
  terminal: true,
});
rl.question(
  "Neues Admin-Passwort (mindestens 14 Zeichen, Eingabe verborgen): ",
  async (password) => {
    mute = false;
    rl.close();
    if (password.length < 14 || Buffer.byteLength(password, "utf8") > 72) {
      console.error(
        "\nPasswort muss mindestens 14 Zeichen und maximal 72 UTF-8-Bytes lang sein.",
      );
      process.exitCode = 1;
      return;
    }
    console.log("\nADMIN_PASSWORD_HASH=" + (await hash(password, 12)));
  },
);
mute = true;

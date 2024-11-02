import WebTorrent from 'webtorrent-hybrid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cliProgress from 'cli-progress';
import chalk from 'chalk';

const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const torrentID = process.argv[2]; // get the torrent ID from the command line
const customPath = process.argv[3]; // create a folder name or a custom path
console.log(chalk.yellow('Recieved Torrent link or location: '), torrentID);

const client = new WebTorrent();

// Specify the folder to save files
const outputDir = path.isAbsolute(customPath) ? customPath : path.join(__dirname, customPath);
console.log(chalk.yellow('creating in Path: ', outputDir));

// Create the folder if it doesn't exist
if (!fs.existsSync(outputDir, { recursive: true })) {
    console.log(chalk.yellow('created: ', outputDir));
    fs.mkdirSync(outputDir);
}

try {
    console.log(chalk.greenBright('Starting torrent download...'));
    client.add(torrentID, torrent => {
        const files = torrent.files;
        let length = files.length;

        console.info(chalk.green("Number of files to be downloaded: "), length);
        bar.start(100, 0)
        let interval = setInterval(() => {
            // console.log("Progress: ", (torrent.progress * 100).toFixed(), "%")
            bar.update((torrent.progress * 100))
        }, 5000) // every 5 seconds

        files.forEach(file => {
            const source = file.createReadStream();
            const destinationPath = path.join(outputDir, file.name);
            const destination = fs.createWriteStream(destinationPath);

            source.on('error', err => {
                console.error(chalk.redBright(`Error reading file ${file.name}:\t`), err);
            });

            destination.on('error', err => {
                console.error(chalk.redBright(`Error writing file ${file.name}:\t`), err);
            });

            destination.on('finish', () => {
                length -= 1;
                if (length === 0) {
                    bar.update(100);
                    bar.stop();
                    clearInterval(interval);
                    console.log(chalk.greenBright("\n All files processed. Exiting..."));
                    process.exit();
                }
            });

            source.pipe(destination);
        });
    });
} catch (err) {
    console.error(chalk.redBright('Error adding torrent:\t',`${err.message}`));
    process.exit(1);
}
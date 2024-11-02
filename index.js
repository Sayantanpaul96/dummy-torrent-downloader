import WebTorrent from 'webtorrent-hybrid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cliProgress from 'cli-progress';

const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const torrentID = process.argv[2]; // get the torrent ID from the command line
const customPath = process.argv[3]; // create a folder name or a custom path
console.log("Torrent ID: ", torrentID);

const client = new WebTorrent();

// Specify the folder to save files
const outputDir = path.isAbsolute(customPath) ? customPath : path.join(__dirname, customPath);

// Create the folder if it doesn't exist
if (!fs.existsSync(outputDir, { recursive: true })) {
    fs.mkdirSync(outputDir);
}

try {
    client.add(torrentID, torrent => {
        const files = torrent.files;
        let length = files.length;

        console.log("Number of files: ", length);
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
                console.error(`Error reading file ${file.name}:`, err);
            });

            destination.on('error', err => {
                console.error(`Error writing file ${file.name}:`, err);
            });

            destination.on('finish', () => {
                length -= 1;
                if (length === 0) {
                    bar.update(100);
                    bar.stop();
                    clearInterval(interval);
                    console.log("\n All files processed. Exiting...");
                    process.exit();
                }
            });

            source.pipe(destination);
        });
    });
} catch (err) {
    console.error(`Error adding torrent: ${err.message}`);
    process.exit(1);
}
import chokidar from 'chokidar';
import path from 'path';
import { pathToFileURL } from 'url';
import chalk from 'chalk';

export function setupWatcher(pluginsFolder) {
    const targets = [
        path.resolve('plugins'),
        path.resolve('handler.js'),
        path.resolve('config.js'),
        path.resolve('index.js'),
        path.resolve('lib'),
        path.resolve('funzioni')
    ];

    const watcher = chokidar.watch(targets, {
        persistent: true,
        ignoreInitial: true,
        usePolling: true,
        interval: 500,
        binaryInterval: 1000,
        awaitWriteFinish: {
            stabilityThreshold: 300,
            pollInterval: 100
        }
    });

    watcher.on('change', async (filePath) => {
        const fileName = path.basename(filePath);
        if (fileName.startsWith('.')) return;

        if (fileName === 'watcher.js') {
            console.log(chalk.redBright(`[ ⚠️ ] watcher.js modificato: riavvio necessario.`));
            return;
        }

        const normalizedPath = filePath.replace(/\\/g, '/');
        const fileUrl = `${pathToFileURL(path.resolve(filePath)).href}?v=${Date.now()}`;

        try {
            if (normalizedPath.includes('/plugins/')) {
                const plugin = await import(fileUrl);
                global.plugins[fileName] = plugin.default || plugin;
                console.log(chalk.blueBright(`[ 🔁 ] PLUGIN AGGIORNATO: ${fileName}`));
            } else if (fileName === 'handler.js') {
                const newHandler = await import(fileUrl);
                global.mainHandler = newHandler.default;
                console.log(chalk.blueBright(`[ 🔁 ] Handler aggiornato`));
            } else if (normalizedPath.includes('/funzioni/') || normalizedPath.includes('/lib/') || fileName === 'config.js') {
                await import(fileUrl);
                
                const handlerUrl = `${pathToFileURL(path.resolve('handler.js')).href}?v=${Date.now()}`;
                const newHandler = await import(handlerUrl);
                global.mainHandler = newHandler.default;
                
                console.log(chalk.blueBright(`[ 🔁 ] File di sistema modificato: ${fileName}`));
            }
        } catch (e) {
            console.log(chalk.red(`[ ⚠️ ] ${fileName}: ${e.message}`));
        }
    });

    watcher.on('add', async (filePath) => {
        const fileName = path.basename(filePath);
        const normalizedPath = filePath.replace(/\\/g, '/');
        
        if (normalizedPath.includes('/plugins/') && !fileName.startsWith('.')) {
            try {
                const fileUrl = `${pathToFileURL(path.resolve(filePath)).href}?v=${Date.now()}`;
                const plugin = await import(fileUrl);
                global.plugins[fileName] = plugin.default || plugin;
                console.log(chalk.green(`[ 🔁 ] Nuovo plugin: ${fileName}`));
            } catch (e) {}
        }
    });
}
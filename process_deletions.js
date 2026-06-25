const fs = require('fs');
const path = require('path');

const musicDir = path.join(__dirname, 'file/music');
const listPath = path.join(musicDir, 'list.json');
const pendingPath = path.join(__dirname, 'pending_deletions.json');

function readJSON(p) {
    try { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
    catch { return null; }
}

function writeJSON(p, data) {
    fs.writeFileSync(p, JSON.stringify(data, null, 4), 'utf-8');
}

function getFolderNameById(list, id) {
    const item = list.find(i => String(i.id) === String(id));
    return item ? item.folder : null;
}

function main() {
    const list = readJSON(listPath);
    if (!list) { console.log('❌ 未找到 list.json'); return; }

    const pending = readJSON(pendingPath);
    if (!pending || pending.length === 0) {
        console.log('没有待处理的删除任务。');
        console.log('请先在浏览器中删除歌曲，然后将 localStorage 中的 nemuran_pending_deletions 导出为 pending_deletions.json');
        return;
    }

    console.log(`待删除 ${pending.length} 首歌曲:\n`);

    for (const item of pending) {
        const folderName = getFolderNameById(list, item.rawid) || item.folder;
        const folderPath = path.join(musicDir, folderName);

        console.log(`  #${item.rawid} ${folderName}`);

        if (fs.existsSync(folderPath)) {
            fs.rmSync(folderPath, { recursive: true, force: true });
            console.log(`    ✅ 已删除文件夹`);
        } else {
            console.log(`    ⚠️ 文件夹不存在，跳过`);
        }

        const idx = list.findIndex(i => String(i.id) === String(item.rawid));
        if (idx !== -1) list.splice(idx, 1);
    }

    console.log('\n重新编号中...');
    const existingFolders = fs.readdirSync(musicDir).filter(f => {
        return fs.statSync(path.join(musicDir, f)).isDirectory();
    });

    const newList = [];
    for (let i = 0; i < list.length; i++) {
        const oldId = list[i].id;
        const newId = i + 1;
        const oldFolder = list[i].folder;

        const mp3File = fs.readdirSync(path.join(musicDir, oldFolder)).find(f => f.endsWith('.mp3'));
        const newFolder = mp3File
            ? mp3File.replace('.mp3', '')
            : oldFolder;

        if (String(oldId) !== String(newId)) {
            const oldPath = path.join(musicDir, oldFolder);
            const newPath = path.join(musicDir, newFolder);
            if (oldFolder !== newFolder && fs.existsSync(oldPath)) {
                fs.renameSync(oldPath, newPath);
                console.log(`  重命名: ${oldFolder} → ${newFolder}`);
            }
        }

        newList.push({
            id: newId,
            folder: newFolder,
            file: mp3File || list[i].file,
            title: list[i].title,
            artist: list[i].artist
        });
    }

    writeJSON(listPath, newList);
    fs.writeFileSync(pendingPath, '[]', 'utf-8');

    console.log(`\n✅ 完成! list.json 已更新，共 ${newList.length} 首歌曲`);
    console.log('请刷新网页查看更新后的歌单。');
}

main();

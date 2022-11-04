import path from 'node:path';
import { BrowserWindow, app, ipcMain, IpcMainInvokeEvent, dialog } from 'electron';
import * as fs from 'fs';
import * as archiver from 'archiver';
import { exec } from 'node:child_process';

// Hot Reload
if (process.env.NODE_ENV === 'development') {
  require('electron-nice-auto-reload')({
    rootPath: path.join(process.cwd(), 'dist'),
    rules: [{ action: 'app.relaunch' }],
  });
}

let mainWindow: BrowserWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.resolve('dist/preload.js'),
    },
  });

  mainWindow.loadFile('dist/index.html');
}

app.whenReady().then(createWindow);

app.once('window-all-closed', () => app.quit());

const templateTypes = ['pattern001', 'pattern002', 'pattern003', 'pattern004', 'pattern005'];

type rendererData = {
  image_file_paths: [],
  url: string,
  template_type: number
}

type hrefType = {
  dataIndex: number,
  href: string
}

type tapareasType = {
  hrefs: hrefType[],
  templateType: string
}

type dataJsonType = {
  tapareas: tapareasType
}

const zipArchive = (targetDir: string) => {
  const zipPath = `${targetDir}.zip`;
  const savePath = dialog.showSaveDialogSync(mainWindow, {
    defaultPath: zipPath,
    buttonLabel: 'Save',
    filters: [
      { name: 'zip archive file', extensions: ['zip'] },
    ],
    properties: ['createDirectory']
  });

  const isWin = process.platform === 'win32';
  const tempPath = path.join(process.cwd(), targetDir);
  let removeCommand: string;

  if (isWin) {
    removeCommand = `rd /s /q ${tempPath}`;
  } else {
    removeCommand = `rm -rf ${tempPath}`;
  }

  if (savePath && tempPath !== '') {
    const output = fs.createWriteStream(savePath);
    const archive = archiver.create('zip', {
      zlib: { level: 9 }
    });

    archive.pipe(output);
    archive.glob(`${targetDir}/*`);
    (
      async () => await archive.finalize()
        .then(() => exec(removeCommand))
    )();
  }
}

ipcMain.handle('create-archive', async (e: IpcMainInvokeEvent, data: rendererData): Promise<string[]> => {
  let dirPath = 'temp';

  const hrefs: hrefType[] = [{
    dataIndex: 0,
    href: data.url
  }];

  const tapareas: tapareasType = {
    hrefs: hrefs,
    templateType: templateTypes[data.template_type]
  };

  const dataJson: dataJsonType = {
    tapareas: tapareas
  };

  return new Promise((resolve) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    } else {
      fs.rmSync(dirPath, { force: true, recursive: true });
      fs.mkdirSync(dirPath);
    }
    if (data.image_file_paths.length !== 0) {
      data.image_file_paths.map((image_file_path, index) => {
        const ext = path.extname(image_file_path);
        fs.copyFile(image_file_path, `${dirPath}/${index}${ext}`, (error) => {
          if (error) throw error;
        });
        fs.writeFile(`${dirPath}/data.json`, JSON.stringify(dataJson, null, 2), (error) => {
          if (error) throw error;
        });
      });
    }
    zipArchive(dirPath);
    resolve([path.resolve(dirPath + '.zip'), dirPath + '.zip']);
  });
});

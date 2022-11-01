import path from 'node:path';
import { BrowserWindow, app, ipcMain, IpcMainInvokeEvent } from 'electron';
import * as fs from 'fs';
const archiver = require('archiver');

// Hot Reload
if (process.env.NODE_ENV === 'development') {
  require('electron-nice-auto-reload')({
    rootPath: path.join(process.cwd(), 'dist'),
    rules: [{ action: 'app.relaunch' }],
  });
}

const createWindow = () => {
  let mainWindow = new BrowserWindow({
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

const zipArchive = async (targetDir: string) => {
  const zipPath = `${targetDir}.zip`;
  const output = fs.createWriteStream(path.join(process.cwd(), zipPath));
  const archive = archiver.create('zip', {
    zlib: { level: 9 }
  });

  archive.pipe(output);
  archive.glob(`${targetDir}/*`);

  await archive.finalize();
  return;
}

const save = async () => {

}


ipcMain.handle('create-archive', async (e: IpcMainInvokeEvent, data: rendererData) => {
  let dirPath = 'temp/';

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
  
  fs.mkdirSync(dirPath);
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
  
  zipArchive('temp');
});

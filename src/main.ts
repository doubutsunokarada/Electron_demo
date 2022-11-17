import path from "node:path";
import {
  BrowserWindow,
  app,
  ipcMain,
  IpcMainInvokeEvent,
  dialog,
} from "electron";
import * as fs from "fs";
import * as archiver from "archiver";
import { exec } from "node:child_process";
import { configure, getLogger } from "log4js";

// Hot Reload
if (process.env.NODE_ENV === "development") {
  require("electron-nice-auto-reload")({
    rootPath: path.join(process.cwd(), "dist"),
    rules: [{ action: "app.relaunch" }],
  });
  configure(path.join(app.getAppPath(), "log4js.config.json"));
} else {
  configure("./log4js.config.json");
}

const logger = getLogger();

let mainWindow: BrowserWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "./preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "./index.html"));
};

app.whenReady().then(createWindow);

app.once("window-all-closed", () => app.quit());

const templateTypes = [
  "pattern001",
  "pattern002",
  "pattern003",
  "pattern004",
  "pattern005",
];

type rendererData = {
  image_file_paths: string[];
  urls: string[];
  template_type: number;
};

type hrefType = {
  dataIndex: number;
  href: string;
};

type tapareasType = {
  hrefs: hrefType[];
  templateType: string;
};

type dataJsonType = {
  tapareas: tapareasType;
};

const zipArchive = (targetDir: string) => {
  const zipPath = `${targetDir}.zip`;
  const tempPath = path.join(process.cwd(), targetDir);
  const savePath = dialog.showSaveDialogSync(mainWindow, {
    defaultPath: zipPath,
    buttonLabel: "Save",
    filters: [{ name: "zip archive file", extensions: ["zip"] }],
    properties: ["createDirectory"],
  });

  if (savePath === undefined) removeTempDir(tempPath);

  if (savePath && tempPath !== "") {
    const output = fs.createWriteStream(savePath);
    const archive = archiver.create("zip", {
      zlib: { level: 9 },
    });

    archive.pipe(output);
    archive.glob(`${targetDir}/*/*`);
    (async () =>
      await archive.finalize().then(() => removeTempDir(tempPath)))();
  }
};

const removeTempDir = (tempPath: string): void => {
  const isWin = process.platform === "win32";
  let command: string;
  if (isWin) {
    command = `rd /s /q ${tempPath}`;
  } else {
    command = `rm -rf ${tempPath}`;
  }
  exec(command);
};

ipcMain.handle(
  "create-archive",
  async (e: IpcMainInvokeEvent, data: rendererData): Promise<string[]> => {
    const dirPath = "temp";
    const imagesPath = `${dirPath}/images`;
    const dataPath = `${dirPath}/data`;

    const hrefs: hrefType[] = [];

    data.urls.map((v, k) => {
      let href: hrefType = {
        dataIndex: k,
        href: v,
      };
      hrefs.push(href);
    });

    const tapareas: tapareasType = {
      hrefs: hrefs,
      templateType: templateTypes[data.template_type],
    };

    const dataJson: dataJsonType = {
      tapareas: tapareas,
    };

    return new Promise((resolve) => {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
        fs.mkdirSync(imagesPath);
        fs.mkdirSync(dataPath);
      } else {
        fs.rmSync(dirPath, { force: true, recursive: true });
        fs.mkdirSync(dirPath);
      }
      if (data.image_file_paths.length !== 0) {
        data.image_file_paths.map((image_file_path, index) => {
          const ext = path.extname(image_file_path);
          fs.copyFile(
            image_file_path,
            `${imagesPath}/${index}${ext}`,
            (error) => {
              if (error) throw error;
            }
          );
          console.log(process.cwd());
          fs.writeFile(
            `${dataPath}/data.json`,
            JSON.stringify(dataJson, null, 2),
            (error) => {
              if (error) throw error;
            }
          );
        });
      }
      zipArchive(dirPath);
      resolve([path.resolve(dirPath + ".zip"), dirPath + ".zip"]);
    });
  }
);

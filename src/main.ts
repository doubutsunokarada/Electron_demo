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
import { exec, execFile } from "node:child_process";
import { configure, getLogger } from "log4js";

// const appPath = app.getAppPath();
let appPath: string;

const isWin = process.platform === "win32";
const isMac = process.platform === "darwin";

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
  const tempPath = path.join(appPath, targetDir);
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
    // archive.finalize();
    // output.on("close", () => {
    //   removeTempDir(tempPath);
    // });
    (async () =>
      await archive.finalize().then(() => removeTempDir(tempPath)))();
  }
};

const removeTempDir = (tempPath: string): void => {
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
  async (e: IpcMainInvokeEvent, data: rendererData): Promise<string> => {
    const dirName = "temp";
    const dirPath = path.join(appPath, dirName);
    const imagesPath = path.join(dirPath, "images");
    const dataPath = path.join(dirPath, "data");

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
      const errorHandler = (error: NodeJS.ErrnoException | null) => {
        if (error) {
          logger.error(`${error.name}: ${error.message}`);
          throw error;
        }
      };

      if (!fs.existsSync(dirPath)) {
        fs.mkdir(dirPath, errorHandler);
        fs.mkdir(imagesPath, errorHandler);
        fs.mkdir(dataPath, errorHandler);
        logger.info("mkdir success.");
      } else {
        fs.rmSync(dirPath, { force: true, recursive: true });
        fs.mkdir(dirPath, errorHandler);
        fs.mkdir(imagesPath, errorHandler);
        fs.mkdir(dataPath, errorHandler);
        logger.info("mkdir success.");
      }
      if (data.image_file_paths.length !== 0) {
        data.image_file_paths.map((image_file_path, index) => {
          const ext = path.extname(image_file_path);
          fs.copyFile(
            image_file_path,
            path.join(imagesPath, `${index}${ext}`),
            errorHandler
          );
          fs.writeFile(
            path.join(dataPath, "data.json"),
            JSON.stringify(dataJson, null, 2),
            errorHandler
          );
        });
      }
      resolve(dirName);
    });
  }
);

ipcMain.handle("to-zip", (e: IpcMainInvokeEvent, dirName: string) =>
  zipArchive(dirName)
);

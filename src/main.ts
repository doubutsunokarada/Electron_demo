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
import { execFile, ExecFileException } from "node:child_process";
import log from "electron-log";

// Hot Reload
if (process.env.NODE_ENV === "development") {
  require("electron-nice-auto-reload")({
    rootPath: path.join(process.cwd(), "dist"),
    rules: [{ action: "app.relaunch" }],
  });
} else {
  process.chdir(app.getPath("userData"));
}

const isMac = process.platform === "darwin";
const isWin = process.platform === "win32";

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

const execCallback = (
  error: ExecFileException | null,
  stdout: string,
  stderr: string
) => {
  log.info(stdout);
  if (error) {
    log.error(
      `rmdir error occurred. ${error.code}: ${error.message}\nstack: ${error.stack}`
    );
    throw error;
  }
};

const zipArchive = (targetDir: string) => {
  log.info("zip archive");
  const zipPath = `${targetDir}.zip`;
  const tempPath = path.join(process.cwd(), targetDir);
  log.info(`temp path: ${tempPath}`);
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
    log.info(`target directory: ${targetDir}`);
    archive.glob(`${targetDir}/*/*`);
    (async () =>
      await archive
        .finalize()
        .then(() => {
          log.info("archive finalize.");
          removeTempDir(tempPath);
        })
        .finally(() => log.info("finally")))();
  }
};

const removeTempDir = (tempPath: string) => {
  if (isWin) {
    execFile("rd", ["/s", "/q", tempPath], { shell: true }, execCallback);
  } else if (isMac) {
    execFile("rm", ["-rf", tempPath], { shell: true }, execCallback);
  }
};

ipcMain.handle(
  "create-archive",
  async (e: IpcMainInvokeEvent, data: rendererData): Promise<string[]> => {
    const dirName = "temp";
    const dirPath = path.join(process.cwd(), dirName);
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

    const noParamCallback = (error: NodeJS.ErrnoException | null) => {
      if (error) {
        log.error(
          `File copy or write error occurred. ${error.code}: ${error.message}\nstack: ${error.stack}`
        );
        throw error;
      }
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
            noParamCallback
          );
          console.log(process.cwd());
          fs.writeFile(
            `${dataPath}/data.json`,
            JSON.stringify(dataJson, null, 2),
            noParamCallback
          );
        });
      }
      zipArchive(dirName);
      resolve([path.resolve(dirPath + ".zip"), dirPath + ".zip"]);
    });
  }
);

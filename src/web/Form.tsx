import React from "react";
import { ImageComponent } from "./components/Image";
import { UrlComponent } from "./components/Url";

// Contexts
type ContextType = {
  maxCount: number;
  callback: (index: number, data: string) => void;
};

const defaultContext: ContextType = {
  maxCount: 0,
  callback: (index: number, data: string): void => {},
};

export const ImageFileContext: React.Context<ContextType> =
  React.createContext(defaultContext);

export const UrlContext: React.Context<ContextType> =
  React.createContext(defaultContext);

// Common
type TemplatesInfo = {
  [templateName: string]: { imageMaxCount: number; urlMaxCount: number };
};

const templatesInfo: TemplatesInfo = {
  pattern001: { imageMaxCount: 1, urlMaxCount: 2 },
  pattern002: { imageMaxCount: 3, urlMaxCount: 4 },
  pattern003: { imageMaxCount: 1, urlMaxCount: 1 },
  pattern004: { imageMaxCount: 1, urlMaxCount: 1 },
  pattern005: { imageMaxCount: 1, urlMaxCount: 1 },
};

const templateTypeNames: string[] = [
  "pattern001",
  "pattern002",
  "pattern003",
  "pattern004",
  "pattern005",
];

// Component
export const InputForm: React.FC = () => {
  // States
  const [templateType, setTemplateType] = React.useState<number>(0);
  const [templateTypeName, setTemplateTypeName] = React.useState<string>(
    templateTypeNames[0]
  );
  const imageFilePaths = React.useRef<string[]>(
    Array(templatesInfo[templateTypeName].imageMaxCount).fill("")
  );
  const urls = React.useRef<string[]>(
    Array(templatesInfo[templateTypeName].urlMaxCount).fill("")
  );

  const setImageFilePath = (index: number, data: string) => {
    imageFilePaths.current[index] = data;
  };

  const setUrl = (index: number, data: string) => {
    urls.current[index] = data;
  };

  // Contexts for child component.
  const imageFileProps: ContextType = {
    maxCount: templatesInfo[templateTypeName].imageMaxCount,
    callback: setImageFilePath,
  };
  const urlProps: ContextType = {
    maxCount: templatesInfo[templateTypeName].urlMaxCount,
    callback: setUrl,
  };

  const createArchive = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const states = {
      image_file_paths: imageFilePaths.current,
      urls: urls.current,
      template_type: templateType,
    };
    await (window as any).preload
      .createArchive(states)
      .then((data: string[]) => {});
  };

  const handleTemplateType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectValue = Number(e.target.value);
    setTemplateType(selectValue);
    setTemplateTypeName(templateTypeNames[selectValue]);
  };

  React.useEffect(() => {
    let newImageFilePaths: Array<string> = Array(
      templatesInfo[templateTypeName].imageMaxCount
    ).fill("");
    let newUrls: Array<string> = Array(
      templatesInfo[templateTypeName].urlMaxCount
    ).fill("");
    newImageFilePaths.map((v, k) => {
      const prevImageFilePaths = [...imageFilePaths.current];
      if (prevImageFilePaths[k] !== undefined) {
        newImageFilePaths[k] = prevImageFilePaths[k];
      }
    });
    newUrls.map((v, k) => {
      const prevUrls = [...urls.current];
      if (prevUrls[k] !== undefined) {
        newUrls[k] = prevUrls[k];
      }
    });
    imageFilePaths.current = newImageFilePaths;
    urls.current = newUrls;
  }, [templateType]);

  return (
    <form>
      <p>
        Type:
        <select onChange={handleTemplateType}>
          {templateTypeNames.map((v, k) => {
            return (
              <option key={k} value={k}>
                {v}
              </option>
            );
          })}
        </select>
      </p>
      <>
        <ImageFileContext.Provider value={imageFileProps}>
          <ImageComponent />
        </ImageFileContext.Provider>
      </>
      <>
        <UrlContext.Provider value={urlProps}>
          <UrlComponent />
        </UrlContext.Provider>
      </>
      <button type="button" onClick={createArchive}>
        Submit
      </button>
    </form>
  );
};

import React from "react";
import { ImageFileContext } from "../Form";

export const ImageComponent: React.FC = () => {
  let elements: Array<React.ReactElement> = [];
  
  // Context
  const imageFileContext = React.useContext(ImageFileContext);

  // Handler
  const handler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length === 0) return;
    const file = e.target.files![0];
    const index = Number(e.target.dataset.index);
    imageFileContext.callback(index, file.path);
  }

  const renderLoop = () => {
    return elements.map((imageFileInput, k) => {
      return <React.Fragment key={k}>{imageFileInput}</React.Fragment>
    });
  };

  for (let index = 0; index < imageFileContext.maxCount; index++) {
    const imageFileInput: React.ReactElement = (
      <>
        <input key={index} type="file" onChange={handler} data-index={index} accept="image/*" />
      </>
    );
    elements.push(imageFileInput);
  }

  return (
    <div className="imageFileContainer">
      Image:
      {renderLoop()}
    </div>
  );
};

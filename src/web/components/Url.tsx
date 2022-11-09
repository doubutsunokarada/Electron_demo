import React from "react";
import { UrlContext } from "../Form";

// Component
export const UrlComponent: React.FC = () => {
  let elements: Array<React.ReactElement> = [];

  // Contexts
  const urlContext = React.useContext(UrlContext);

  // Handler
  const handler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = Number(e.target.dataset.index);
    urlContext.callback(index, e.target.value);
  };

  const renderLoop = () => {
    return elements.map((urlInput, k) => {
      return <React.Fragment key={k}>{urlInput}</React.Fragment>;
    });
  };

  for (let index = 0; index < urlContext.maxCount; index++) {
    const urlInput: React.ReactElement = (
      <>
        <input key={index} type="text" onChange={handler} data-index={index} />
      </>
    );
    elements.push(urlInput);
  }

  return (
    <div className="urlContainer">
      URL:
      {renderLoop()}
    </div>
  );
};

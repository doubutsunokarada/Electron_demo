import React from 'react';

const InputForm: React.FC = () => {
  const [imageFilePaths, setImageFilePaths] = React.useState<string[]>([]);
  const [url, setUrl] = React.useState<string>('');
  const [templateType, setTemplateType] = React.useState<number>(0);

  const createArchive = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const states = {
      'image_file_paths': imageFilePaths,
      'url': url,
      'template_type': templateType,
    };
    await (window as any).preload.createArchive(states)
      .then((data: string[]) => { });
  }

  const handleImageFilePaths = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length === 0) return;
    const file = e.target.files![0];
    let filePaths = [...imageFilePaths];
    filePaths.push(file.path);
    setImageFilePaths(filePaths);
  }

  const handleUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  }

  const handleTemplateType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTemplateType(Number(e.target.value));
  }

  return (
    <form>
      <p>
        Image:
        <input id="imageUpload" type="file" multiple onChange={handleImageFilePaths} accept="image/*" />
        <label htmlFor="imageUpload">
          <a>Add image</a>
        </label>
      </p>
      <p>
        URL:
        <input type="text" onChange={handleUrl} />
        {url}
      </p>
      <p>
        Type:
        <select onChange={handleTemplateType}>
          <option value={0}>pattern001</option>
          <option value={1}>pattern002</option>
          <option value={2}>pattern003</option>
          <option value={3}>pattern004</option>
          <option value={4}>pattern005</option>
        </select>
        {templateType}
      </p>
      <button type="button" onClick={createArchive}>Submit</button>
    </form>
  )
}

export default { InputForm }
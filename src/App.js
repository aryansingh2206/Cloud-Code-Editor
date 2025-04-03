import React, { useState, useEffect } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { db, collection, addDoc, getDocs } from "./firebase";
import styles from "./style.module.css";

const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com/submissions";
const RAPIDAPI_KEY = "91828edc23mshccbddda96286014p139dbdjsn652bace74935"; // Replace with your API key

function App() {
  const [code, setCode] = useState("// Start coding...");
  const [fileName, setFileName] = useState("untitled");
  const [fileExtension, setFileExtension] = useState("js");
  const [languageId, setLanguageId] = useState(63); // Default: JavaScript
  const [output, setOutput] = useState("");
  const [files, setFiles] = useState([]);

  // Mapping file extensions to Judge0 language IDs
  const languageOptions = {
    js: { id: 63, name: "JavaScript", monacoLang: "javascript" },
    py: { id: 71, name: "Python", monacoLang: "python" },
    cpp: { id: 54, name: "C++", monacoLang: "cpp" },
    java: { id: 62, name: "Java", monacoLang: "java" }
  };

  useEffect(() => {
    if (languageOptions[fileExtension]) {
      setLanguageId(languageOptions[fileExtension].id);
    } else {
      console.warn(`Unknown file extension: ${fileExtension}, defaulting to JavaScript`);
      setLanguageId(63);
    }
  }, [fileExtension]);

  // Function to Run Code
  const runCode = async () => {
    setOutput("Running...");
    try {
      const response = await axios.post(
        JUDGE0_API_URL,
        { source_code: code, language_id: languageId, stdin: "" },
        { headers: { "Content-Type": "application/json", "X-RapidAPI-Key": RAPIDAPI_KEY } }
      );

      const token = response.data.token;
      setTimeout(async () => {
        const result = await axios.get(`${JUDGE0_API_URL}/${token}`, {
          headers: { "X-RapidAPI-Key": RAPIDAPI_KEY }
        });
        setOutput(result.data.stdout || "Error: " + result.data.stderr);
      }, 3000);
    } catch (error) {
      console.error(error);
      setOutput("Error running code.");
    }
  };

  // Save File to Cloud (Firebase Firestore)
  const saveFile = async () => {
    if (!fileName.trim()) {
      alert("File name cannot be empty!");
      return;
    }

    try {
      await addDoc(collection(db, "files"), {
        fileName,
        code,
        fileExtension,
        timestamp: new Date()
      });
      alert(`File "${fileName}.${fileExtension}" saved to the cloud!`);
      fetchFiles();
    } catch (error) {
      console.error("Error saving file:", error);
    }
  };

  // Fetch Files from Cloud (Firebase Firestore)
  const fetchFiles = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "files"));
      const fileList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setFiles(fileList);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Download File to Local System
  const downloadFile = () => {
    if (!code) {
      alert("No content to download!");
      return;
    }

    const blob = new Blob([code], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load File Content into the Editor
  const loadFile = (file) => {
    if (!file || !file.fileName) {
      console.error("Invalid file data:", file);
      return;
    }

    const extractedExtension = file.fileExtension || file.fileName.split('.').pop();

    setFileName(file.fileName);
    setFileExtension(extractedExtension);
    setCode(file.code || "");

    setLanguageId(languageOptions[extractedExtension]?.id || 63);
  };

  // Monaco Editor Configuration with IntelliSense
  function handleEditorDidMount(editor, monaco) {
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true
    });

    monaco.languages.typescript.javascriptDefaults.addExtraLib(`
      declare function alert(message: string): void;
      declare function prompt(message: string): string;
      declare function consoleLog(value: any): void;
    `);
  }

  return (
    <div className={styles.appContainer}>
      <h2 className={styles.title}>Cloud Code Editor</h2>

      {/* File Name Input */}
      <input
        type="text"
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
        placeholder="Enter file name"
        className={styles.inputField}
      />

      {/* Language Selector */}
      <select
        value={fileExtension}
        onChange={(e) => setFileExtension(e.target.value)}
        className={styles.selectDropdown}
      >
        {Object.keys(languageOptions).map((ext) => (
          <option key={ext} value={ext}>
            {languageOptions[ext].name} ({ext})
          </option>
        ))}
      </select>

      {/* Buttons */}
      <div>
        <button onClick={saveFile} className={`${styles.button} ${styles.saveButton}`}>
          Save to Cloud
        </button>
        <button onClick={downloadFile} className={`${styles.button} ${styles.saveButton}`}>
          Download File
        </button>
      </div>

      <button onClick={runCode} className={`${styles.button} ${styles.runButton}`}>
        Run Code
      </button>

      {/* Code Editor */}
      <div className={styles.codeEditor}>
        <Editor
          height="60vh"
          theme="vs-dark"
          language={languageOptions[fileExtension]?.monacoLang || "javascript"}
          value={code}
          onChange={(newValue) => setCode(newValue)}
          onMount={handleEditorDidMount}
        />
      </div>

      {/* Output */}
      <div className={styles.outputContainer}>
        <h3>Output:</h3>
        <textarea
          readOnly
          value={output}
          style={{ width: "100%", height: "150px", backgroundColor: "#222", color: "#fff" }}
        />
      </div>

      {/* Saved Files */}
      <h3>Saved Files:</h3>
      <ul className={styles.fileList}>
        {files.map((file) => (
          <li key={file.id} onClick={() => loadFile(file)} className={styles.fileItem}>
            {file.fileName}.{file.fileExtension || "unknown"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

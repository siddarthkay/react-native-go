const fs = require("fs");
const path = require("path");

const SKIP_DIRS = [
  "node_modules",
  ".yarn",
  ".git",
  "build",
  "Pods",
  ".gradle",
  ".expo",
  ".cxx",
  "Frameworks",
  "libs",
];
const SKIP_FILES = [".DS_Store"];

function isBinaryFile(filePath) {
  const buf = Buffer.alloc(8192);
  const fd = fs.openSync(filePath, "r");
  try {
    const bytesRead = fs.readSync(fd, buf, 0, 8192, 0);
    for (let i = 0; i < bytesRead; i++) {
      if (buf[i] === 0) return true;
    }
    return false;
  } finally {
    fs.closeSync(fd);
  }
}

function scaffold(config) {
  const { templateDir, targetDir, appName, bundleId, goModule, iosProject } =
    config;

  const bundlePath = bundleId.replace(/\./g, "/");

  const replacements = {
    "{{APP_NAME}}": appName,
    "{{BUNDLE_ID}}": bundleId,
    "{{BUNDLE_PATH}}": bundlePath,
    "{{GO_MODULE}}": goModule,
    "{{IOS_PROJECT}}": iosProject,
  };

  const dirReplacements = {
    "{{APP_NAME}}": appName,
    "{{BUNDLE_ID}}": bundleId,
    "{{BUNDLE_PATH}}": bundlePath,
    "{{IOS_PROJECT}}": iosProject,
  };

  copyDir(templateDir, targetDir, replacements, dirReplacements);
  makeExecutable(targetDir);

  return countFiles(targetDir);
}

function copyDir(src, dest, replacements, dirReplacements) {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);

    // Apply directory/file name replacements
    let destName = entry.name;
    for (const [placeholder, value] of Object.entries(dirReplacements)) {
      destName = destName.split(placeholder).join(value);
    }

    if (entry.isDirectory()) {
      if (SKIP_DIRS.includes(entry.name)) continue;
      // bundlePath contains '/' so we need nested dirs
      const destPath = path.join(dest, destName);
      copyDir(srcPath, destPath, replacements, dirReplacements);
    } else {
      if (SKIP_FILES.includes(entry.name)) continue;
      const destPath = path.join(dest, destName);
      copyFile(srcPath, destPath, replacements);
    }
  }
}

function copyFile(src, dest, replacements) {
  // Ensure parent directory exists (for nested bundle path dirs)
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  if (isBinaryFile(src)) {
    fs.copyFileSync(src, dest);
  } else {
    let content = fs.readFileSync(src, "utf-8");
    for (const [placeholder, value] of Object.entries(replacements)) {
      content = content.split(placeholder).join(value);
    }
    fs.writeFileSync(dest, content, "utf-8");
  }
}

function makeExecutable(dir) {
  walkFiles(dir, (filePath) => {
    const name = path.basename(filePath);
    if (filePath.endsWith(".sh") || name === "gradlew") {
      fs.chmodSync(filePath, 0o755);
    }
  });
}

function walkFiles(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
}

function countFiles(dir) {
  let count = 0;
  walkFiles(dir, () => count++);
  return count;
}

module.exports = { scaffold };

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");

const TEMPLATE_DIR = path.join(__dirname, "..", "template");

const OLD_APP_NAME = "rn-golang";
const OLD_BUNDLE_ID = "io.rngolang.app";
const OLD_GO_MODULE = "github.com/siddarthkay/react-native-go";
const OLD_IOS_PROJECT = "mobileapp";
const OLD_ANDROID_ROOT_PROJECT = "mobile-app";

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "Pods",
  "build",
  ".yarn",
  "Frameworks",
  "libs",
  ".expo",
]);

const SKIP_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".jar",
  ".aar",
  ".xcframework",
]);

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function validateBundleId(id) {
  return /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(id);
}

function deriveIosProject(appName) {
  return appName.replace(/-/g, "").toLowerCase();
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      copyDir(srcPath, destPath);
    } else {
      if (SKIP_EXTENSIONS.has(path.extname(entry.name))) {
        fs.copyFileSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

function replaceInFile(filePath, replacements) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return false;
  }

  // Check if binary
  if (content.includes("\0")) return false;

  let changed = false;
  for (const [old, replacement] of replacements) {
    if (content.includes(old)) {
      content = content.split(old).join(replacement);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
  }
  return changed;
}

function walkFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      results.push(...walkFiles(fullPath));
    } else {
      if (!SKIP_EXTENSIONS.has(path.extname(entry.name))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function renameAndMoveAndroidPackage(projectDir, oldBundleId, newBundleId) {
  const javaDir = path.join(
    projectDir,
    "mobile-app",
    "android",
    "app",
    "src",
    "main",
    "java"
  );
  const oldPkgDir = path.join(javaDir, ...oldBundleId.split("."));
  const newPkgDir = path.join(javaDir, ...newBundleId.split("."));

  if (!fs.existsSync(oldPkgDir)) return;

  fs.mkdirSync(newPkgDir, { recursive: true });

  for (const file of fs.readdirSync(oldPkgDir)) {
    fs.renameSync(path.join(oldPkgDir, file), path.join(newPkgDir, file));
  }

  // Remove old empty directories
  const oldTopDir = path.join(javaDir, oldBundleId.split(".")[0]);
  const newTopDir = path.join(javaDir, newBundleId.split(".")[0]);
  if (oldTopDir !== newTopDir) {
    fs.rmSync(oldTopDir, { recursive: true, force: true });
  } else {
    // Clean up empty dirs
    let dir = oldPkgDir;
    while (dir !== javaDir) {
      try {
        fs.rmdirSync(dir);
      } catch {
        break;
      }
      dir = path.dirname(dir);
    }
  }
}

function renameIosProject(projectDir, oldName, newName) {
  const iosDir = path.join(projectDir, "mobile-app", "ios");

  const renames = [
    [oldName, newName],
    [`${oldName}.xcodeproj`, `${newName}.xcodeproj`],
    [`${oldName}.xcworkspace`, `${newName}.xcworkspace`],
  ];

  for (const [oldDir, newDir] of renames) {
    const oldPath = path.join(iosDir, oldDir);
    const newPath = path.join(iosDir, newDir);
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
    }
  }

  // Rename files inside the iOS project directory
  const newProjectDir = path.join(iosDir, newName);
  if (fs.existsSync(newProjectDir)) {
    for (const file of fs.readdirSync(newProjectDir)) {
      if (file.includes(oldName)) {
        const newFile = file.split(oldName).join(newName);
        fs.renameSync(
          path.join(newProjectDir, file),
          path.join(newProjectDir, newFile)
        );
      }
    }
  }

  // Rename scheme file inside .xcodeproj
  const schemesDir = path.join(
    iosDir,
    `${newName}.xcodeproj`,
    "xcshareddata",
    "xcschemes"
  );
  if (fs.existsSync(schemesDir)) {
    for (const file of fs.readdirSync(schemesDir)) {
      if (file.includes(oldName)) {
        const newFile = file.split(oldName).join(newName);
        fs.renameSync(
          path.join(schemesDir, file),
          path.join(schemesDir, newFile)
        );
      }
    }
  }
}

async function run() {
  const args = process.argv.slice(2);
  let appName = args[0];
  let bundleId = null;
  let goModule = null;

  // Parse flags
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--bundleId" && args[i + 1]) {
      bundleId = args[++i];
    } else if (args[i] === "--goModule" && args[i + 1]) {
      goModule = args[++i];
    }
  }

  console.log("");
  console.log("\x1b[36m=== create-react-native-go ===\x1b[0m");
  console.log("");

  if (!appName) {
    appName = await ask("App name (e.g. my-app): ");
  }
  if (!appName) {
    console.error("\x1b[31mApp name is required.\x1b[0m");
    process.exit(1);
  }

  if (!bundleId) {
    bundleId = await ask("Bundle ID (e.g. com.mycompany.myapp): ");
  }
  if (!bundleId) {
    console.error("\x1b[31mBundle ID is required.\x1b[0m");
    process.exit(1);
  }
  if (!validateBundleId(bundleId)) {
    console.error(
      "\x1b[31mInvalid bundle ID. Use lowercase like: com.company.appname\x1b[0m"
    );
    process.exit(1);
  }

  if (!goModule) {
    goModule = await ask("Go module path (e.g. mycompany.com/my-app): ");
  }
  if (!goModule) {
    console.error("\x1b[31mGo module path is required.\x1b[0m");
    process.exit(1);
  }

  const iosProject = deriveIosProject(appName);
  const projectDir = path.resolve(fs.realpathSync(process.cwd()), appName);

  console.log("");
  console.log(`  App name:     ${appName}`);
  console.log(`  Bundle ID:    ${bundleId}`);
  console.log(`  Go module:    ${goModule}`);
  console.log(`  iOS project:  ${iosProject}`);
  console.log(`  Directory:    ${projectDir}`);
  console.log("");

  if (fs.existsSync(projectDir)) {
    console.error(`\x1b[31mDirectory "${appName}" already exists.\x1b[0m`);
    process.exit(1);
  }

  // Step 1: Copy template
  console.log("\x1b[36mCopying template...\x1b[0m");
  copyDir(TEMPLATE_DIR, projectDir);

  // Step 2: Replace identifiers in all files
  console.log("\x1b[36mConfiguring project...\x1b[0m");

  const replacements = [
    [OLD_GO_MODULE, goModule],
    [OLD_BUNDLE_ID, bundleId],
    [OLD_APP_NAME, appName],
    [`rootProject.name = '${OLD_ANDROID_ROOT_PROJECT}'`, `rootProject.name = '${appName}'`],
    [OLD_IOS_PROJECT, iosProject],
  ];

  const files = walkFiles(projectDir);
  let updatedCount = 0;
  for (const file of files) {
    if (replaceInFile(file, replacements)) {
      updatedCount++;
    }
  }
  console.log(`  Updated ${updatedCount} files`);

  // Step 3: Rename Android package directories
  console.log("\x1b[36mRestructuring Android packages...\x1b[0m");
  renameAndMoveAndroidPackage(projectDir, OLD_BUNDLE_ID, bundleId);

  // Step 4: Rename iOS project
  console.log("\x1b[36mRenaming iOS project...\x1b[0m");
  renameIosProject(projectDir, OLD_IOS_PROJECT, iosProject);

  // Step 5: Initialize git
  console.log("\x1b[36mInitializing git...\x1b[0m");
  try {
    execSync("git init", { cwd: projectDir, stdio: "ignore" });
    execSync("git add -A", { cwd: projectDir, stdio: "ignore" });
    execSync('git commit -m "Initial commit from create-react-native-go"', {
      cwd: projectDir,
      stdio: "ignore",
    });
  } catch {
    // git init is nice-to-have, not critical
  }

  console.log("");
  console.log("\x1b[32m=== Project created! ===\x1b[0m");
  console.log("");
  console.log(`  cd ${appName}`);
  console.log("  make setup");
  console.log("  make ios    # or: make android");
  console.log("");
}

module.exports = { run };

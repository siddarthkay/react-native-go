const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");
const { scaffold } = require("./scaffold");

const TEMPLATE_DIR = path.join(__dirname, "..", "template");

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

  // Scaffold project from template
  console.log("\x1b[36mScaffolding project...\x1b[0m");
  const fileCount = scaffold({
    templateDir: TEMPLATE_DIR,
    targetDir: projectDir,
    appName,
    bundleId,
    goModule,
    iosProject,
  });
  console.log(`  Created ${fileCount} files`);

  // Initialize git
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

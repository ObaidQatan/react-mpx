import { existsSync, readdirSync, readFileSync, rmSync } from "fs";
import { join, extname, basename } from "path";
import enquirer from "enquirer";
import { DEFAULT_PROJECT_DIR, PROJECT_VALID_EXTENSIONS } from "./constants.js";
import { normalizePath } from "vite";

export function getAvailableProjects(srcDir: string): string[] {
  const absPath = join(process.cwd(), srcDir);
  if (!existsSync(absPath)) {
    throw new Error(`Projects directory not found: ${absPath}`);
  }
  return readdirSync(absPath)
    .filter((file) => /\.(tsx|ts|jsx|js)$/.test(file))
    .map((file) => basename(file, extname(file)));
}

export async function selectProjectInteractively(
  projects: string[]
): Promise<string> {
  try {
    const { project } = await enquirer.prompt<{ project: string }>({
      type: "select",
      name: "project",
      message: "Select a project to run:",
      choices: projects,
    });
    return project;
  } catch (error: any) {
    if (error.code !== "ERR_UNHANDLED_REJECTION") {
      throw error;
    }
    process.exit(0);
  }
}

export function validateProject(projectName: string, projects: string[]): void {
  if (!projects.includes(projectName)) {
    throw new Error(
      `Project "${projectName}" not found.\nAvailable: ${projects.join(", ")}`
    );
  }
}

export function ensureDistClean(projectName: string): void {
  const outDir = join(process.cwd(), "dist", projectName);
  rmSync(outDir, { recursive: true, force: true });
}

export function getNormalizedProjectDir(src = DEFAULT_PROJECT_DIR) {
  const srcDir = normalizePath(src);
  const absSrcDir = join(process.cwd(), srcDir);
  if (!existsSync(absSrcDir)) {
    throw new Error(`Projects directory not found: ${absSrcDir}`);
  }
  return srcDir;
}

export function checkProjectSetup(): void {
  const cwd = process.cwd();
  const errors: string[] = [];

  // 1.1 Check index.html exists
  const indexPath = join(cwd, "index.html");
  if (!existsSync(indexPath)) {
    errors.push("react-mux: index.html not found in project root.");
  } else {
    // 1.2 Check if the original main.tsx script exists
    const indexHtml = readFileSync(indexPath, "utf-8");
    const mainScriptRegex =
      /<script[^>]*src\s*=\s*["']\/?src\/main\.(tsx|jsx|ts|js)["'][^>]*>/i;

    if (mainScriptRegex.test(indexHtml)) {
      errors.push(
        'react-mux: Found forbidden <script src="/src/main.*"> in index.html.\n' +
          "👉 Please remove this line from index.html.\n" +
          "   react-mux injects its own entry point dynamically."
      );
    }
  }

  // 2. Check that src/main.* does NOT exist
  const mainFiles = ["main.tsx", "main.jsx", "main.ts", "main.js"];
  const existingMainFiles = mainFiles.filter((file) =>
    existsSync(join(cwd, "src", file))
  );

  if (existingMainFiles.length > 0) {
    const fileList = existingMainFiles.map((f) => `src/${f}`).join(", ");
    errors.push(
      `react-mux: Found forbidden main file(s): ${fileList}.\n` +
        "👉 Please delete these files.\n" +
        "   react-mux uses a virtual entry point and does not need a main file."
    );
  }

  // Throw all errors at once (if any)
  if (errors.length > 0) {
    const fullMessage = [
      "❌ React Mux project setup check failed:\n",
      ...errors.map((err, i) => `\n${i + 1}. ${err}`),
      "\n\nFix the above issues and try again.",
    ].join("");
    throw new Error(fullMessage);
  }
}

export function findProjectFile(srcDir: string, projectName: string): string {
  for (const ext of PROJECT_VALID_EXTENSIONS) {
    if (existsSync(join(process.cwd(), srcDir, `${projectName}${ext}`))) {
      return `${projectName}${ext}`;
    }
  }
  throw new Error(
    `Project "${projectName}" not found in ${srcDir} (tried ${PROJECT_VALID_EXTENSIONS.join(
      ", "
    )})`
  );
}

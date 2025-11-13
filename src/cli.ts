#!/usr/bin/env node
import { Command } from "commander";
import { createServer } from "vite";
import { build as viteBuild } from "vite";
import {
  getAvailableProjects,
  selectProjectInteractively,
  validateProject,
  ensureDistClean,
  getNormalizedProjectDir,
  checkProjectSetup,
  findProjectFile,
} from "./utils.js";
import { MuxVitePlugin } from "./plugin.js";

const program = new Command();

program
  .name("react-mpx")
  .description("Run multiple React projects from one codebase")
  .version("0.1.0");

// dev command
program
  .command("dev")
  .description("Start dev server for a project")
  .option("-p, --project <name>", "Project name (e.g., moshaar-sms)")
  .option(
    "-s, --src <path>",
    "Path to projects directory (default: src/projects)",
    "src/projects"
  )
  .action(async (options) => {
    try {
      checkProjectSetup();
      const srcDir = getNormalizedProjectDir(options.src);
      const projects = getAvailableProjects(srcDir);
      if (projects.length <= 0) {
        throw new Error(`No projects found in the directory: ${srcDir}`);
      }
      let projectName = options.project;

      if (!projectName) {
        projectName = await selectProjectInteractively(projects);
      } else {
        validateProject(projectName, projects);
      }
      const projectFileName = findProjectFile(srcDir, projectName);

      const server = await createServer({
        plugins: [MuxVitePlugin(projectFileName, srcDir)],
      });

      await server.listen();
      const localUrl = (server as any).resolvedUrls.local[0];
      console.log(
        `\n🚀 React Multiplexer dev server running for "${projectName}"`
      );
      console.log(`   ${localUrl}\n`);
    } catch (err: any) {
      console.error(err.message ?? "");
      process.exit(1);
    }
  });

// build command
program
  .command("build")
  .description("Build project for production")
  .option("-p, --project <name>", "Project name (e.g., moshaar-sms)")
  .action(async (options) => {
    try {
      checkProjectSetup();
      const srcDir = getNormalizedProjectDir(options.src);
      const projects = getAvailableProjects(srcDir);
      if (projects.length <= 0) {
        throw new Error(`No projects found in the directory: ${srcDir}`);
      }
      let projectName = options.project;

      if (!projectName) {
        projectName = await selectProjectInteractively(projects);
      } else {
        validateProject(projectName, projects);
      }
      const projectFileName = findProjectFile(srcDir, projectName);

      ensureDistClean(projectName);
      // TODO: Support builds for multiple projects at once (dist/project-name)

      await viteBuild({
        plugins: [MuxVitePlugin(projectFileName, srcDir)],
        mode: projectName,
      });

      console.log(`\n✨ Built project "${projectName}"\n`);
    } catch (err: any) {
      console.error(err.message ?? "");
      process.exit(1);
    }
  });

// check command
program
  .command("check")
  .description("Validate project setup for react-mpx compatibility")
  .action(() => {
    try {
      checkProjectSetup();
      console.log("✅ Project is ready for react-mpx!");
    } catch (err: any) {
      console.error("\n❌ Project setup check failed:");
      console.error(err.message ?? "");
      process.exit(1);
    }
  });

program.parse();

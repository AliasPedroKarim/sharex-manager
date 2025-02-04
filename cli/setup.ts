#!/usr/bin/env bun
import { program } from "commander";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import chalk from "chalk";
import prompts from "prompts";

const DATA_DIR = join(process.cwd(), "data");
const CONFIG_DIR = join(process.cwd(), "config");

const DEFAULT_FILES = {
  "data/users.json": [],
  "data/history.json": [],
  "data/deletion-tokens.json": [],
  "data/api-keys.json": [],
  "config/uploads.json": {
    destination: "uploads",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/gif"],
    maxFileSize: 10485760, // 10MB
    filenamePattern: "{random}",
    imageCompression: {
      enabled: true,
      quality: 80,
    },
    thumbnails: {
      enabled: true,
      width: 200,
      height: 200,
    },
  },
};

function ensureDirectoryExists(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(chalk.green(`✅ Dossier créé : ${dir}`));
  }
}

async function createFile(path: string, content: any, force: boolean = false) {
  try {
    const fileExists = existsSync(path);

    if (fileExists && !force) {
      console.log(chalk.yellow(`⚠️ Le fichier existe déjà : ${path}`));
      return;
    }

    if (fileExists && force) {
      const response = await prompts({
        type: "confirm",
        name: "confirm",
        message: `⚠️ Êtes-vous sûr de vouloir écraser le fichier ${path} ?`,
        initial: false,
      });

      if (!response.confirm) {
        console.log(chalk.yellow(`⚠️ Opération annulée pour : ${path}`));
        return;
      }
    }

    writeFileSync(path, JSON.stringify(content, null, 2));
    console.log(
      chalk.green(
        `✅ Fichier ${fileExists ? "écrasé" : "créé"} avec succès : ${path}`
      )
    );
  } catch (error) {
    console.error(
      chalk.red(`❌ Erreur lors de la création du fichier ${path}`),
      error
    );
  }
}

async function setup(options: { force: boolean }) {
  console.log(chalk.blue("🚀 Configuration initiale de ShareX Manager..."));

  if (options.force) {
    console.log(
      chalk.yellow(
        "⚠️ Mode force activé : les fichiers existants pourront être écrasés"
      )
    );
  }

  // Création des dossiers nécessaires
  ensureDirectoryExists(DATA_DIR);
  ensureDirectoryExists(CONFIG_DIR);
  ensureDirectoryExists(join(process.cwd(), "uploads"));
  ensureDirectoryExists(join(process.cwd(), "uploads/thumbnails"));

  // Création des fichiers par défaut
  for (const [path, content] of Object.entries(DEFAULT_FILES)) {
    await createFile(join(process.cwd(), path), content, options.force);
  }

  console.log(chalk.green("\n✨ Configuration initiale terminée !"));
  console.log(chalk.yellow("\n⚠️ N'oubliez pas de :"));
  console.log("1. Modifier le mot de passe de l'administrateur par défaut");
  console.log("2. Configurer vos variables d'environnement (.env)");
  console.log("3. Vérifier les paramètres d'upload dans config/uploads.json");
}

program
  .name("setup")
  .description("Configuration initiale de ShareX Manager")
  .option(
    "-f, --force",
    "Force l'écrasement des fichiers existants (avec confirmation)",
    false
  )
  .action(setup);

program.parse();

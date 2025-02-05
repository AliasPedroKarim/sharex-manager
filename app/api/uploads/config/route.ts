import type { NextRequest } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { auth } from "@/auth";
import { defaultConfig } from "@/lib/defaultConfig";
import type { UploadConfig } from "@/lib/types/upload-config";

const CONFIG_FILE_PATH = join(process.cwd(), "config", "uploads.json");

async function getConfig(): Promise<UploadConfig> {
	try {
		const configData = await readFile(CONFIG_FILE_PATH, "utf-8");
		return JSON.parse(configData);
	} catch (error) {
		// Si le fichier n'existe pas ou est invalide, retourner la configuration par défaut
		return defaultConfig;
	}
}

async function saveConfig(config: UploadConfig): Promise<void> {
	await writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export async function GET() {
	const session = await auth();

	if (!session?.user) {
		return new Response("Non autorisé", { status: 401 });
	}

	try {
		const config = await getConfig();
		return Response.json(config);
	} catch (error) {
		console.error("Erreur lors de la lecture de la configuration:", error);
		return new Response("Erreur serveur", { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	const session = await auth();

	if (!session?.user) {
		return new Response("Non autorisé", { status: 401 });
	}

	try {
		const newConfig: UploadConfig = await request.json();

		// Validation basique
		if (
			typeof newConfig !== "object" ||
			!newConfig.allowedTypes ||
			typeof newConfig.limits.maxFileSize !== "number" ||
			typeof newConfig.filenamePattern !== "string" ||
			!newConfig.thumbnails ||
			!newConfig.storage
		) {
			return new Response("Configuration invalide", { status: 400 });
		}

		await saveConfig(newConfig);
		return new Response("Configuration sauvegardée", { status: 200 });
	} catch (error) {
		console.error("Erreur lors de la sauvegarde de la configuration:", error);
		return new Response("Erreur serveur", { status: 500 });
	}
}

"use client";

import {ApiKey} from "@/types/api-key";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {format} from "date-fns";
import {fr} from "date-fns/locale";
import {Copy} from "lucide-react";
import {toast} from "sonner";

interface ApiKeyDetailsDialogProps {
    apiKey: ApiKey | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ApiKeyDetailsDialog({
                                        apiKey,
                                        open,
                                        onOpenChange,
                                    }: ApiKeyDetailsDialogProps) {
    if (!apiKey) return null;

    const generateSxcuConfig = () => {
        const destinations = [];
        if (apiKey.permissions.uploadImages) destinations.push("ImageUploader");
        if (apiKey.permissions.uploadText) destinations.push("TextUploader");
        if (apiKey.permissions.uploadFiles) destinations.push("FileUploader");

        return {
            Version: "14.0.0",
            Name: "ShareX Upload",
            DestinationType: destinations.join(", "),
            RequestMethod: "POST",
            RequestURL: `${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/api/upload`,
            Headers: {
                "x-api-key": apiKey.key,
            },
            Body: "MultipartFormData",
            FileFormName: "file",
            URL: "{json:url}",
            ThumbnailURL: "{json:thumbnail_url}",
            DeletionURL: "{json:deletion_url}",
            ErrorMessage: "{json:error}",
        };
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Configuration copiée dans le presse-papier");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Détails de la clé API</DialogTitle>
                    <DialogDescription>
                        Informations et configuration pour {apiKey.name}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="details">
                    <TabsList>
                        <TabsTrigger value="details">Détails</TabsTrigger>
                        <TabsTrigger value="config">Configuration ShareX</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4">
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="font-semibold">Nom</div>
                                <div className="col-span-3">{apiKey.name}</div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="font-semibold">Clé</div>
                                <code className="col-span-3 rounded bg-muted px-2 py-1">
                                    {apiKey.key}
                                </code>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="font-semibold">Créée le</div>
                                <div className="col-span-3">
                                    {format(new Date(apiKey.createdAt), "PPP", {locale: fr})}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="font-semibold">Expire le</div>
                                <div className="col-span-3">
                                    {apiKey.expiresAt
                                        ? format(new Date(apiKey.expiresAt), "PPP", {locale: fr})
                                        : "Jamais"}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="font-semibold">Permissions</div>
                                <div className="col-span-3 flex gap-2">
                                    {apiKey.permissions.uploadImages && (
                                        <Badge variant="secondary">Images</Badge>
                                    )}
                                    {apiKey.permissions.uploadText && (
                                        <Badge variant="secondary">Texte</Badge>
                                    )}
                                    {apiKey.permissions.uploadFiles && (
                                        <Badge variant="secondary">Fichiers</Badge>
                                    )}
                                </div>
                            </div>
                            {apiKey.lastUsed && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <div className="font-semibold">Dernière utilisation</div>
                                    <div className="col-span-3">
                                        {format(new Date(apiKey.lastUsed), "PPP à HH:mm", {
                                            locale: fr,
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="config" className="space-y-6">
                        <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Cette configuration ShareX vous permet d'uploader directement des fichiers vers notre
                                service.
                                Les URLs de vos fichiers seront automatiquement copiées dans votre presse-papier après
                                l'upload.
                            </p>
                            <div className="space-y-2">
                                <h4 className="font-semibold">Instructions d'installation :</h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                    <li>
                                        Copiez la configuration en cliquant sur le bouton "Copier"
                                    </li>
                                    <li>
                                        Créez un nouveau fichier avec l'extension <code
                                        className="rounded bg-muted px-1">.sxcu</code>
                                    </li>
                                    <li>
                                        Collez la configuration dans ce fichier et sauvegardez-le
                                    </li>
                                    <li>
                                        Double-cliquez sur le fichier pour l'importer automatiquement dans ShareX
                                    </li>
                                    <li>
                                        La destination sera automatiquement configurée dans ShareX selon les permissions
                                        de votre clé
                                    </li>
                                </ol>
                            </div>
                        </div>

                        {(apiKey.permissions.uploadImages ||
                            apiKey.permissions.uploadText ||
                            apiKey.permissions.uploadFiles) ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Configuration ShareX</h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            copyToClipboard(
                                                JSON.stringify(generateSxcuConfig(), null, 2)
                                            )
                                        }
                                    >
                                        <Copy className="mr-2 h-4 w-4"/>
                                        Copier
                                    </Button>
                                </div>
                                <pre className="rounded-lg bg-muted p-4 overflow-auto">
                  <code>
                    {JSON.stringify(generateSxcuConfig(), null, 2)}
                  </code>
                </pre>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
                                <p className="text-sm text-destructive">
                                    Cette clé n'a aucune permission d'upload activée.
                                    Aucune configuration ShareX n'est disponible.
                                </p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
} 
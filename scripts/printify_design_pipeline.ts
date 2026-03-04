import fs from "fs/promises";
import path from "path";

type DesignJob = {
  id?: string;
  title: string;
  description?: string;
  tags?: string[];
  templateProductId: string;
  assetPath: string;
  replacePositions?: string[];
  visible?: boolean;
  publish?: boolean;
  keepEnabledVariantsOnly?: boolean;
  forceEnableAllVariants?: boolean;
  scaleOverride?: number;
  angleOverride?: number;
};

type UploadResponse = {
  id: string;
  file_name?: string;
  width?: number;
  height?: number;
  preview_url?: string;
  url?: string;
};

type PrintifyImageLayer = {
  id?: string;
  name?: string;
  type?: string;
  height?: number;
  width?: number;
  x?: number;
  y?: number;
  scale?: number;
  angle?: number;
  src?: string;
};

type PrintifyPlaceholder = {
  position?: string;
  images?: PrintifyImageLayer[];
  [key: string]: unknown;
};

type PrintifyPrintArea = {
  variant_ids?: number[];
  placeholders?: PrintifyPlaceholder[];
  [key: string]: unknown;
};

type PrintifyVariant = {
  id?: number;
  price?: number;
  is_enabled?: boolean;
  [key: string]: unknown;
};

type TemplateProduct = {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  blueprint_id: number;
  print_provider_id: number;
  variants?: PrintifyVariant[];
  print_areas?: PrintifyPrintArea[];
};

type ManifestEntry = {
  jobId: string;
  title: string;
  templateProductId: string;
  createdProductId: string;
  assetPath: string;
  uploadedAssetId: string;
  createdAt: string;
  published: boolean;
  publishStatus?: "published" | "skipped" | "failed";
  publishError?: string;
};

type Manifest = {
  updatedAt: string;
  entries: ManifestEntry[];
};

const REPO_ROOT = path.resolve(process.cwd());
const ENV_PATHS = [".env.local", ".env"];
const MANIFEST_PATH = path.join(REPO_ROOT, "design_jobs", "manifest.json");

const CONFIG = {
  printifyToken: process.env.PRINTIFY_TOKEN ?? "",
  printifyShopId: process.env.PRINTIFY_SHOP_ID ?? "",
};

async function loadEnvFile() {
  for (const filename of ENV_PATHS) {
    const fullPath = path.join(REPO_ROOT, filename);
    try {
      const raw = await fs.readFile(fullPath, "utf-8");
      raw
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .forEach((line) => {
          const [key, ...rest] = line.split("=");
          const value = rest.join("=").replace(/^['"]|['"]$/g, "");
          if (!process.env[key]) {
            process.env[key] = value;
          }
        });
      return;
    } catch {
      // ignore missing env files
    }
  }
}

const nowIso = () => new Date().toISOString();

const createJobId = () =>
  `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const mustHaveConfig = () => {
  if (!CONFIG.printifyToken || !CONFIG.printifyShopId) {
    throw new Error("Missing PRINTIFY_TOKEN or PRINTIFY_SHOP_ID in environment.");
  }
};

const printifyRequest = async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`https://api.printify.com/v1${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${CONFIG.printifyToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as T & { error?: string }) : ({} as T & { error?: string });
  if (!response.ok) {
    throw new Error(data.error || `Printify API ${response.status}: ${text.slice(0, 200)}`);
  }
  return data as T;
};

const normalizeJob = (raw: unknown): DesignJob => {
  if (!raw || typeof raw !== "object") {
    throw new Error("Job file must be a JSON object.");
  }
  const obj = raw as Record<string, unknown>;
  const title = String(obj.title ?? "").trim();
  const templateProductId = String(obj.templateProductId ?? "").trim();
  const assetPath = String(obj.assetPath ?? "").trim();
  if (!title) throw new Error("Job requires a non-empty title.");
  if (!templateProductId) throw new Error("Job requires templateProductId.");
  if (!assetPath) throw new Error("Job requires assetPath.");

  return {
    id: typeof obj.id === "string" && obj.id.trim() ? obj.id.trim() : undefined,
    title,
    description: typeof obj.description === "string" ? obj.description : undefined,
    tags: Array.isArray(obj.tags)
      ? obj.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean)
      : undefined,
    templateProductId,
    assetPath,
    replacePositions: Array.isArray(obj.replacePositions)
      ? obj.replacePositions
          .filter((position): position is string => typeof position === "string")
          .map((position) => position.trim().toLowerCase())
          .filter(Boolean)
      : undefined,
    visible: typeof obj.visible === "boolean" ? obj.visible : undefined,
    publish: typeof obj.publish === "boolean" ? obj.publish : undefined,
    keepEnabledVariantsOnly:
      typeof obj.keepEnabledVariantsOnly === "boolean" ? obj.keepEnabledVariantsOnly : undefined,
    forceEnableAllVariants:
      typeof obj.forceEnableAllVariants === "boolean" ? obj.forceEnableAllVariants : undefined,
    scaleOverride: typeof obj.scaleOverride === "number" ? obj.scaleOverride : undefined,
    angleOverride: typeof obj.angleOverride === "number" ? obj.angleOverride : undefined,
  };
};

const readJobFile = async (jobPath: string) => {
  const resolved = path.isAbsolute(jobPath) ? jobPath : path.join(REPO_ROOT, jobPath);
  const raw = await fs.readFile(resolved, "utf-8");
  const parsed = JSON.parse(raw);
  const job = normalizeJob(parsed);
  return { job, resolvedPath: resolved };
};

const readAssetBase64 = async (assetPath: string) => {
  const resolved = path.isAbsolute(assetPath) ? assetPath : path.join(REPO_ROOT, assetPath);
  const buffer = await fs.readFile(resolved);
  if (!buffer.length) throw new Error(`Asset is empty: ${resolved}`);
  return { resolvedPath: resolved, base64: buffer.toString("base64") };
};

const uploadAsset = async (assetPath: string): Promise<UploadResponse> => {
  const { resolvedPath, base64 } = await readAssetBase64(assetPath);
  const fileName = path.basename(resolvedPath);
  const upload = await printifyRequest<UploadResponse>("/uploads/images.json", {
    method: "POST",
    body: JSON.stringify({
      file_name: fileName,
      contents: base64,
    }),
  });
  if (!upload.id) {
    throw new Error("Upload did not return an image id.");
  }
  return upload;
};

const fetchTemplateProduct = async (templateProductId: string) => {
  return printifyRequest<TemplateProduct>(
    `/shops/${CONFIG.printifyShopId}/products/${templateProductId}.json`
  );
};

const buildImageLayer = (
  baseLayer: PrintifyImageLayer | undefined,
  uploaded: UploadResponse,
  job: DesignJob
): PrintifyImageLayer => {
  const layer: PrintifyImageLayer = {
    id: uploaded.id,
    name: uploaded.file_name ?? baseLayer?.name ?? "design.png",
    type: baseLayer?.type ?? "image/png",
    height: uploaded.height ?? baseLayer?.height ?? 1080,
    width: uploaded.width ?? baseLayer?.width ?? 1080,
    x: baseLayer?.x ?? 0.5,
    y: baseLayer?.y ?? 0.5,
    scale: job.scaleOverride ?? baseLayer?.scale ?? 1,
    angle: job.angleOverride ?? baseLayer?.angle ?? 0,
    src: uploaded.preview_url ?? uploaded.url ?? baseLayer?.src,
  };
  return layer;
};

const createProductFromTemplate = async (job: DesignJob, uploaded: UploadResponse) => {
  const template = await fetchTemplateProduct(job.templateProductId);
  if (!Array.isArray(template.variants) || !template.variants.length) {
    throw new Error("Template has no variants.");
  }
  if (!Array.isArray(template.print_areas) || !template.print_areas.length) {
    throw new Error("Template has no print_areas.");
  }

  const positionsToReplace = new Set((job.replacePositions?.length ? job.replacePositions : ["front"]).map((value) => value.toLowerCase()));

  const variants = template.variants
    .filter((variant) => {
      if (!job.keepEnabledVariantsOnly) return true;
      return variant.is_enabled ?? true;
    })
    .map((variant) => ({
      id: variant.id,
      price: variant.price,
      is_enabled: job.forceEnableAllVariants ? true : (variant.is_enabled ?? true),
    }))
    .filter((variant) => typeof variant.id === "number" && typeof variant.price === "number");

  if (!variants.length) {
    throw new Error("No variants remained after filtering.");
  }

  const printAreas = template.print_areas.map((area) => ({
    ...area,
    placeholders: (area.placeholders ?? []).map((placeholder) => {
      const position = String(placeholder.position ?? "").toLowerCase();
      if (!positionsToReplace.has(position)) {
        return placeholder;
      }
      const baseLayer = placeholder.images?.[0];
      return {
        ...placeholder,
        images: [buildImageLayer(baseLayer, uploaded, job)],
      };
    }),
  }));

  const payload = {
    title: job.title,
    description: job.description ?? template.description ?? "",
    blueprint_id: template.blueprint_id,
    print_provider_id: template.print_provider_id,
    tags: job.tags?.length ? job.tags : template.tags ?? [],
    visible: job.visible ?? false,
    variants,
    print_areas: printAreas,
  };

  const created = await printifyRequest<{ id: string }>(
    `/shops/${CONFIG.printifyShopId}/products.json`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  if (!created.id) {
    throw new Error("Product creation succeeded but id was missing.");
  }
  return created.id;
};

const publishProduct = async (productId: string) => {
  await printifyRequest(
    `/shops/${CONFIG.printifyShopId}/products/${productId}/publish.json`,
    {
      method: "POST",
      body: JSON.stringify({
        title: true,
        description: true,
        images: true,
        variants: true,
        tags: true,
        key_features: true,
        shipping_template: true,
      }),
    }
  );
};

const readManifest = async (): Promise<Manifest> => {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Manifest;
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.entries)) {
      return { updatedAt: nowIso(), entries: [] };
    }
    return parsed;
  } catch {
    return { updatedAt: nowIso(), entries: [] };
  }
};

const writeManifest = async (manifest: Manifest) => {
  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
};

const runJob = async (jobPath: string) => {
  const { job, resolvedPath } = await readJobFile(jobPath);
  const jobId = job.id ?? createJobId();
  console.log(`[design] Running job ${jobId} from ${resolvedPath}`);
  const uploaded = await uploadAsset(job.assetPath);
  console.log(`[design] Uploaded asset ${uploaded.id}`);
  const createdProductId = await createProductFromTemplate(job, uploaded);
  console.log(`[design] Created draft product ${createdProductId}`);

  let publishStatus: ManifestEntry["publishStatus"] = "skipped";
  let publishError: string | undefined;
  if (job.publish) {
    try {
      await publishProduct(createdProductId);
      publishStatus = "published";
      console.log(`[design] Published product ${createdProductId}`);
    } catch (error) {
      publishStatus = "failed";
      publishError = (error as Error).message;
      console.error(`[design] Publish failed for ${createdProductId}: ${publishError}`);
    }
  }

  const manifest = await readManifest();
  manifest.entries.push({
    jobId,
    title: job.title,
    templateProductId: job.templateProductId,
    createdProductId,
    assetPath: job.assetPath,
    uploadedAssetId: uploaded.id,
    createdAt: nowIso(),
    published: Boolean(job.publish),
    publishStatus,
    publishError,
  });
  manifest.updatedAt = nowIso();
  await writeManifest(manifest);

  return {
    jobId,
    createdProductId,
    uploadedAssetId: uploaded.id,
    publishStatus,
    publishError,
  };
};

const validateJob = async (jobPath: string) => {
  const { job, resolvedPath } = await readJobFile(jobPath);
  const assetResolved = path.isAbsolute(job.assetPath)
    ? job.assetPath
    : path.join(REPO_ROOT, job.assetPath);
  await fs.access(assetResolved);
  const positions = (job.replacePositions?.length ? job.replacePositions : ["front"]).join(", ");
  console.log(`[design] Job OK: ${resolvedPath}`);
  console.log(`[design] title=${job.title}`);
  console.log(`[design] templateProductId=${job.templateProductId}`);
  console.log(`[design] assetPath=${assetResolved}`);
  console.log(`[design] replacePositions=${positions}`);
};

const batchJobs = async (directory: string) => {
  const resolvedDir = path.isAbsolute(directory) ? directory : path.join(REPO_ROOT, directory);
  const files = await fs.readdir(resolvedDir);
  const jobFiles = files
    .filter((file) => file.endsWith(".json"))
    .filter((file) => !file.toLowerCase().includes("manifest"))
    .sort();
  if (!jobFiles.length) {
    console.log(`[design] No job files found in ${resolvedDir}`);
    return;
  }

  let success = 0;
  let failed = 0;
  for (const file of jobFiles) {
    const fullPath = path.join(resolvedDir, file);
    try {
      await runJob(fullPath);
      success += 1;
    } catch (error) {
      failed += 1;
      console.error(`[design] Job failed: ${file}`);
      console.error((error as Error).message);
    }
  }

  console.log(`[design] Batch complete. success=${success} failed=${failed}`);
};

async function main() {
  await loadEnvFile();
  CONFIG.printifyToken = process.env.PRINTIFY_TOKEN ?? "";
  CONFIG.printifyShopId = process.env.PRINTIFY_SHOP_ID ?? "";
  mustHaveConfig();

  const [, , command, argument] = process.argv;
  if (!command || !["run", "validate", "batch"].includes(command)) {
    console.log("Usage:");
    console.log("  npm run design:validate -- <job-json-path>");
    console.log("  npm run design:job -- <job-json-path>");
    console.log("  npm run design:batch -- <job-directory>");
    process.exit(1);
  }

  if (command === "validate") {
    if (!argument) throw new Error("Missing job path for validate command.");
    await validateJob(argument);
    return;
  }

  if (command === "run") {
    if (!argument) throw new Error("Missing job path for run command.");
    const result = await runJob(argument);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "batch") {
    await batchJobs(argument ?? "design_jobs/approved");
  }
}

main().catch((error) => {
  console.error("[design] pipeline failed:");
  console.error((error as Error).message);
  process.exit(1);
});

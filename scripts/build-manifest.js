const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../library");

function readMetadata(filePath) {
  const metaPath = filePath + ".json";

  if (fs.existsSync(metaPath)) {
    try {
      return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    } catch (e) {
      console.warn("Bad metadata:", metaPath);
      return {};
    }
  }

  return {};
}

function getFileStats(fullPath) {
  const stat = fs.statSync(fullPath);

  return {
    size: stat.size,
    modifiedDate: stat.mtime.toISOString(),
    // "addedDate" is best-effort
    addedDate: stat.birthtime?.toISOString() || stat.ctime.toISOString()
  };
}

function buildTree(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries
    .filter(e => !e.name.endsWith(".json")) // ignore metadata files
    .map((entry) => {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return {
          name: entry.name,
          type: "folder",
          children: buildTree(full)
        };
      }

      const stats = getFileStats(full);
      const meta = readMetadata(full);

      return {
        name: entry.name,
        type: "file",
        path: full.replace(path.join(__dirname, ".."), "").replace(/\\/g, "/"),

        // file system info
        size: stats.size,
        addedDate: meta.addedDate || stats.addedDate,
        modifiedDate: stats.modifiedDate,

        // user-defined metadata
        description: meta.description || "",
        documentDate: meta.documentDate || null,
        tags: meta.tags || []
      };
    });
}

const tree = buildTree(ROOT);

fs.writeFileSync(
  path.join(__dirname, "../manifest.json"),
  JSON.stringify(tree, null, 2)
);

console.log("manifest generated");
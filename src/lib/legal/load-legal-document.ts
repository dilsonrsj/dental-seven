import { readFile } from "fs/promises";
import path from "path";

export async function loadLegalDocument(filename: string): Promise<string> {
  const filePath = path.join(process.cwd(), "src", "content", "legal", filename);
  return readFile(filePath, "utf8");
}

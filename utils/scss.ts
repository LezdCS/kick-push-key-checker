import * as sass from "sass";

export async function compileSass(filepath: string): Promise<string> {
  const result = sass.compile(filepath);
  return result.css;
}
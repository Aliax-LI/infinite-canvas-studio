import { readFile } from "node:fs/promises";

const matrix = await readFile(
  new URL("../docs/FEATURE_PARITY_MATRIX.md", import.meta.url),
  "utf8",
);
const ids = [...matrix.matchAll(/^\| (IC-[A-Z]+-\d{3}) /gm)].map(
  (match) => match[1],
);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

if (!matrix.includes("bc7efbde9ddab02f11abf738d7309b5689dbfa22")) {
  throw new Error("功能复刻矩阵缺少冻结基线提交。");
}

if (ids.length < 40) {
  throw new Error(`功能复刻矩阵条目不足：${ids.length}。`);
}

if (duplicates.length > 0) {
  throw new Error(
    `功能复刻矩阵存在重复编号：${[...new Set(duplicates)].join(", ")}`,
  );
}

console.log(`功能复刻矩阵校验通过：${ids.length} 项。`);

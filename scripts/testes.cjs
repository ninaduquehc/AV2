
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const pastaTestes = path.resolve(".greencode-test-data");

if (fs.existsSync(pastaTestes)) {
  fs.rmSync(pastaTestes, { recursive: true, force: true });
}

const testes = [
  "src/testes/jornada.ts",
  "src/testes/falhas.ts",
  "src/testes/crud.ts",
];

let codigoSaida = 0;

try {
  for (const teste of testes) {
    console.log(`\nExecutando ${teste}...\n`);

    const resultado = spawnSync(
      process.execPath,
      ["-r", "ts-node/register", teste],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          GREENCODE_DATA_DIR: pastaTestes,
        },
      }
    );

    if (resultado.error) {
      console.error(resultado.error);
      codigoSaida = 1;
      break;
    }

    if (resultado.status !== 0) {
      codigoSaida = resultado.status ?? 1;
      break;
    }
  }
} finally {
  if (fs.existsSync(pastaTestes)) {
    fs.rmSync(pastaTestes, { recursive: true, force: true });
  }
}

process.exitCode = codigoSaida;

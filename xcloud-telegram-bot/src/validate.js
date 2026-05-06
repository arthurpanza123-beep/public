const { runValidationSuite } = require('./validations');

let failed = false;

for (const result of runValidationSuite()) {
  console.log(`${result.ok ? 'OK' : 'ERRO'} - ${result.name}`);
  if (!result.ok) failed = true;
}

if (failed) {
  process.exitCode = 1;
}

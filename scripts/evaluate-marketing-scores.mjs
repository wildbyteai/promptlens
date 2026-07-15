#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const OPENAI_API_BASE_URL = 'https://api.openai.com/v1';
export const SYNTHETIC_FIXTURE_FILENAMES = Object.freeze([
  '01_luxury_serum.png',
  '02_coffee_promo.png',
  '03_saas_launch.png',
  '04_balanced_sale.png',
  '05_busy_catalog.png',
  '06_low_contrast.png',
  '07_conflicting_hierarchy.png',
  '08_poor_crop.png',
  '09_noisy_flyer.png',
  '10_blank_placeholder.png'
]);
const TEXT_PRESERVATION_FIXTURES = new Set(SYNTHETIC_FIXTURE_FILENAMES.slice(0, 4));
const MIME_TYPES = Object.freeze({
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
});
const ANATOMY_TERM_PATTERN = /\b(?:anatomy|hands?|fingers?|limbs?|faces?)\b/i;
const TEXT_TERM_PATTERN = /\b(?:text|typography|letters?|logos?|watermarks?)\b/i;

export function populationStandardDeviation(values) {
  if (!Array.isArray(values) || values.length === 0) throw new Error('At least one numeric score is required.');
  const numbers = values.map(value => Number(value));
  if (numbers.some(value => !Number.isFinite(value))) throw new Error('Every score must be numeric.');
  const mean = numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  const variance = numbers.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / numbers.length;
  return Math.sqrt(variance);
}

export function readinessScoreFromResult(result) {
  const score = Number(
    result
      && result.marketing_diagnosis
      && result.marketing_diagnosis.marketing_diagnosis
      && result.marketing_diagnosis.marketing_diagnosis.marketing_readiness_score
      && result.marketing_diagnosis.marketing_diagnosis.marketing_readiness_score.overall
  );
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error('The result does not contain a valid 1-5 marketing readiness score.');
  }
  return score;
}

export function negativePromptContractViolations(result, expectations = {}) {
  const negativePrompt = String(result && result.negative_prompt || '');
  const violations = [];
  if (expectations.containsPerson === false && ANATOMY_TERM_PATTERN.test(negativePrompt)) {
    violations.push('anatomy_terms_without_person');
  }
  if (expectations.expectTextPreserved && TEXT_TERM_PATTERN.test(negativePrompt)) {
    violations.push('text_terms_for_intended_text');
  }
  return violations;
}

function parseArgs(argv) {
  const options = {
    imagesDir: 'dist/marketing-eval-fixtures',
    model: process.env.PROMPTLENS_EVAL_MODEL || 'gpt-4o-mini',
    output: path.join('dist', 'marketing-score-evaluation.json'),
    threshold: 1.5
  };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!['--images', '--model', '--threshold'].includes(key) || value === undefined) {
      throw new Error(`Unsupported or incomplete argument: ${key}`);
    }
    if (key === '--images') options.imagesDir = value;
    if (key === '--model') options.model = value;
    if (key === '--threshold') options.threshold = Number(value);
    index += 1;
  }
  if (!Number.isFinite(options.threshold) || options.threshold < 0) throw new Error('Threshold must be a non-negative number.');
  return options;
}

function loadRuntime() {
  globalThis.window = globalThis;
  globalThis.PromptLensI18n = {
    normalizeLanguage: value => value === 'en' ? 'en' : 'zh-CN',
    t: key => key,
    createError: key => new Error(key)
  };
  globalThis.chrome = {
    storage: {
      local: {
        get: async defaults => defaults,
        set: async () => {}
      }
    }
  };
  const schemas = require('../prompt-schemas.js');
  globalThis.PromptSchemas = schemas;
  const compiler = require('../prompt-compiler.js');
  const adapters = require('../model-adapters.js');
  const validator = require('../output-validator.js');
  require('../templates.js');
  const template = globalThis.PromptTemplates.getBuiltInTemplateById('visual_marketing');
  return { adapters, compiler, template, validator };
}

function imageDataUrl(filename) {
  const extension = path.extname(filename).toLowerCase();
  const mimeType = MIME_TYPES[extension];
  if (!mimeType) throw new Error(`Unsupported fixture image: ${filename}`);
  return `data:${mimeType};base64,${fs.readFileSync(filename).toString('base64')}`;
}

function sha256File(filename) {
  return createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
}

export function validateSyntheticFixtureManifest(manifest) {
  if (!manifest || manifest.kind !== 'synthetic-marketing-quality-benchmark') {
    throw new Error('The image directory is not a PromptLens synthetic marketing benchmark.');
  }
  if (manifest.sampleCount !== SYNTHETIC_FIXTURE_FILENAMES.length || !Array.isArray(manifest.fixtures)) {
    throw new Error('The synthetic fixture manifest must describe exactly 10 images.');
  }
  const fixturesByFilename = new Map();
  for (const fixture of manifest.fixtures) {
    const filename = fixture && String(fixture.filename || '');
    if (!SYNTHETIC_FIXTURE_FILENAMES.includes(filename) || fixturesByFilename.has(filename)) {
      throw new Error(`Unexpected or duplicate synthetic fixture: ${filename || '(missing filename)'}`);
    }
    if (!/^[a-f0-9]{64}$/.test(String(fixture.sha256 || ''))) {
      throw new Error(`Synthetic fixture is missing a valid SHA-256 digest: ${filename}`);
    }
    if (fixture.containsPerson !== false) {
      throw new Error(`Synthetic fixture person expectation is invalid: ${filename}`);
    }
    if (fixture.expectTextPreserved !== TEXT_PRESERVATION_FIXTURES.has(filename)) {
      throw new Error(`Synthetic fixture text expectation is invalid: ${filename}`);
    }
    fixturesByFilename.set(filename, fixture);
  }
  for (const filename of SYNTHETIC_FIXTURE_FILENAMES) {
    if (!fixturesByFilename.has(filename)) throw new Error(`Synthetic fixture manifest is missing: ${filename}`);
  }
  return fixturesByFilename;
}

function listImages(imagesDir) {
  const resolved = path.resolve(imagesDir);
  const manifestPath = path.join(resolved, 'manifest.json');
  if (!fs.existsSync(manifestPath)) throw new Error('The synthetic fixture manifest is missing.');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const fixturesByFilename = validateSyntheticFixtureManifest(manifest);
  return SYNTHETIC_FIXTURE_FILENAMES.map(filename => {
    const absoluteFilename = path.join(resolved, filename);
    if (!fs.existsSync(absoluteFilename) || !fs.statSync(absoluteFilename).isFile()) {
      throw new Error(`Synthetic fixture file is missing: ${filename}`);
    }
    const fixture = fixturesByFilename.get(filename);
    if (sha256File(absoluteFilename) !== fixture.sha256) {
      throw new Error(`Synthetic fixture digest mismatch: ${filename}`);
    }
    return { filename: absoluteFilename, expectations: fixture };
  });
}

async function analyzeImage(runtime, options, sample) {
  const filename = sample.filename;
  const compiledPrompt = runtime.compiler.compile(runtime.template, {
    outputLanguage: 'zh-CN',
    businessContext: 'Synthetic marketing creative benchmark. Judge only visible design and message evidence.',
    targetPlatform: 'generic'
  });
  const renderedPrompt = runtime.compiler.renderApiPrompt(compiledPrompt, { schemaMode: 'native' });
  const request = runtime.adapters.buildRequest('openai_compatible', {
    config: {
      apiBaseUrl: OPENAI_API_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
      apiModel: options.model,
      structuredOutputMode: 'json_schema'
    },
    compiledPrompt,
    renderedPrompt,
    imageDataUrl: imageDataUrl(filename)
  });
  const response = await fetch(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(request.body)
  });
  const responseJson = await response.json().catch(() => null);
  if (!response.ok) {
    const message = responseJson && responseJson.error && responseJson.error.message
      ? responseJson.error.message
      : `${response.status} ${response.statusText}`;
    throw new Error(`Model request failed for ${path.basename(filename)}: ${message}`);
  }
  runtime.validator.assertResponseNotTruncated(responseJson);
  const parsedResponse = runtime.adapters.parseResponse('openai_compatible', responseJson);
  const result = JSON.parse(parsedResponse.text);
  const validation = runtime.validator.validateOutput(result, {
    schemaId: compiledPrompt.schemaId,
    profileId: compiledPrompt.profileId
  });
  return {
    filename: path.basename(filename),
    score: readinessScoreFromResult(result),
    negativePromptContractViolations: negativePromptContractViolations(result, sample.expectations),
    validationStatus: validation.status,
    warningCodes: validation.warnings.map(item => item.code)
  };
}

export async function runEvaluation(options) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required.');
  const runtime = loadRuntime();
  const images = listImages(options.imagesDir);
  const results = [];
  for (const [index, sample] of images.entries()) {
    process.stdout.write(`[${index + 1}/${images.length}] ${path.basename(sample.filename)} ... `);
    const result = await analyzeImage(runtime, options, sample);
    results.push(result);
    process.stdout.write(`score=${result.score}\n`);
  }
  const scores = results.map(result => result.score);
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const standardDeviation = populationStandardDeviation(scores);
  const negativePromptViolationCount = results.reduce(
    (count, result) => count + result.negativePromptContractViolations.length,
    0
  );
  const scoreDispersionPassed = standardDeviation > options.threshold;
  const negativePromptContractPassed = negativePromptViolationCount === 0;
  const report = {
    kind: 'promptlens-marketing-score-dispersion',
    generatedAt: new Date().toISOString(),
    model: options.model,
    sampleCount: results.length,
    scoreScale: [1, 5],
    scores,
    mean,
    standardDeviation,
    requiredStandardDeviation: options.threshold,
    scoreDispersionPassed,
    negativePromptViolationCount,
    negativePromptContractPassed,
    passed: scoreDispersionPassed && negativePromptContractPassed,
    results
  };
  const outputPath = path.resolve(options.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return { outputPath, report };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { outputPath, report } = await runEvaluation(options);
  console.log(`Mean score: ${report.mean.toFixed(2)}`);
  console.log(`Population standard deviation: ${report.standardDeviation.toFixed(3)}`);
  console.log(`Required: > ${report.requiredStandardDeviation.toFixed(3)}`);
  console.log(`Negative Prompt contract violations: ${report.negativePromptViolationCount}`);
  console.log(`Result: ${report.passed ? 'PASS' : 'FAIL'}`);
  console.log(`Report: ${outputPath}`);
  if (!report.passed) process.exitCode = 2;
}

const entryUrl = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (entryUrl === import.meta.url) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

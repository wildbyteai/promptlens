const assert = require('node:assert/strict');

(async () => {
  const evaluation = await import('../scripts/evaluate-marketing-scores.mjs');

  assert.equal(
    evaluation.populationStandardDeviation([1, 1, 1, 1, 1, 5, 5, 5, 5, 5]),
    2
  );
  assert.throws(
    () => evaluation.populationStandardDeviation([]),
    /At least one numeric score/
  );
  assert.throws(
    () => evaluation.populationStandardDeviation([1, 'invalid']),
    /Every score must be numeric/
  );

  assert.equal(evaluation.readinessScoreFromResult({
    marketing_diagnosis: {
      marketing_diagnosis: {
        marketing_readiness_score: { overall: 4 }
      }
    }
  }), 4);
  assert.throws(
    () => evaluation.readinessScoreFromResult({}),
    /valid 1-5 marketing readiness score/
  );

  assert.deepEqual(evaluation.negativePromptContractViolations({
    negative_prompt: 'blur, compression artifacts, bad crop, color banding, anatomy, watermark'
  }, {
    containsPerson: false,
    expectTextPreserved: true
  }), [
    'anatomy_terms_without_person',
    'text_terms_for_intended_text'
  ]);
  assert.deepEqual(evaluation.negativePromptContractViolations({
    negative_prompt: 'blur, compression artifacts, bad crop, color banding, harsh shadows, oversaturation'
  }, {
    containsPerson: false,
    expectTextPreserved: true
  }), []);

  const validManifest = {
    kind: 'synthetic-marketing-quality-benchmark',
    sampleCount: 10,
    fixtures: evaluation.SYNTHETIC_FIXTURE_FILENAMES.map(filename => ({
      filename,
      sha256: 'a'.repeat(64),
      containsPerson: false,
      expectTextPreserved: /^0[1-4]_/.test(filename)
    }))
  };
  const fixturesByFilename = evaluation.validateSyntheticFixtureManifest(validManifest);
  assert.equal(fixturesByFilename.size, 10);
  assert.throws(
    () => evaluation.validateSyntheticFixtureManifest({ ...validManifest, kind: 'custom-images' }),
    /not a PromptLens synthetic marketing benchmark/
  );
  assert.throws(
    () => evaluation.validateSyntheticFixtureManifest({
      ...validManifest,
      fixtures: validManifest.fixtures.map((fixture, index) => index === 0 ? { ...fixture, sha256: '' } : fixture)
    }),
    /missing a valid SHA-256 digest/
  );
  assert.throws(
    () => evaluation.validateSyntheticFixtureManifest({
      ...validManifest,
      fixtures: validManifest.fixtures.map((fixture, index) => index === 0 ? { ...fixture, containsPerson: true } : fixture)
    }),
    /person expectation is invalid/
  );

  console.log('marketing score evaluation tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

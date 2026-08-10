import { buildF591F620GeneralImprovements } from '../src/lib/f591F620GeneralImprovements.ts';

const summary = buildF591F620GeneralImprovements();
const expanded = buildF591F620GeneralImprovements({ inspectorMode: 'expanded', canvasPanelsVisible: true });
const failures = [];
const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

expect('schema value', summary.schema === 'radshield-mx.general-improvements.f591-f620.v1');
expect('phase value', summary.phaseRange === 'F591-F620');
expect('six tracks', summary.tracks.length === 6);
expect('summary tracks match', summary.summary.totalTracks === summary.tracks.length);
expect('compact by default', summary.inspectorMode === 'compact');
expect('expanded input supported', expanded.inspectorMode === 'expanded');
expect('clinical certification remains false', summary.gates.clinicalCertification === false);
expect('unity visual-only gate remains true', summary.gates.unityVisualOnly === true);
expect('db live required', summary.gates.dbLiveRequiredForClinicalClaims === true);
expect('real memories required', summary.gates.realMemoriesRequiredForClinicalQa === true);
expect('canvas declutter gate true in compact', summary.gates.canvasDecluttered === true);
expect('canvas declutter gate false when expanded/panels visible', expanded.gates.canvasDecluttered === false);
expect('all recommended phases present', ['F591-F595', 'F596-F600', 'F601-F605', 'F606-F610', 'F611-F615', 'F616-F620'].every((phase) => summary.tracks.some((track) => track.phaseRange === phase)));
expect('screenshots complete', summary.screenshots.length === 4 && summary.screenshots.every((path) => path.includes('f591_f620_general_improvements')));

if (failures.length) {
  console.error(`F591-F620 general improvements values failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`[F591-F620] General improvements values OK (${summary.tracks.length} tracks).`);

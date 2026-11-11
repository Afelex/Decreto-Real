import { test,expect } from 'vitest';
import { g2SceneAssignments } from '../../campaign/studio/g2SceneAssignments.ts';
import { G2_ASSET_PATHS } from '../../campaign/g2Artwork.ts';
test('Studio G2 maps 38 missions, 8 regions and 18 final preludes',()=>{
 const rows=g2SceneAssignments();
 expect(rows).toHaveLength(38*2+8*2+12+6);
 expect(new Set(rows.map(x=>x.key)).size).toBe(rows.length);
 for(const a of rows)expect(G2_ASSET_PATHS[a.assetId]).toBeDefined();
 const find=(key:string)=>rows.find(x=>x.key===key)?.assetId;
 expect(find('mision-35/briefing')).toBe('G2-M35-A');
 expect(find('mision-35/preludio-06')).toBe('G2-M35-B');
 expect(find('mision-35/preludio-12')).toBe('G2-M35-C');
 expect(find('mision-35/duelo')).toBe('G2-M35-C');
 expect(find('mision-36/preludio-01')).toBe('G2-M36-A');
 expect(find('mision-36/preludio-02')).toBe('G2-M36-B');
 expect(find('mision-36/duelo')).toBe('G2-M36-B');
});

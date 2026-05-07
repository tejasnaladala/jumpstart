// Minimal repro of the SWC constant-folding bug that mangled
// FounderPass TICKET_PATH at build time. The pattern:
//   - one or more template literals concatenated with `+`
//   - each literal ends with whitespace after its final `${}` substitution
//   - the build's constant evaluator drops the trailing static segment
//
// Run via tsx: `bun x tsx harness/scripts/repro-swc-bug.ts`. Expected
// output: source produces correct path; SWC build (read from
// .next/server/chunks/) drops parts.

const A = 700;
const B = 480;
const X = 605.2;
const R = 14;

// Same shape as FounderPass.tsx TICKET_PATH
const SUSPECT =
  `M20,0 H${A - 20} A20,20 0 0 1 ${A},20 V${B - 20} A20,20 0 0 1 ${A - 20},${B} ` +
  `H20 A20,20 0 0 1 0,${B - 20} V20 A20,20 0 0 1 20,0 Z ` +
  `M${X - R},0 a${R},${R} 0 1,1 ${R * 2},0 a${R},${R} 0 1,1 -${R * 2},0 Z ` +
  `M${X - R},${B} a${R},${R} 0 1,1 ${R * 2},0 a${R},${R} 0 1,1 -${R * 2},0 Z`;

// Variant A: use array.join (defeats constant folding)
const FIX_JOIN = [
  `M20,0 H${A - 20} A20,20 0 0 1 ${A},20 V${B - 20} A20,20 0 0 1 ${A - 20},${B}`,
  `H20 A20,20 0 0 1 0,${B - 20} V20 A20,20 0 0 1 20,0 Z`,
  `M${X - R},0 a${R},${R} 0 1,1 ${R * 2},0 a${R},${R} 0 1,1 -${R * 2},0 Z`,
  `M${X - R},${B} a${R},${R} 0 1,1 ${R * 2},0 a${R},${R} 0 1,1 -${R * 2},0 Z`,
].join(" ");

// Variant B: trailing whitespace moved to start of next literal
const FIX_LEADING_WS =
  `M20,0 H${A - 20} A20,20 0 0 1 ${A},20 V${B - 20} A20,20 0 0 1 ${A - 20},${B}` +
  ` H20 A20,20 0 0 1 0,${B - 20} V20 A20,20 0 0 1 20,0 Z` +
  ` M${X - R},0 a${R},${R} 0 1,1 ${R * 2},0 a${R},${R} 0 1,1 -${R * 2},0 Z` +
  ` M${X - R},${B} a${R},${R} 0 1,1 ${R * 2},0 a${R},${R} 0 1,1 -${R * 2},0 Z`;

console.log(`SUSPECT          (len=${SUSPECT.length}): ${SUSPECT}`);
console.log("");
console.log(`FIX_JOIN         (len=${FIX_JOIN.length}): ${FIX_JOIN}`);
console.log("");
console.log(`FIX_LEADING_WS   (len=${FIX_LEADING_WS.length}): ${FIX_LEADING_WS}`);
console.log("");
console.log(`SUSPECT === FIX_JOIN ? ${SUSPECT === FIX_JOIN}`);
console.log(`SUSPECT === FIX_LEADING_WS ? ${SUSPECT === FIX_LEADING_WS}`);

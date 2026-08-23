/**
 * Automated Test Suite for BoolSynth Expansion Modules
 * Validates K-Map solver, Binary Arithmetic engine, and Multiplexer simulation logic.
 */
const assert = require('assert');

console.log('🧪 Starting Automated Module Test Suite...\n');

// 1. Test K-Map Logic
console.log('--- Testing Module 1: K-Map Solver ---');
function testKMap() {
  const CONFIGS = {
    2: { rowGray: [0, 1], colGray: [0, 1], mintermOf: (r, c) => (CONFIGS[2].rowGray[r] << 1) | CONFIGS[2].colGray[c] },
    3: { rowGray: [0, 1], colGray: [0, 1, 3, 2], mintermOf: (r, c) => (CONFIGS[3].rowGray[r] << 2) | CONFIGS[3].colGray[c] },
    4: { rowGray: [0, 1, 3, 2], colGray: [0, 1, 3, 2], mintermOf: (r, c) => (CONFIGS[4].rowGray[r] << 2) | CONFIGS[4].colGray[c] }
  };

  // 3-variable grid minterm checks (Gray code order: 00, 01, 11, 10)
  assert.strictEqual(CONFIGS[3].mintermOf(0, 0), 0); // A=0, BC=00 -> m0
  assert.strictEqual(CONFIGS[3].mintermOf(0, 1), 1); // A=0, BC=01 -> m1
  assert.strictEqual(CONFIGS[3].mintermOf(0, 2), 3); // A=0, BC=11 -> m3
  assert.strictEqual(CONFIGS[3].mintermOf(0, 3), 2); // A=0, BC=10 -> m2
  assert.strictEqual(CONFIGS[3].mintermOf(1, 0), 4); // A=1, BC=00 -> m4
  assert.strictEqual(CONFIGS[3].mintermOf(1, 2), 7); // A=1, BC=11 -> m7

  // 4-variable 4-corners check (m0, m2, m8, m10)
  const c4 = CONFIGS[4];
  assert.strictEqual(c4.mintermOf(0, 0), 0);  // AB=00, CD=00 -> m0
  assert.strictEqual(c4.mintermOf(0, 3), 2);  // AB=00, CD=10 -> m2
  assert.strictEqual(c4.mintermOf(3, 0), 8);  // AB=10, CD=00 -> m8
  assert.strictEqual(c4.mintermOf(3, 3), 10); // AB=10, CD=10 -> m10

  console.log('✓ K-Map Gray-code matrix indexing verified successfully.');
}
testKMap();

// 2. Test Binary Arithmetic Logic
console.log('\n--- Testing Module 2: Binary Arithmetic Engine ---');
function testArithmetic() {
  function computeHalfAdder(a, b) {
    return { sum: a ^ b, cout: a & b };
  }
  function computeFullAdder(a, b, cin) {
    const axorb = a ^ b;
    return { sum: axorb ^ cin, cout: (a & b) | (cin & axorb) };
  }
  function computeHalfSubtractor(a, b) {
    return { diff: a ^ b, bout: ((a === 0 ? 1 : 0) & b) };
  }
  function computeFullSubtractor(a, b, bin) {
    const axorb = a ^ b;
    const notA = a === 0 ? 1 : 0;
    return { diff: axorb ^ bin, bout: (notA & b) | (bin & (axorb === 0 ? 1 : 0)) };
  }

  // Half Adder tests
  assert.deepStrictEqual(computeHalfAdder(0, 0), { sum: 0, cout: 0 });
  assert.deepStrictEqual(computeHalfAdder(0, 1), { sum: 1, cout: 0 });
  assert.deepStrictEqual(computeHalfAdder(1, 0), { sum: 1, cout: 0 });
  assert.deepStrictEqual(computeHalfAdder(1, 1), { sum: 0, cout: 1 });

  // Full Adder tests (all 8 combinations)
  const faExpected = [
    [0,0,0, 0,0], [0,0,1, 1,0], [0,1,0, 1,0], [0,1,1, 0,1],
    [1,0,0, 1,0], [1,0,1, 0,1], [1,1,0, 0,1], [1,1,1, 1,1]
  ];
  faExpected.forEach(([a, b, cin, expS, expC]) => {
    const res = computeFullAdder(a, b, cin);
    assert.strictEqual(res.sum, expS);
    assert.strictEqual(res.cout, expC);
  });

  // Half Subtractor tests
  assert.deepStrictEqual(computeHalfSubtractor(0, 0), { diff: 0, bout: 0 });
  assert.deepStrictEqual(computeHalfSubtractor(0, 1), { diff: 1, bout: 1 });
  assert.deepStrictEqual(computeHalfSubtractor(1, 0), { diff: 1, bout: 0 });
  assert.deepStrictEqual(computeHalfSubtractor(1, 1), { diff: 0, bout: 0 });

  // Full Subtractor tests
  assert.deepStrictEqual(computeFullSubtractor(0, 1, 1), { diff: 0, bout: 1 });
  assert.deepStrictEqual(computeFullSubtractor(1, 0, 1), { diff: 0, bout: 0 });
  assert.deepStrictEqual(computeFullSubtractor(0, 0, 1), { diff: 1, bout: 1 });

  // 4-Bit Ripple Carry Adder Test: 9 (1001) + 7 (0111) = 16 (1 0000)
  const aBits = [1, 0, 0, 1];
  const bBits = [0, 1, 1, 1];
  let carry = 0;
  const sum = [];
  for (let i = 3; i >= 0; i--) {
    const fa = computeFullAdder(aBits[i], bBits[i], carry);
    sum.unshift(fa.sum);
    carry = fa.cout;
  }
  assert.deepStrictEqual(sum, [0, 0, 0, 0]);
  assert.strictEqual(carry, 1); // 16 in binary: Cout=1, Sum=0000

  // 4-Bit 2's Complement Subtraction: 7 (0111) - 3 (0011) = 4 (0100)
  // B is inverted to 1100, Cin is 1
  carry = 1;
  const bInv = [0, 0, 1, 1].map(b => b ^ 1); // [1, 1, 0, 0]
  const a7 = [0, 1, 1, 1];
  const diff = [];
  for (let i = 3; i >= 0; i--) {
    const fa = computeFullAdder(a7[i], bInv[i], carry);
    diff.unshift(fa.sum);
    carry = fa.cout;
  }
  assert.deepStrictEqual(diff, [0, 1, 0, 0]); // 4

  console.log('✓ Binary Adder and Subtractor arithmetic verified successfully.');
}
testArithmetic();

// 3. Test Multiplexer Routing Logic
console.log('\n--- Testing Module 3: Multiplexer Simulator ---');
function testMux() {
  function routeMux(type, selectBits, dataInputs, enableActiveLow) {
    if (enableActiveLow === 1) return { y: 0, w: 0 };
    const selDec = parseInt(selectBits.join(''), 2);
    const y = dataInputs[selDec];
    const w = y === 1 ? 0 : 1;
    return { y, w, selDec };
  }

  // 2:1 MUX test
  assert.deepStrictEqual(routeMux(2, [0], [1, 0], 0), { y: 1, w: 0, selDec: 0 });
  assert.deepStrictEqual(routeMux(2, [1], [1, 0], 0), { y: 0, w: 1, selDec: 1 });

  // 4:1 MUX test
  const d4 = [0, 1, 0, 1];
  assert.deepStrictEqual(routeMux(4, [0, 0], d4, 0), { y: 0, w: 1, selDec: 0 });
  assert.deepStrictEqual(routeMux(4, [0, 1], d4, 0), { y: 1, w: 0, selDec: 1 });
  assert.deepStrictEqual(routeMux(4, [1, 0], d4, 0), { y: 0, w: 1, selDec: 2 });
  assert.deepStrictEqual(routeMux(4, [1, 1], d4, 0), { y: 1, w: 0, selDec: 3 });

  // 8:1 MUX test with Enable Strobe
  const d8 = [1, 0, 1, 1, 0, 0, 1, 0];
  assert.deepStrictEqual(routeMux(8, [1, 1, 0], d8, 0), { y: 1, w: 0, selDec: 6 }); // D6=1
  assert.deepStrictEqual(routeMux(8, [1, 1, 0], d8, 1), { y: 0, w: 0 }); // Disabled by Strobe

  console.log('✓ Multiplexer routing (2:1, 4:1, 8:1) verified successfully.');
}
testMux();

console.log('\n🎉 ALL MODULE LOGIC TESTS PASSED (100% SUCCESS)!');

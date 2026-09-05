/**
 * SECURE TEST CASE GENERATOR
 * ─────────────────────────────────────────────────────────────────────────────
 * All test cases and reference solutions live ONLY on this server.
 * They are NEVER serialized into any API response.
 * The client only ever receives: passed, total, executionMs, memoryMB, score.
 */

export interface HiddenTestCase {
  input: unknown[];   // arguments to spread into the function
  expected: unknown;  // expected return value
  category: 'basic' | 'edge' | 'boundary' | 'random' | 'large' | 'stress';
}

export interface TestSuite {
  functionName: string;
  tests: HiddenTestCase[];
  compare: (actual: unknown, expected: unknown) => boolean;
  referenceImpl: (...args: unknown[]) => unknown;
}

// ─── DETERMINISTIC RNG ───────────────────────────────────────────────────────
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── PROBLEM 1: TWO SUM ───────────────────────────────────────────────────────
function twoSumRef(nums: number[], target: number): number[] {
  const map: Record<number, number> = {};
  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i];
    if (map[comp] !== undefined) return [map[comp], i];
    map[nums[i]] = i;
  }
  return [];
}

function generateTwoSumSuite(): TestSuite {
  const rng = seededRng(42);
  const tests: HiddenTestCase[] = [];

  // Basic cases (3)
  tests.push({ input: [[2, 7, 11, 15], 9],   expected: [0, 1], category: 'basic' });
  tests.push({ input: [[3, 2, 4], 6],         expected: [1, 2], category: 'basic' });
  tests.push({ input: [[3, 3], 6],             expected: [0, 1], category: 'basic' });

  // Edge cases (20)
  tests.push({ input: [[1, 2], 3],             expected: [0, 1], category: 'edge' });
  tests.push({ input: [[0, 4, 3, 0], 0],       expected: [0, 3], category: 'edge' });
  tests.push({ input: [[-1, -2, -3, -4, -5], -8], expected: [2, 4], category: 'edge' });
  tests.push({ input: [[-3, 4, 3, 90], 0],     expected: [0, 2], category: 'edge' });
  tests.push({ input: [[1000000, 1], 1000001], expected: [0, 1], category: 'edge' });
  tests.push({ input: [[-1000000, 1000000], 0],expected: [0, 1], category: 'edge' });
  tests.push({ input: [[5, 5], 10],            expected: [0, 1], category: 'edge' });
  tests.push({ input: [[1, 3, 4, 2], 6],       expected: [2, 3], category: 'edge' });
  tests.push({ input: [[2, 5, 5, 11], 10],     expected: [1, 2], category: 'edge' });
  tests.push({ input: [[0, 0], 0],             expected: [0, 1], category: 'edge' });
  tests.push({ input: [[1, 2, 3, 4, 5], 9],   expected: [3, 4], category: 'edge' });
  tests.push({ input: [[2, 1, 5, 3], 4],       expected: [0, 3], category: 'edge' });
  tests.push({ input: [[100, 200, 300], 500],  expected: [1, 2], category: 'edge' });
  tests.push({ input: [[-100, 200, -100], -200], expected: [0, 2], category: 'edge' });
  tests.push({ input: [[7, 2, 5], 9],          expected: [0, 1], category: 'edge' });
  tests.push({ input: [[4, 8, 2], 6],          expected: [0, 2], category: 'edge' });
  tests.push({ input: [[1, 5, 3, 2, 4], 7],   expected: [1, 4], category: 'edge' });
  tests.push({ input: [[9, 1, 5, 3], 4],       expected: [1, 2], category: 'edge' });
  tests.push({ input: [[10, 20, 10, 40], 50],  expected: [1, 3], category: 'edge' });
  tests.push({ input: [[3, 7, 1, 9], 10],      expected: [0, 3], category: 'edge' });

  // Boundary cases (20)
  for (let i = 0; i < 20; i++) {
    const size = randInt(rng, 2, 5);
    const nums: number[] = [];
    for (let j = 0; j < size; j++) nums.push(randInt(rng, -10, 10));
    const idx1 = randInt(rng, 0, size - 2);
    const idx2 = randInt(rng, idx1 + 1, size - 1);
    const target = nums[idx1] + nums[idx2];
    // Ensure uniqueness — rebuild to guarantee exactly one solution
    const clean = [...nums];
    clean[idx1] = randInt(rng, -50, 50);
    clean[idx2] = target - clean[idx1];
    // Verify no duplicate solution before idx1
    let valid = true;
    for (let a = 0; a < idx1; a++) {
      if (clean[a] + clean[idx2] === target || clean[a] + clean[idx1] === target) { valid = false; break; }
    }
    if (valid) {
      const exp = twoSumRef(clean, target);
      tests.push({ input: [clean, target], expected: exp, category: 'boundary' });
    } else {
      tests.push({ input: [[1, 2], 3], expected: [0, 1], category: 'boundary' });
    }
  }

  // Random cases (400)
  for (let i = 0; i < 400; i++) {
    const size = randInt(rng, 2, 50);
    const nums: number[] = Array.from({ length: size }, () => randInt(rng, -1000, 1000));
    const idx1 = randInt(rng, 0, size - 2);
    const idx2 = randInt(rng, idx1 + 1, size - 1);
    const target = nums[idx1] + nums[idx2];
    const expected = twoSumRef(nums, target);
    tests.push({ input: [nums, target], expected, category: 'random' });
  }

  // Large performance cases (30)
  for (let i = 0; i < 30; i++) {
    const size = 5000 + i * 100;
    const nums: number[] = Array.from({ length: size }, (_, j) => j * 2);
    const idx1 = randInt(rng, 0, size / 2);
    const idx2 = randInt(rng, size / 2, size - 1);
    const target = nums[idx1] + nums[idx2];
    tests.push({ input: [nums, target], expected: [idx1, idx2], category: 'large' });
  }

  // Stress (30)
  for (let i = 0; i < 30; i++) {
    const size = 1000;
    const nums: number[] = Array.from({ length: size }, () => randInt(rng, -10000, 10000));
    const idx1 = randInt(rng, 0, 400);
    const idx2 = randInt(rng, 500, 999);
    nums[idx2] = randInt(rng, -10000, 10000);
    nums[idx1] = randInt(rng, -10000, 10000);
    const target = nums[idx1] + nums[idx2];
    const expected = twoSumRef(nums, target);
    tests.push({ input: [nums, target], expected, category: 'stress' });
  }

  return {
    functionName: 'twoSum',
    tests,
    compare: (a: unknown, e: unknown) => {
      if (!Array.isArray(a) || !Array.isArray(e)) return false;
      const sa = [...(a as number[])].sort((x, y) => x - y);
      const se = [...(e as number[])].sort((x, y) => x - y);
      return JSON.stringify(sa) === JSON.stringify(se);
    },
    referenceImpl: (nums: unknown, target: unknown) => twoSumRef(nums as number[], target as number),
  };
}

// ─── PROBLEM 2: VALID PARENTHESES ─────────────────────────────────────────────
function isValidRef(s: string): boolean {
  const stack: string[] = [];
  const map: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
  for (const c of s) {
    if ('({['.includes(c)) { stack.push(c); }
    else { if (stack.pop() !== map[c]) return false; }
  }
  return stack.length === 0;
}

function generateValidParenSuite(): TestSuite {
  const rng = seededRng(137);
  const tests: HiddenTestCase[] = [];

  // Basic
  tests.push({ input: ['()'],     expected: true,  category: 'basic' });
  tests.push({ input: ['()[]{}'], expected: true,  category: 'basic' });
  tests.push({ input: ['(]'],     expected: false, category: 'basic' });

  // Edge (30)
  const edgeCases = [
    ['', true], ['(', false], [')', false], ['{', false], ['}', false],
    ['[]', true], ['{}', true], ['[)', false], ['(}', false],
    ['(()', false], ['({[]})', true], ['({[}])', false],
    ['(((())))', true], ['((()))', true], ['(())', true],
    [')))))', false], ['(((((', false], ['{}[]', true],
    ['({()})', true], ['[{()}]', true], ['{[()]}', true],
    ['([]{})', true], ['([)]', false], ['[({})](]', false],
    ['{[]}', true], ['[(])', false], ['((((', false],
    ['[][]', true], ['(){}[]', true], ['([{}])', true],
    [']', false],
  ];
  for (const [s, e] of edgeCases) {
    tests.push({ input: [s], expected: e, category: 'edge' });
  }

  // Boundary (20)
  const pairs = ['()', '[]', '{}'];
  for (let i = 0; i < 20; i++) {
    const depth = randInt(rng, 1, 5);
    let s = '';
    const chosen: string[] = [];
    for (let d = 0; d < depth; d++) {
      const p = pairs[randInt(rng, 0, 2)];
      s = p[0] + s + p[1];
      chosen.push(p);
    }
    tests.push({ input: [s], expected: isValidRef(s), category: 'boundary' });
  }

  // Random (400)
  const chars = '()[]{}';
  for (let i = 0; i < 400; i++) {
    const len = randInt(rng, 1, 20) * 2;
    let s = '';
    for (let j = 0; j < len; j++) s += chars[randInt(rng, 0, 5)];
    tests.push({ input: [s], expected: isValidRef(s), category: 'random' });
  }

  // Large (30)
  for (let i = 0; i < 15; i++) {
    const depth = 5000 + i * 200;
    const s = '('.repeat(depth) + ')'.repeat(depth);
    tests.push({ input: [s], expected: true, category: 'large' });
  }
  for (let i = 0; i < 15; i++) {
    const depth = 5000 + i * 200;
    const s = '('.repeat(depth + 1) + ')'.repeat(depth);
    tests.push({ input: [s], expected: false, category: 'large' });
  }

  // Stress (20)
  for (let i = 0; i < 20; i++) {
    const len = randInt(rng, 100, 500);
    let s = '';
    for (let j = 0; j < len; j++) s += chars[randInt(rng, 0, 5)];
    tests.push({ input: [s], expected: isValidRef(s), category: 'stress' });
  }

  return {
    functionName: 'isValid',
    tests,
    compare: (a: unknown, e: unknown) => Boolean(a) === Boolean(e),
    referenceImpl: (s: unknown) => isValidRef(s as string),
  };
}

// ─── PROBLEM 3: MERGE INTERVALS ───────────────────────────────────────────────
function mergeRef(intervals: number[][]): number[][] {
  if (!intervals.length) return [];
  intervals.sort((a, b) => a[0] - b[0]);
  const merged: number[][] = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    if (intervals[i][0] <= last[1]) {
      last[1] = Math.max(last[1], intervals[i][1]);
    } else {
      merged.push([...intervals[i]]);
    }
  }
  return merged;
}

function generateMergeIntervalsSuite(): TestSuite {
  const rng = seededRng(31415);
  const tests: HiddenTestCase[] = [];

  // Basic
  tests.push({ input: [[[1,3],[2,6],[8,10],[15,18]]], expected: [[1,6],[8,10],[15,18]], category: 'basic' });
  tests.push({ input: [[[1,4],[4,5]]],                expected: [[1,5]],               category: 'basic' });
  tests.push({ input: [[[1,4]]],                      expected: [[1,4]],               category: 'basic' });

  // Edge (25)
  const edgeIntervals: [number[][], number[][]][] = [
    [[[0,0]], [[0,0]]],
    [[[1,1]], [[1,1]]],
    [[[1,2],[3,4]], [[1,2],[3,4]]],
    [[[1,4],[2,3]], [[1,4]]],
    [[[1,4],[0,4]], [[0,4]]],
    [[[1,3],[2,4],[3,5]], [[1,5]]],
    [[[1,2],[3,4],[5,6]], [[1,2],[3,4],[5,6]]],
    [[[1,100],[0,101]], [[0,101]]],
    [[[0,0],[0,0]], [[0,0]]],
    [[[5,10],[1,7]], [[1,10]]],
    [[[1,5],[2,3],[4,8]], [[1,8]]],
    [[[1,5],[6,10]], [[1,5],[6,10]]],
    [[[1,5],[5,10]], [[1,10]]],
    [[[1,2],[2,3],[3,4]], [[1,4]]],
    [[[2,3],[4,5],[6,7],[8,9],[1,10]], [[1,10]]],
    [[[1,3],[8,10],[15,18],[6,9]], [[1,3],[6,10],[15,18]]],
    [[[1,2],[1,3],[1,4]], [[1,4]]],
    [[[0,0],[1,1],[2,2]], [[0,0],[1,1],[2,2]]],
    [[[1,10],[2,5],[3,7]], [[1,10]]],
    [[[1,5],[2,5],[3,5]], [[1,5]]],
    [[[10,20],[5,15],[1,5]], [[1,20]]],
    [[[1,3],[2,4],[5,7],[6,8]], [[1,4],[5,8]]],
    [[[1,6],[2,4],[7,9]], [[1,6],[7,9]]],
    [[[0,5],[3,8],[10,12]], [[0,8],[10,12]]],
    [[[1,4],[0,0]], [[0,0],[1,4]]],
  ];
  for (const [input, expected] of edgeIntervals) {
    tests.push({ input: [input], expected, category: 'edge' });
  }

  // Random (400)
  for (let i = 0; i < 400; i++) {
    const count = randInt(rng, 1, 15);
    const intervals: number[][] = [];
    for (let j = 0; j < count; j++) {
      const s = randInt(rng, 0, 100);
      const e = s + randInt(rng, 0, 20);
      intervals.push([s, e]);
    }
    const expected = mergeRef(intervals.map(x => [...x]));
    tests.push({ input: [intervals], expected, category: 'random' });
  }

  // Large (30)
  for (let i = 0; i < 30; i++) {
    const count = 2000 + i * 100;
    const intervals: number[][] = [];
    for (let j = 0; j < count; j++) {
      const s = randInt(rng, 0, 10000);
      intervals.push([s, s + randInt(rng, 0, 100)]);
    }
    const expected = mergeRef(intervals.map(x => [...x]));
    tests.push({ input: [intervals], expected, category: 'large' });
  }

  // Stress (45)
  for (let i = 0; i < 45; i++) {
    const count = randInt(rng, 50, 200);
    const intervals: number[][] = [];
    for (let j = 0; j < count; j++) {
      const s = randInt(rng, 0, 1000);
      intervals.push([s, s + randInt(rng, 0, 50)]);
    }
    const expected = mergeRef(intervals.map(x => [...x]));
    tests.push({ input: [intervals], expected, category: 'stress' });
  }

  return {
    functionName: 'merge',
    tests,
    compare: (a: unknown, e: unknown) => {
      if (!Array.isArray(a) || !Array.isArray(e)) return false;
      if (a.length !== (e as number[][]).length) return false;
      const sorted_a = [...(a as number[][])].sort((x, y) => x[0] - y[0]);
      const sorted_e = [...(e as number[][])].sort((x, y) => x[0] - y[0]);
      return JSON.stringify(sorted_a) === JSON.stringify(sorted_e);
    },
    referenceImpl: (intervals: unknown) => mergeRef((intervals as number[][]).map(x => [...(x as number[])])),
  };
}

// ─── PROBLEM 4: NUMBER OF ISLANDS ────────────────────────────────────────────
function numIslandsRef(grid: string[][]): number {
  if (!grid?.length) return 0;
  const rows = grid.length, cols = grid[0].length;
  const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));
  let count = 0;
  const dfs = (r: number, c: number) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols || visited[r][c] || grid[r][c] === '0') return;
    visited[r][c] = true;
    dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!visited[r][c] && grid[r][c] === '1') { count++; dfs(r, c); }
    }
  }
  return count;
}

function generateNumIslandsSuite(): TestSuite {
  const rng = seededRng(99991);
  const tests: HiddenTestCase[] = [];

  // Basic (3)
  tests.push({ input: [[['1']]], expected: 1, category: 'basic' });
  tests.push({ input: [[['0']]], expected: 0, category: 'basic' });
  tests.push({ input: [[['1','1'],['1','1']]], expected: 1, category: 'basic' });

  // Edge (25)
  const edgeGrids: [string[][], number][] = [
    [[['0','0'],['0','0']], 0],
    [[['1','0'],['0','1']], 2],
    [[['1','0'],['0','0']], 1],
    [[['1','1','0'],['0','0','1']], 2],
    [[['1'],['1'],['0'],['1']], 2],
    [[['1','1','1'],['0','0','0'],['1','1','1']], 2],
    [[['1','0','1'],['0','1','0'],['1','0','1']], 5],
    [[['1','1','1'],['1','0','1'],['1','1','1']], 1],
    [[['0','1','0'],['1','1','1'],['0','1','0']], 1],
    [[['1','1','0','0'],['0','0','0','1']], 2],
    [[['1','0','0','1'],['0','0','0','0'],['1','0','0','1']], 4],
    [[['1','1','0'],['0','1','0'],['0','0','1']], 2],
    [[['1'],['0'],['1'],['0'],['1']], 3],
    [[['0','1','0'],['0','0','0'],['0','1','0']], 2],
    [[['1','1'],['0','0'],['0','1']], 2],
    [[['1','0','1','0'],['0','1','0','1']], 4],
    [[['1','1','1','1','1']], 1],
    [[['0','0','0','0','0']], 0],
    [[['1','0','0','0','1']], 2],
    [[['1'],['1'],['1'],['1'],['1']], 1],
    [[['0'],['0'],['0'],['0'],['0']], 0],
    [[['1','1','0','1','1']], 2],
    [[['1','0'],['1','0']], 1],
    [[['0','1'],['1','0']], 2],
    [[['1','1','1'],['1','1','1'],['1','1','1']], 1],
  ];
  for (const [g, e] of edgeGrids) {
    tests.push({ input: [g], expected: e, category: 'edge' });
  }

  // Random (400)
  for (let i = 0; i < 400; i++) {
    const rows = randInt(rng, 1, 15);
    const cols = randInt(rng, 1, 15);
    const grid: string[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => rng() > 0.5 ? '1' : '0')
    );
    tests.push({ input: [grid], expected: numIslandsRef(grid.map(r => [...r])), category: 'random' });
  }

  // Large (30)
  for (let i = 0; i < 30; i++) {
    const size = 30 + i * 5;
    const grid: string[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => rng() > 0.4 ? '1' : '0')
    );
    tests.push({ input: [grid], expected: numIslandsRef(grid.map(r => [...r])), category: 'large' });
  }

  // Stress (45)
  for (let i = 0; i < 45; i++) {
    const rows = randInt(rng, 10, 30);
    const cols = randInt(rng, 10, 30);
    const grid: string[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => rng() > 0.6 ? '1' : '0')
    );
    tests.push({ input: [grid], expected: numIslandsRef(grid.map(r => [...r])), category: 'stress' });
  }

  return {
    functionName: 'numIslands',
    tests,
    compare: (a: unknown, e: unknown) => Number(a) === Number(e),
    referenceImpl: (grid: unknown) => numIslandsRef((grid as string[][]).map(r => [...(r as string[])])),
  };
}

// ─── PROBLEM 5: TRAPPING RAIN WATER ──────────────────────────────────────────
function trapRef(height: number[]): number {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0, water = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      height[left] >= leftMax ? (leftMax = height[left]) : (water += leftMax - height[left]);
      left++;
    } else {
      height[right] >= rightMax ? (rightMax = height[right]) : (water += rightMax - height[right]);
      right--;
    }
  }
  return water;
}

function generateTrapSuite(): TestSuite {
  const rng = seededRng(271828);
  const tests: HiddenTestCase[] = [];

  // Basic (3)
  tests.push({ input: [[0,1,0,2,1,0,1,3,2,1,2,1]], expected: 6,  category: 'basic' });
  tests.push({ input: [[4,2,0,3,2,5]],             expected: 9,  category: 'basic' });
  tests.push({ input: [[1,0,1]],                   expected: 1,  category: 'basic' });

  // Edge (30)
  const edgeCases: [number[], number][] = [
    [[0], 0], [[1], 0], [[1,2], 0], [[2,1], 0],
    [[0,0,0], 0], [[1,0,1], 1], [[2,0,2], 2], [[3,0,3], 3],
    [[3,0,2,0,4], 7], [[0,0,0,0], 0], [[1,1,1,1], 0],
    [[5,2,1,2,1,5], 14], [[0,7,1,4,6], 8],
    [[3,1,2,4,0,1,3,2], 8], [[2,0,2], 2],
    [[4,9,4,5,3,7], 10], [[5,4,3,2,1], 0], [[1,2,3,4,5], 0],
    [[5,5,5,5,5], 0], [[1,0,0,0,1], 3],
    [[3,2,1,2,3], 4], [[1,2,1,2,1,2,1], 3],
    [[2,1,2,1,2,1,2], 3], [[4,0,0,4], 8],
    [[0,1,2,1,0], 0], [[0,3,0,2,0,4,0,1,0,1,0,3,0,2], 26],
    [[4,2,3], 1], [[3,2,4], 1], [[1,3,1], 0],
    [[0,2,0,3,0,2,0,3], 10], [[1,0,2,1,0,1,2], 5],
  ];
  for (const [h, e] of edgeCases) {
    tests.push({ input: [h], expected: e, category: 'edge' });
  }

  // Random (400)
  for (let i = 0; i < 400; i++) {
    const size = randInt(rng, 1, 30);
    const h = Array.from({ length: size }, () => randInt(rng, 0, 10));
    tests.push({ input: [h], expected: trapRef([...h]), category: 'random' });
  }

  // Large (30)
  for (let i = 0; i < 30; i++) {
    const size = 5000 + i * 500;
    const h = Array.from({ length: size }, () => randInt(rng, 0, 10000));
    tests.push({ input: [h], expected: trapRef([...h]), category: 'large' });
  }

  // Stress (40)
  for (let i = 0; i < 40; i++) {
    const size = randInt(rng, 200, 1000);
    const h = Array.from({ length: size }, () => randInt(rng, 0, 100));
    tests.push({ input: [h], expected: trapRef([...h]), category: 'stress' });
  }

  return {
    functionName: 'trap',
    tests,
    compare: (a: unknown, e: unknown) => Number(a) === Number(e),
    referenceImpl: (height: unknown) => trapRef([...(height as number[])]),
  };
}

// ─── PROBLEM 6: LONGEST SUBSTRING WITHOUT REPEATING CHARACTERS ────────────────
function lengthOfLongestSubstringRef(s: string): number {
  let map: Record<string, number> = {};
  let max = 0;
  let left = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    if (map[c] !== undefined && map[c] >= left) left = map[c] + 1;
    map[c] = right;
    max = Math.max(max, right - left + 1);
  }
  return max;
}

function generateLengthOfLongestSubstringSuite(): TestSuite {
  const rng = seededRng(600);
  const tests: HiddenTestCase[] = [];

  // Basic (3)
  tests.push({ input: ['abcabcbb'], expected: 3, category: 'basic' });
  tests.push({ input: ['bbbbb'], expected: 1, category: 'basic' });
  tests.push({ input: ['pwwkew'], expected: 3, category: 'basic' });

  // Edge (20)
  const edges = [
    '', 'a', 'ab', 'aba', 'abcdefghijklmnopqrstuvwxyz',
    'a '.repeat(50), 'ab c d e', '!@#$%^&*()', '123123',
    'aaabbb', 'abacabadabacaba', 'z'.repeat(100),
    '1', '12', '121', '123', '1232', '12321'
  ];
  edges.forEach(s => tests.push({ input: [s], expected: lengthOfLongestSubstringRef(s), category: 'edge' }));
  for(let i=0; i<2; i++) tests.push({ input: ['a'.repeat(50)], expected: 1, category: 'edge' });

  // Boundary (20)
  for (let i = 0; i < 20; i++) {
    const len = randInt(rng, 10, 50);
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let s = '';
    for(let j = 0; j < len; j++) s += chars[randInt(rng, 0, chars.length - 1)];
    tests.push({ input: [s], expected: lengthOfLongestSubstringRef(s), category: 'boundary' });
  }

  // Random (400)
  for (let i = 0; i < 400; i++) {
    const len = randInt(rng, 1, 200);
    let s = '';
    for (let j = 0; j < len; j++) s += String.fromCharCode(randInt(rng, 32, 126));
    tests.push({ input: [s], expected: lengthOfLongestSubstringRef(s), category: 'random' });
  }

  // Large (30)
  for (let i = 0; i < 30; i++) {
    const len = 10000 + i * 500;
    let s = '';
    for (let j = 0; j < len; j++) s += String.fromCharCode(randInt(rng, 32, 126));
    tests.push({ input: [s], expected: lengthOfLongestSubstringRef(s), category: 'large' });
  }

  // Stress (30)
  for (let i = 0; i < 30; i++) {
    const len = 20000;
    let s = '';
    for (let j = 0; j < len; j++) s += String.fromCharCode(randInt(rng, 65, 90));
    tests.push({ input: [s], expected: lengthOfLongestSubstringRef(s), category: 'stress' });
  }

  return {
    functionName: 'lengthOfLongestSubstring',
    tests,
    compare: (a, e) => Number(a) === Number(e),
    referenceImpl: (s) => lengthOfLongestSubstringRef(s as string),
  };
}

// ─── PROBLEM 7: KTH LARGEST ELEMENT IN AN ARRAY ───────────────────────────────
function findKthLargestRef(nums: number[], k: number): number {
  const sorted = [...nums].sort((a, b) => b - a);
  return sorted[k - 1];
}

function generateFindKthLargestSuite(): TestSuite {
  const rng = seededRng(700);
  const tests: HiddenTestCase[] = [];

  // Basic (3)
  tests.push({ input: [[3,2,1,5,6,4], 2], expected: 5, category: 'basic' });
  tests.push({ input: [[3,2,3,1,2,4,5,5,6], 4], expected: 4, category: 'basic' });
  tests.push({ input: [[1], 1], expected: 1, category: 'basic' });

  // Edge (20)
  tests.push({ input: [[-1, -1], 2], expected: -1, category: 'edge' });
  tests.push({ input: [[2, 1], 1], expected: 2, category: 'edge' });
  tests.push({ input: [[2, 1], 2], expected: 1, category: 'edge' });
  for (let i = 0; i < 17; i++) {
    const size = randInt(rng, 2, 20);
    const nums = Array.from({length: size}, () => randInt(rng, -50, 50));
    const k = randInt(rng, 1, size);
    tests.push({ input: [nums, k], expected: findKthLargestRef(nums, k), category: 'edge' });
  }

  // Boundary (20)
  for (let i = 0; i < 20; i++) {
    const size = 100;
    const nums = Array.from({length: size}, () => randInt(rng, -1000, 1000));
    const k = i % 2 === 0 ? 1 : size;
    tests.push({ input: [nums, k], expected: findKthLargestRef(nums, k), category: 'boundary' });
  }

  // Random (400)
  for (let i = 0; i < 400; i++) {
    const size = randInt(rng, 1, 500);
    const nums = Array.from({length: size}, () => randInt(rng, -10000, 10000));
    const k = randInt(rng, 1, size);
    tests.push({ input: [nums, k], expected: findKthLargestRef(nums, k), category: 'random' });
  }

  // Large (30)
  for (let i = 0; i < 30; i++) {
    const size = 10000 + i * 500;
    const nums = Array.from({length: size}, () => randInt(rng, -100000, 100000));
    const k = randInt(rng, 1, size);
    tests.push({ input: [nums, k], expected: findKthLargestRef(nums, k), category: 'large' });
  }

  // Stress (30)
  for (let i = 0; i < 30; i++) {
    const size = 50000;
    const nums = Array.from({length: size}, () => randInt(rng, -1000000, 1000000));
    const k = randInt(rng, 1, size);
    tests.push({ input: [nums, k], expected: findKthLargestRef(nums, k), category: 'stress' });
  }

  return {
    functionName: 'findKthLargest',
    tests,
    compare: (a, e) => Number(a) === Number(e),
    referenceImpl: (nums, k) => findKthLargestRef(nums as number[], k as number),
  };
}

// ─── PROBLEM 8: CLIMBING STAIRS ───────────────────────────────────────────────
function climbStairsRef(n: number): number {
  if (n <= 2) return n;
  let a = 1, b = 2;
  for (let i = 3; i <= n; i++) {
    const next = a + b;
    a = b;
    b = next;
  }
  return b;
}

function generateClimbStairsSuite(): TestSuite {
  const rng = seededRng(800);
  const tests: HiddenTestCase[] = [];

  // Basic (3)
  tests.push({ input: [2], expected: 2, category: 'basic' });
  tests.push({ input: [3], expected: 3, category: 'basic' });
  tests.push({ input: [1], expected: 1, category: 'basic' });

  // Edge (10)
  tests.push({ input: [4], expected: 5, category: 'edge' });
  tests.push({ input: [5], expected: 8, category: 'edge' });
  for (let i = 6; i <= 13; i++) tests.push({ input: [i], expected: climbStairsRef(i), category: 'edge' });

  // Boundary (10)
  tests.push({ input: [45], expected: climbStairsRef(45), category: 'boundary' });
  tests.push({ input: [44], expected: climbStairsRef(44), category: 'boundary' });
  for (let i = 35; i <= 42; i++) tests.push({ input: [i], expected: climbStairsRef(i), category: 'boundary' });

  // Random (450)
  for (let i = 0; i < 450; i++) {
    const n = randInt(rng, 1, 45);
    tests.push({ input: [n], expected: climbStairsRef(n), category: 'random' });
  }

  // Large & Stress (27)
  for (let i = 0; i < 27; i++) {
    const n = randInt(rng, 40, 45);
    tests.push({ input: [n], expected: climbStairsRef(n), category: 'stress' });
  }

  return {
    functionName: 'climbStairs',
    tests,
    compare: (a, e) => Number(a) === Number(e),
    referenceImpl: (n) => climbStairsRef(n as number),
  };
}

// ─── PROBLEM 9: COURSE SCHEDULE ───────────────────────────────────────────────
function canFinishRef(numCourses: number, prerequisites: number[][]): boolean {
  const adj: number[][] = Array.from({length: numCourses}, () => []);
  const inDegree = new Array(numCourses).fill(0);
  for (const [v, u] of prerequisites) {
    adj[u].push(v);
    inDegree[v]++;
  }
  const q: number[] = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) q.push(i);
  }
  let count = 0;
  while (q.length > 0) {
    const u = q.shift()!;
    count++;
    for (const v of adj[u]) {
      inDegree[v]--;
      if (inDegree[v] === 0) q.push(v);
    }
  }
  return count === numCourses;
}

function generateCanFinishSuite(): TestSuite {
  const rng = seededRng(900);
  const tests: HiddenTestCase[] = [];

  // Basic (3)
  tests.push({ input: [2, [[1,0]]], expected: true, category: 'basic' });
  tests.push({ input: [2, [[1,0],[0,1]]], expected: false, category: 'basic' });
  tests.push({ input: [1, []], expected: true, category: 'basic' });

  // Edge (20)
  tests.push({ input: [3, [[1,0],[2,1]]], expected: true, category: 'edge' });
  tests.push({ input: [3, [[1,0],[2,1],[0,2]]], expected: false, category: 'edge' });
  for (let i = 0; i < 18; i++) {
    const n = randInt(rng, 1, 10);
    const p: number[][] = [];
    if (i % 2 === 0) {
      for (let j = 1; j < n; j++) p.push([j, j-1]);
    } else {
      for (let j = 0; j < n; j++) p.push([j, (j+1)%n]);
    }
    tests.push({ input: [n, p], expected: canFinishRef(n, p), category: 'edge' });
  }

  // Boundary (20)
  for (let i = 0; i < 20; i++) {
    const n = 2000;
    tests.push({ input: [n, []], expected: true, category: 'boundary' });
  }

  // Random (400)
  for (let i = 0; i < 400; i++) {
    const n = randInt(rng, 2, 100);
    const edges = randInt(rng, 0, n * 2);
    const p: number[][] = [];
    for (let j = 0; j < edges; j++) {
      const u = randInt(rng, 0, n - 1);
      const v = randInt(rng, 0, n - 1);
      if (u !== v) p.push([v, u]);
    }
    tests.push({ input: [n, p], expected: canFinishRef(n, p), category: 'random' });
  }

  // Large & Stress (60)
  for (let i = 0; i < 60; i++) {
    const n = randInt(rng, 1000, 2000);
    const edges = randInt(rng, 1000, 4000);
    const p: number[][] = [];
    for (let j = 0; j < edges; j++) {
      const u = randInt(rng, 0, n - 1);
      const v = randInt(rng, 0, n - 1);
      if (u !== v) p.push([v, u]);
    }
    tests.push({ input: [n, p], expected: canFinishRef(n, p), category: 'large' });
  }

  return {
    functionName: 'canFinish',
    tests,
    compare: (a, e) => Boolean(a) === Boolean(e),
    referenceImpl: (n, p) => canFinishRef(n as number, p as number[][]),
  };
}

// ─── REGISTRY ─────────────────────────────────────────────────────────────────
const SUITE_CACHE: Record<number, TestSuite> = {};

export function getTestSuite(questionId: number): TestSuite {
  if (SUITE_CACHE[questionId]) return SUITE_CACHE[questionId];
  switch (questionId) {
    case 1: SUITE_CACHE[1] = generateTwoSumSuite();        break;
    case 2: SUITE_CACHE[2] = generateValidParenSuite();    break;
    case 3: SUITE_CACHE[3] = generateMergeIntervalsSuite();break;
    case 4: SUITE_CACHE[4] = generateNumIslandsSuite();    break;
    case 5: SUITE_CACHE[5] = generateTrapSuite();          break;
    case 6: SUITE_CACHE[6] = generateLengthOfLongestSubstringSuite(); break;
    case 7: SUITE_CACHE[7] = generateFindKthLargestSuite(); break;
    case 8: SUITE_CACHE[8] = generateClimbStairsSuite();   break;
    case 9: SUITE_CACHE[9] = generateCanFinishSuite();     break;
    default: throw new Error(`Unknown questionId: ${questionId}`);
  }
  return SUITE_CACHE[questionId];
}

export function getTotalTests(questionId: number): number {
  return getTestSuite(questionId).tests.length;
}

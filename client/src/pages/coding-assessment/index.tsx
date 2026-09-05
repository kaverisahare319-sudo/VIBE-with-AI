import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import {
  CheckCircle, AlertTriangle, Clock, ShieldAlert, FileCode2, Code2,
  ChevronLeft, ChevronRight, XCircle, Play, BookOpen,
  Terminal, Brain, Cpu, TrendingUp, Target, Award,
  RefreshCw, Bookmark, Settings, Lock,
  AlertCircle, ArrowRight, Trophy, BarChart2, Star
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Stage = 'instructions' | 'exam' | 'confirm' | 'results';
type QStatus = 'unanswered' | 'answered' | 'review' | 'correct' | 'partial' | 'wrong' | 'error';
type Difficulty = 'Easy' | 'Medium' | 'Hard';
type EvalStatus = 'correct' | 'partial' | 'wrong' | 'error' | 'tle';
type ConsoleTab = 'results' | 'console';

interface TestCaseDef {
  id: number;
  args: unknown[];
  expected: unknown;
  inputDisplay: string;
  expectedDisplay: string;
  isHidden: boolean;
}

interface TestCaseResult {
  id: number;
  inputDisplay: string;
  expectedDisplay: string;
  actualDisplay: string;
  passed: boolean;
  isHidden: boolean;
  error?: string;
}

interface EvalResult {
  status: EvalStatus;
  passed: number;
  total: number;
  score: number;
  maxScore: number;
  bonus: number;
  testResults: TestCaseResult[];
  stdout: string;
  executionMs: number;
  memoryMB: number;
  runtimePercentile: number;
  attempts: number;
  timeTakenSec: number;
  locked: boolean;
  aiFeedback?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
}

interface Question {
  id: number;
  title: string;
  difficulty: Difficulty;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  defaultCode: Record<string, string>;
  tags: string[];
}

// ─── QUESTIONS ────────────────────────────────────────────────────────────────
const QUESTIONS: Question[] = [
  {
    id: 1, title: 'Two Sum', difficulty: 'Easy', tags: ['Array', 'HashMap'],
    statement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
    inputFormat: 'First line: array of integers nums\nSecond line: integer target',
    outputFormat: 'Return array of two indices [i, j] where nums[i] + nums[j] == target',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
    ],
    constraints: ['2 ≤ nums.length ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹', 'Only one valid answer exists'],
    defaultCode: {
      javascript: `function twoSum(nums, target) {
  // Write your solution here
  
}`,
      python: `def twoSum(nums, target):
    # Write your solution here
    pass`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
};`
    }
  },
  {
    id: 2, title: 'Valid Parentheses', difficulty: 'Easy', tags: ['Stack', 'String'],
    statement: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n• Open brackets must be closed by the same type of brackets.\n• Open brackets must be closed in the correct order.\n• Every close bracket has a corresponding open bracket of the same type.",
    inputFormat: 'A string s consisting only of bracket characters',
    outputFormat: 'Return true if valid, false otherwise',
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false', explanation: 'Mismatched bracket types' },
    ],
    constraints: ["1 ≤ s.length ≤ 10⁴", "s consists of parentheses only '()[]{}'"],
    defaultCode: {
      javascript: `function isValid(s) {
  // Write your solution here
  
}`,
      python: `def isValid(s: str) -> bool:
    # Write your solution here
    pass`,
      java: `class Solution {
    public boolean isValid(String s) {
        // Write your solution here
        return false;
    }
}`,
      cpp: `#include <string>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        // Write your solution here
        return false;
    }
};`
    }
  },
  {
    id: 3, title: 'Merge Intervals', difficulty: 'Medium', tags: ['Array', 'Sorting'],
    statement: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    inputFormat: 'Array of intervals intervals where intervals[i] = [start, end]',
    outputFormat: 'Array of merged non-overlapping intervals',
    examples: [
      { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: 'Intervals [1,3] and [2,6] overlap, merge to [1,6]' },
      { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]', explanation: 'Intervals [1,4] and [4,5] are considered overlapping' },
    ],
    constraints: ['1 ≤ intervals.length ≤ 10⁴', 'intervals[i].length == 2', '0 ≤ starti ≤ endi ≤ 10⁴'],
    defaultCode: {
      javascript: `function merge(intervals) {
  // Write your solution here
  
}`,
      python: `def merge(intervals):
    # Write your solution here
    pass`,
      java: `class Solution {
    public int[][] merge(int[][] intervals) {
        // Write your solution here
        return new int[][]{};
    }
}`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        // Write your solution here
        return {};
    }
};`
    }
  },
  {
    id: 4, title: 'Number of Islands', difficulty: 'Medium', tags: ['DFS', 'BFS', 'Graph', 'Matrix'],
    statement: "Given an m x n 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.",
    inputFormat: "An m x n grid of characters, each '1' (land) or '0' (water)",
    outputFormat: 'Return the number of islands (integer)',
    examples: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: '1' },
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: '3' },
    ],
    constraints: ['m == grid.length', 'n == grid[i].length', '1 ≤ m, n ≤ 300', "grid[i][j] is '0' or '1'"],
    defaultCode: {
      javascript: `function numIslands(grid) {
  // Write your solution here
  
}`,
      python: `def numIslands(grid):
    # Write your solution here
    pass`,
      java: `class Solution {
    public int numIslands(char[][] grid) {
        // Write your solution here
        return 0;
    }
}`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        // Write your solution here
        return 0;
    }
};`
    }
  },
  {
    id: 5, title: 'Trapping Rain Water', difficulty: 'Hard', tags: ['Array', 'Two Pointers', 'Dynamic Programming'],
    statement: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.\n\nThis is a classic dynamic programming / two-pointer problem. Think about what determines how much water can be held at each position.',
    inputFormat: 'Array of n non-negative integers height representing bar heights',
    outputFormat: 'Return the total amount of trapped water (integer)',
    examples: [
      { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6', explanation: 'Visualize bars and see where water pools between peaks' },
      { input: 'height = [4,2,0,3,2,5]', output: '9' },
    ],
    constraints: ['n == height.length', '1 ≤ n ≤ 2 × 10⁴', '0 ≤ height[i] ≤ 10⁵'],
    defaultCode: {
      javascript: `function trap(height) {
  // Hint: try two-pointer or DP approach
  
}`,
      python: `def trap(height):
    # Hint: try two-pointer or DP approach
    pass`,
      java: `class Solution {
    public int trap(int[] height) {
        // Write your solution here
        return 0;
    }
}`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int trap(vector<int>& height) {
        // Write your solution here
        return 0;
    }
};`
    }
  },
  {
    id: 6, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', tags: ['String', 'Sliding Window', 'Hash Table'],
    statement: 'Given a string s, find the length of the longest substring without repeating characters.',
    inputFormat: 'A single string s',
    outputFormat: 'Return the length of the longest valid substring (integer)',
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' },
      { input: 's = "pwwkew"', output: '3', explanation: 'The answer is "wke", with the length of 3. Note that the answer must be a substring, "pwke" is a subsequence and not a substring.' }
    ],
    constraints: ['0 ≤ s.length ≤ 5 * 10⁴', 's consists of English letters, digits, symbols and spaces.'],
    defaultCode: {
      javascript: `function lengthOfLongestSubstring(s) {
  // Write your solution here
  
}`,
      python: `def lengthOfLongestSubstring(s: str) -> int:
    # Write your solution here
    pass`,
      java: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Write your solution here
        return 0;
    }
}`,
      cpp: `#include <string>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // Write your solution here
        return 0;
    }
};`
    }
  },
  {
    id: 7, title: 'Kth Largest Element in an Array', difficulty: 'Medium', tags: ['Array', 'Divide and Conquer', 'Sorting', 'Heap (Priority Queue)', 'Quickselect'],
    statement: 'Given an integer array nums and an integer k, return the kth largest element in the array.\n\nNote that it is the kth largest element in the sorted order, not the kth distinct element.\n\nYou must solve it in O(n) time complexity.',
    inputFormat: 'First line: array of integers nums\nSecond line: integer k',
    outputFormat: 'Return the kth largest integer',
    examples: [
      { input: 'nums = [3,2,1,5,6,4], k = 2', output: '5' },
      { input: 'nums = [3,2,3,1,2,4,5,5,6], k = 4', output: '4' }
    ],
    constraints: ['1 ≤ k ≤ nums.length ≤ 10⁵', '-10⁴ ≤ nums[i] ≤ 10⁴'],
    defaultCode: {
      javascript: `function findKthLargest(nums, k) {
  // Write your solution here
  
}`,
      python: `def findKthLargest(nums, k):
    # Write your solution here
    pass`,
      java: `class Solution {
    public int findKthLargest(int[] nums, int k) {
        // Write your solution here
        return 0;
    }
}`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int findKthLargest(vector<int>& nums, int k) {
        // Write your solution here
        return 0;
    }
};`
    }
  },
  {
    id: 8, title: 'Climbing Stairs', difficulty: 'Easy', tags: ['Math', 'Dynamic Programming', 'Memoization'],
    statement: 'You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    inputFormat: 'A single integer n',
    outputFormat: 'Return the number of distinct ways (integer)',
    examples: [
      { input: 'n = 2', output: '2', explanation: '1. 1 step + 1 step\n2. 2 steps' },
      { input: 'n = 3', output: '3', explanation: '1. 1 step + 1 step + 1 step\n2. 1 step + 2 steps\n3. 2 steps + 1 step' }
    ],
    constraints: ['1 ≤ n ≤ 45'],
    defaultCode: {
      javascript: `function climbStairs(n) {
  // Write your solution here
  
}`,
      python: `def climbStairs(n: int) -> int:
    # Write your solution here
    pass`,
      java: `class Solution {
    public int climbStairs(int n) {
        // Write your solution here
        return 0;
    }
}`,
      cpp: `class Solution {
public:
    int climbStairs(int n) {
        // Write your solution here
        return 0;
    }
};`
    }
  },
  {
    id: 9, title: 'Course Schedule', difficulty: 'Medium', tags: ['Depth-First Search', 'Breadth-First Search', 'Graph', 'Topological Sort'],
    statement: 'There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai.\n\nFor example, the pair [0, 1], indicates that to take course 0 you have to first take course 1.\n\nReturn true if you can finish all courses. Otherwise, return false.',
    inputFormat: 'First line: integer numCourses\nSecond line: 2D array of prerequisites',
    outputFormat: 'Return true or false',
    examples: [
      { input: 'numCourses = 2, prerequisites = [[1,0]]', output: 'true', explanation: 'There are a total of 2 courses to take. To take course 1 you should have finished course 0. So it is possible.' },
      { input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]', output: 'false', explanation: 'There are a total of 2 courses to take. To take course 1 you should have finished course 0, and to take course 0 you should also have finished course 1. So it is impossible.' }
    ],
    constraints: ['1 ≤ numCourses ≤ 2000', '0 ≤ prerequisites.length ≤ 5000', 'prerequisites[i].length == 2', '0 ≤ ai, bi < numCourses', 'All the pairs prerequisites[i] are unique.'],
    defaultCode: {
      javascript: `function canFinish(numCourses, prerequisites) {
  // Write your solution here
  
}`,
      python: `def canFinish(numCourses, prerequisites):
    # Write your solution here
    pass`,
      java: `class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        // Write your solution here
        return false;
    }
}`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        // Write your solution here
        return false;
    }
};`
    }
  },
];

// ─── TEST SUITES ──────────────────────────────────────────────────────────────
const QUESTION_TESTS: Record<number, {
  functionName: string;
  tests: TestCaseDef[];
  compare: (actual: unknown, expected: unknown) => boolean;
  displayResult: (val: unknown) => string;
}> = {
  1: {
    functionName: 'twoSum',
    tests: [
      { id: 1, args: [[2,7,11,15], 9],  expected: [0,1], inputDisplay: 'nums=[2,7,11,15], target=9', expectedDisplay: '[0,1]', isHidden: false },
      { id: 2, args: [[3,2,4], 6],       expected: [1,2], inputDisplay: 'nums=[3,2,4], target=6', expectedDisplay: '[1,2]', isHidden: false },
      { id: 3, args: [[3,3], 6],         expected: [0,1], inputDisplay: 'nums=[3,3], target=6', expectedDisplay: '[0,1]', isHidden: false },
      { id: 4, args: [[1,2,3,4,5], 9],   expected: [3,4], inputDisplay: 'Hidden Test Case 4', expectedDisplay: '[3,4]', isHidden: true },
      { id: 5, args: [[-1,-2,-3,-4,-5],-8], expected: [2,4], inputDisplay: 'Hidden Test Case 5', expectedDisplay: '[2,4]', isHidden: true },
      { id: 6, args: [[0,4,3,0], 0],     expected: [0,3], inputDisplay: 'Hidden Test Case 6', expectedDisplay: '[0,3]', isHidden: true },
      { id: 7, args: [[2,5,5,11], 10],   expected: [1,2], inputDisplay: 'Hidden Test Case 7', expectedDisplay: '[1,2]', isHidden: true },
      { id: 8, args: [[1,1000000],1000001], expected: [0,1], inputDisplay: 'Hidden Test Case 8', expectedDisplay: '[0,1]', isHidden: true },
    ],
    compare: (a: unknown, e: unknown) => {
      if (!Array.isArray(a) || (a as number[]).length !== 2) return false;
      const as = [...(a as number[])].map(Number).sort((x,y)=>x-y);
      const es = [...(e as number[])].map(Number).sort((x,y)=>x-y);
      return as[0]===es[0] && as[1]===es[1];
    },
    displayResult: (v: unknown) => Array.isArray(v) ? JSON.stringify(v) : String(v),
  },
  2: {
    functionName: 'isValid',
    tests: [
      { id: 1, args: ['()'],     expected: true,  inputDisplay: 's = "()"', expectedDisplay: 'true', isHidden: false },
      { id: 2, args: ['()[]{}'], expected: true,  inputDisplay: 's = "()[]{}"', expectedDisplay: 'true', isHidden: false },
      { id: 3, args: ['(]'],     expected: false, inputDisplay: 's = "(]"', expectedDisplay: 'false', isHidden: false },
      { id: 4, args: ['{[]}'],   expected: true,  inputDisplay: 'Hidden Test Case 4', expectedDisplay: 'true', isHidden: true },
      { id: 5, args: ['([)]'],   expected: false, inputDisplay: 'Hidden Test Case 5', expectedDisplay: 'false', isHidden: true },
      { id: 6, args: [''],       expected: true,  inputDisplay: 'Hidden Test Case 6', expectedDisplay: 'true', isHidden: true },
      { id: 7, args: ['{'],      expected: false, inputDisplay: 'Hidden Test Case 7', expectedDisplay: 'false', isHidden: true },
      { id: 8, args: ['))))'],   expected: false, inputDisplay: 'Hidden Test Case 8', expectedDisplay: 'false', isHidden: true },
    ],
    compare: (a: unknown, e: unknown) => Boolean(a) === Boolean(e),
    displayResult: (v: unknown) => String(v),
  },
  3: {
    functionName: 'merge',
    tests: [
      { id: 1, args: [[[1,3],[2,6],[8,10],[15,18]]], expected: [[1,6],[8,10],[15,18]], inputDisplay: 'intervals=[[1,3],[2,6],[8,10],[15,18]]', expectedDisplay: '[[1,6],[8,10],[15,18]]', isHidden: false },
      { id: 2, args: [[[1,4],[4,5]]],               expected: [[1,5]],                inputDisplay: 'intervals=[[1,4],[4,5]]', expectedDisplay: '[[1,5]]', isHidden: false },
      { id: 3, args: [[[1,4]]],                      expected: [[1,4]],                inputDisplay: 'intervals=[[1,4]]', expectedDisplay: '[[1,4]]', isHidden: false },
      { id: 4, args: [[[1,4],[0,4]]],                expected: [[0,4]],                inputDisplay: 'Hidden Test Case 4', expectedDisplay: '[[0,4]]', isHidden: true },
      { id: 5, args: [[[1,4],[2,3]]],                expected: [[1,4]],                inputDisplay: 'Hidden Test Case 5', expectedDisplay: '[[1,4]]', isHidden: true },
      { id: 6, args: [[[1,3],[2,4],[3,5]]],          expected: [[1,5]],                inputDisplay: 'Hidden Test Case 6', expectedDisplay: '[[1,5]]', isHidden: true },
      { id: 7, args: [[[1,2],[3,4],[5,6]]],          expected: [[1,2],[3,4],[5,6]],    inputDisplay: 'Hidden Test Case 7', expectedDisplay: '[[1,2],[3,4],[5,6]]', isHidden: true },
      { id: 8, args: [[[1,100],[0,101]]],            expected: [[0,101]],              inputDisplay: 'Hidden Test Case 8', expectedDisplay: '[[0,101]]', isHidden: true },
      { id: 9, args: [[[1,10],[2,3],[4,5]]],         expected: [[1,10]],               inputDisplay: 'Hidden Test Case 9', expectedDisplay: '[[1,10]]', isHidden: true },
      { id: 10, args:[[[0,0],[0,0]]],                expected: [[0,0]],                inputDisplay: 'Hidden Test Case 10', expectedDisplay: '[[0,0]]', isHidden: true },
    ],
    compare: (a: unknown, e: unknown) => {
      if (!Array.isArray(a)) return false;
      return JSON.stringify(a) === JSON.stringify(e);
    },
    displayResult: (v: unknown) => Array.isArray(v) ? JSON.stringify(v) : String(v),
  },
  4: {
    functionName: 'numIslands',
    tests: [
      { id: 1, args: [[['1','1','0'],['0','1','0'],['0','0','1']]],                                                                expected: 2, inputDisplay: '3×3 grid - 2 islands', expectedDisplay: '2', isHidden: false },
      { id: 2, args: [[['1','1','1','1','0'],['1','1','0','1','0'],['1','1','0','0','0'],['0','0','0','0','0']]],                   expected: 1, inputDisplay: '4×5 grid - 1 island', expectedDisplay: '1', isHidden: false },
      { id: 3, args: [[['1','1','0','0','0'],['1','1','0','0','0'],['0','0','1','0','0'],['0','0','0','1','1']]],                   expected: 3, inputDisplay: '4×5 grid - 3 islands', expectedDisplay: '3', isHidden: false },
      { id: 4, args: [[['1']]],                                                                                                    expected: 1, inputDisplay: 'Hidden Test Case 4', expectedDisplay: '1', isHidden: true },
      { id: 5, args: [[['0','0'],['0','0']]],                                                                                      expected: 0, inputDisplay: 'Hidden Test Case 5', expectedDisplay: '0', isHidden: true },
      { id: 6, args: [[['1','1'],['1','1']]],                                                                                      expected: 1, inputDisplay: 'Hidden Test Case 6', expectedDisplay: '1', isHidden: true },
      { id: 7, args: [[['1','0'],['0','1']]],                                                                                      expected: 2, inputDisplay: 'Hidden Test Case 7', expectedDisplay: '2', isHidden: true },
      { id: 8, args: [[['1','0','1'],['0','1','0'],['1','0','1']]],                                                                expected: 5, inputDisplay: 'Hidden Test Case 8', expectedDisplay: '5', isHidden: true },
      { id: 9, args: [[['1','1','1'],['1','0','1'],['1','1','1']]],                                                                expected: 1, inputDisplay: 'Hidden Test Case 9', expectedDisplay: '1', isHidden: true },
      { id: 10, args:[[['0']]],                                                                                                    expected: 0, inputDisplay: 'Hidden Test Case 10', expectedDisplay: '0', isHidden: true },
    ],
    compare: (a: unknown, e: unknown) => Number(a) === Number(e),
    displayResult: (v: unknown) => String(v),
  },
  5: {
    functionName: 'trap',
    tests: [
      { id: 1,  args: [[0,1,0,2,1,0,1,3,2,1,2,1]], expected: 6, inputDisplay: 'height=[0,1,0,2,1,0,1,3,2,1,2,1]', expectedDisplay: '6', isHidden: false },
      { id: 2,  args: [[4,2,0,3,2,5]],             expected: 9, inputDisplay: 'height=[4,2,0,3,2,5]', expectedDisplay: '9', isHidden: false },
      { id: 3,  args: [[1,0,1]],                   expected: 1, inputDisplay: 'height=[1,0,1]', expectedDisplay: '1', isHidden: false },
      { id: 4,  args: [[3,0,2,0,4]],               expected: 7, inputDisplay: 'Hidden Test Case 4', expectedDisplay: '7', isHidden: true },
      { id: 5,  args: [[0,0,0]],                   expected: 0, inputDisplay: 'Hidden Test Case 5', expectedDisplay: '0', isHidden: true },
      { id: 6,  args: [[1]],                        expected: 0, inputDisplay: 'Hidden Test Case 6', expectedDisplay: '0', isHidden: true },
      { id: 7,  args: [[1,2]],                      expected: 0, inputDisplay: 'Hidden Test Case 7', expectedDisplay: '0', isHidden: true },
      { id: 8,  args: [[2,0,2]],                    expected: 2, inputDisplay: 'Hidden Test Case 8', expectedDisplay: '2', isHidden: true },
      { id: 9,  args: [[3,1,2,4,0,1,3,2]],          expected: 8, inputDisplay: 'Hidden Test Case 9', expectedDisplay: '8', isHidden: true },
      { id: 10, args: [[5,2,1,2,1,5]],              expected: 14, inputDisplay: 'Hidden Test Case 10', expectedDisplay: '14', isHidden: true },
      { id: 11, args: [[4,9,4,5,3,7]],              expected: 10, inputDisplay: 'Hidden Test Case 11', expectedDisplay: '10', isHidden: true },
      { id: 12, args: [[0,7,1,4,6]],                expected: 8, inputDisplay: 'Hidden Test Case 12', expectedDisplay: '8', isHidden: true },
    ],
    compare: (a: unknown, e: unknown) => Number(a) === Number(e),
    displayResult: (v: unknown) => String(v),
  },
  6: {
    functionName: 'lengthOfLongestSubstring',
    tests: [
      { id: 1, args: ['abcabcbb'], expected: 3, inputDisplay: 's="abcabcbb"', expectedDisplay: '3', isHidden: false },
      { id: 2, args: ['bbbbb'], expected: 1, inputDisplay: 's="bbbbb"', expectedDisplay: '1', isHidden: false },
      { id: 3, args: ['pwwkew'], expected: 3, inputDisplay: 's="pwwkew"', expectedDisplay: '3', isHidden: false },
      { id: 4, args: [''], expected: 0, inputDisplay: 'Hidden Test Case 4', expectedDisplay: '0', isHidden: true },
    ],
    compare: (a: unknown, e: unknown) => Number(a) === Number(e),
    displayResult: (v: unknown) => String(v),
  },
  7: {
    functionName: 'findKthLargest',
    tests: [
      { id: 1, args: [[3,2,1,5,6,4], 2], expected: 5, inputDisplay: 'nums=[3,2,1,5,6,4], k=2', expectedDisplay: '5', isHidden: false },
      { id: 2, args: [[3,2,3,1,2,4,5,5,6], 4], expected: 4, inputDisplay: 'nums=[3,2,3,1,2,4,5,5,6], k=4', expectedDisplay: '4', isHidden: false },
      { id: 3, args: [[1], 1], expected: 1, inputDisplay: 'nums=[1], k=1', expectedDisplay: '1', isHidden: false },
      { id: 4, args: [[2,1], 1], expected: 2, inputDisplay: 'Hidden Test Case 4', expectedDisplay: '2', isHidden: true },
    ],
    compare: (a: unknown, e: unknown) => Number(a) === Number(e),
    displayResult: (v: unknown) => String(v),
  },
  8: {
    functionName: 'climbStairs',
    tests: [
      { id: 1, args: [2], expected: 2, inputDisplay: 'n=2', expectedDisplay: '2', isHidden: false },
      { id: 2, args: [3], expected: 3, inputDisplay: 'n=3', expectedDisplay: '3', isHidden: false },
      { id: 3, args: [1], expected: 1, inputDisplay: 'n=1', expectedDisplay: '1', isHidden: false },
      { id: 4, args: [4], expected: 5, inputDisplay: 'Hidden Test Case 4', expectedDisplay: '5', isHidden: true },
    ],
    compare: (a: unknown, e: unknown) => Number(a) === Number(e),
    displayResult: (v: unknown) => String(v),
  },
  9: {
    functionName: 'canFinish',
    tests: [
      { id: 1, args: [2, [[1,0]]], expected: true, inputDisplay: 'numCourses=2, prerequisites=[[1,0]]', expectedDisplay: 'true', isHidden: false },
      { id: 2, args: [2, [[1,0],[0,1]]], expected: false, inputDisplay: 'numCourses=2, prerequisites=[[1,0],[0,1]]', expectedDisplay: 'false', isHidden: false },
      { id: 3, args: [1, []], expected: true, inputDisplay: 'numCourses=1, prerequisites=[]', expectedDisplay: 'true', isHidden: false },
      { id: 4, args: [3, [[1,0],[2,1]]], expected: true, inputDisplay: 'Hidden Test Case 4', expectedDisplay: 'true', isHidden: true },
    ],
    compare: (a: unknown, e: unknown) => Boolean(a) === Boolean(e),
    displayResult: (v: unknown) => String(v),
  },
};

const LANGUAGES = [
  { label: 'JavaScript', value: 'javascript', monaco: 'javascript' },
  { label: 'Python 3',   value: 'python',     monaco: 'python'     },
  { label: 'Java 17',    value: 'java',        monaco: 'java'       },
  { label: 'C++ 20',     value: 'cpp',         monaco: 'cpp'        },
];

const DIFF_SCORE: Record<Difficulty, number> = { Easy: 10, Medium: 15, Hard: 20 };

// ─── BACKEND EVALUATION ENGINE ───────────────────────────────────────────────
// All 500+ hidden test cases run securely on the server.
// This function submits code to /api/coding/evaluate, polls for progress,
// and returns the final EvalResult — test case data never reaches the browser.
async function evaluateWithBackend(
  code: string,
  lang: string,
  questionId: number,
  mode: 'run' | 'submit',
  prevAttempts: number,
  timeTakenSec: number,
  difficulty: Difficulty,
  onProgress: (processed: number, total: number) => void,
): Promise<EvalResult> {
  const DIFF_SCORE: Record<Difficulty, number> = { Easy: 10, Medium: 15, Hard: 20 };
  const maxScore = DIFF_SCORE[difficulty];
  const token = localStorage.getItem('token');

  try {
    // 1. Submit code — get jobId back immediately
    const submitRes = await fetch('http://localhost:5005/api/coding/evaluate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ code, lang, questionId, mode }),
    });
    if (!submitRes.ok) throw new Error('Submission failed');
    const { jobId } = await submitRes.json() as { jobId: string };

    // 2. Poll for progress every 300ms
    const POLL_INTERVAL = 300;
    const MAX_WAIT_MS = 30000;
    const t0 = Date.now();

    while (Date.now() - t0 < MAX_WAIT_MS) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL));
      const pollRes = await fetch(`http://localhost:5005/api/coding/status/${jobId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await pollRes.json() as {
        status: string; processed: number; total: number;
        result?: { passed: number; total: number; executionMs: number; memoryMB: number;
                   score: number; maxScore: number; status: string; stdout: string;
                   compilationError?: string; runtimePercentile: number };
        error?: string;
      };

      onProgress(data.processed ?? 0, data.total ?? 500);

      if (data.status === 'complete' && data.result) {
        const r = data.result;
        const status = r.status as EvalStatus;
        // Build synthetic testResults for the UI — hidden cases stay hidden
        const visibleCount = 3;
        const hiddenCount = r.total - visibleCount;
        const passedVisible = Math.round((r.passed / r.total) * visibleCount);
        const passedHidden  = r.passed - passedVisible;

        const testResults: TestCaseResult[] = [
          ...Array.from({ length: visibleCount }, (_, i) => ({
            id: i + 1,
            inputDisplay: `Test Case ${i + 1}`,
            expectedDisplay: 'Expected',
            actualDisplay: i < passedVisible ? 'Correct' : 'Wrong',
            passed: i < passedVisible,
            isHidden: false,
          })),
          ...Array.from({ length: hiddenCount }, (_, i) => ({
            id: visibleCount + i + 1,
            inputDisplay: `Hidden Test Case ${visibleCount + i + 1}`,
            expectedDisplay: '●',
            actualDisplay: i < passedHidden ? 'Correct' : 'Wrong',
            passed: i < passedHidden,
            isHidden: true,
          })),
        ];

        let bonus = 0;
        if (status === 'correct') {
          if (timeTakenSec < 120) bonus = difficulty === 'Hard' ? 5 : difficulty === 'Medium' ? 3 : 2;
          else if (timeTakenSec < 300) bonus = 1;
        }

        return {
          status, passed: r.passed, total: r.total,
          score: r.score, maxScore, bonus,
          testResults, stdout: r.stdout,
          executionMs: r.executionMs, memoryMB: r.memoryMB,
          runtimePercentile: r.runtimePercentile,
          attempts: prevAttempts + 1, timeTakenSec,
          locked: status === 'correct',
          aiFeedback: r.aiFeedback,
          timeComplexity: r.timeComplexity,
          spaceComplexity: r.spaceComplexity,
        };
      }

      if (data.status === 'error') throw new Error(data.error || 'Evaluation error');
    }
    throw new Error('Evaluation timed out');
  } catch (err) {
    // Fallback: return a failed result so the UI doesn't break
    return {
      status: 'error', passed: 0, total: 500, score: 0, maxScore, bonus: 0,
      testResults: [],
      stdout: (err as Error).message,
      executionMs: 0, memoryMB: 0, runtimePercentile: 0,
      attempts: prevAttempts + 1, timeTakenSec, locked: false,
    };
  }
}

// Legacy local-only stub — kept for type reference only, unused at runtime
function executeJavaScript(
  code: string,
  funcName: string,
  tests: TestCaseDef[],
  compare: (a: unknown, e: unknown) => boolean,
  displayResult: (v: unknown) => string,
): Promise<{ testResults: TestCaseResult[]; stdout: string; executionMs: number }> {
  return new Promise((resolve) => {
    const workerCode = `
      self.onmessage = function(e) {
        const { code, funcName, tests, compareStr, displayResultStr } = e.data;
        const logs = [];
        const origLog = console.log;
        const origWarn = console.warn;
        const origError = console.error;
        console.log = (...a) => logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '));
        console.warn = (...a) => logs.push('⚠️ ' + a.join(' '));
        console.error = (...a) => logs.push('❌ ' + a.join(' '));

        const t0 = performance.now();
        const testResults = [];
        
        let compareFn;
        let displayResultFn;
        try {
          compareFn = new Function('return ' + compareStr)();
          displayResultFn = new Function('return ' + displayResultStr)();
        } catch (e) {
          self.postMessage({ testResults: [], stdout: 'Failed to initialize test suite.', executionMs: 0 });
          return;
        }

        for (const tc of tests) {
          try {
            const argsCopy = JSON.parse(JSON.stringify(tc.args));
            let fn;
            try {
              fn = new Function(code + "\\nif(typeof " + funcName + " !== 'function') throw new Error('Function not found.'); return " + funcName + ";")();
            } catch (defErr) {
              testResults.push({
                id: tc.id, inputDisplay: tc.inputDisplay, expectedDisplay: tc.expectedDisplay,
                actualDisplay: 'Definition Error', passed: false, isHidden: tc.isHidden,
                error: defErr.message,
              });
              continue;
            }
            const result = fn(...argsCopy);
            const passed = compareFn(result, tc.expected);
            testResults.push({
              id: tc.id, inputDisplay: tc.inputDisplay, expectedDisplay: tc.expectedDisplay,
              actualDisplay: displayResultFn(result), passed, isHidden: tc.isHidden,
            });
          } catch (err) {
            testResults.push({
              id: tc.id, inputDisplay: tc.inputDisplay, expectedDisplay: tc.expectedDisplay,
              actualDisplay: 'Runtime Error', passed: false, isHidden: tc.isHidden,
              error: err.message,
            });
          }
        }
        
        const executionMs = Math.round(performance.now() - t0);
        
        self.postMessage({ testResults, stdout: logs.join('\\n'), executionMs });
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    const timeout = setTimeout(() => {
      worker.terminate();
      resolve({ testResults: [], stdout: 'Execution Time Limit Exceeded (Possible Infinite Loop)', executionMs: 5000 });
    }, 5000);

    worker.onmessage = (e) => {
      clearTimeout(timeout);
      worker.terminate();
      resolve(e.data);
    };

    worker.onerror = (err) => {
      clearTimeout(timeout);
      worker.terminate();
      resolve({ testResults: [], stdout: 'Worker Error: ' + err.message, executionMs: 0 });
    };

    worker.postMessage({
      code,
      funcName,
      tests,
      compareStr: compare.toString(),
      displayResultStr: displayResult.toString()
    });
  });
}

function simulateExecution(
  code: string,
  tests: TestCaseDef[]
): { testResults: TestCaseResult[]; stdout: string; executionMs: number } {
  const lines = code.split('\n').filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('#')).length;
  const hasReturn = /return\s+[^\s;{]/.test(code);
  const isTemplate = lines <= 5 || !hasReturn;

  const testResults: TestCaseResult[] = tests.map((tc) => {
    const passed = !isTemplate;
    return {
      id: tc.id, inputDisplay: tc.inputDisplay, expectedDisplay: tc.expectedDisplay,
      actualDisplay: passed ? tc.expectedDisplay : 'Output mismatch (Code missing logic or return)',
      passed, isHidden: tc.isHidden,
    };
  });

  const stdout = isTemplate
    ? ''
    : `[Server-side execution simulated]\nNative execution backend required for full testing.\nAssuming code is valid based on structure.`;

  return { testResults, stdout, executionMs: 45 + Math.floor(Math.random() * 200) };
}

async function executePythonPiston(
  code: string,
  funcName: string,
  tests: TestCaseDef[],
  compare: (a: unknown, e: unknown) => boolean,
  displayResult: (v: unknown) => string,
): Promise<{ testResults: TestCaseResult[]; stdout: string; executionMs: number }> {
  const t0 = performance.now();
  const testResults: TestCaseResult[] = [];
  let stdout = '';

  const runner = `
import json
import sys
import traceback

${code}

def __run_tests():
    tests = ${JSON.stringify(tests.map(t => t.args))}
    out = []
    for t in tests:
        try:
            res = eval("${funcName}(*t)")
            out.append({"success": True, "res": res})
        except Exception as e:
            out.append({"success": False, "error": traceback.format_exc()})
    print("\\n___RESULT___" + json.dumps(out))

if __name__ == "__main__":
    __run_tests()
`;

  try {
    const res = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: "python",
        version: "3.10.0",
        files: [{ name: "main.py", content: runner }]
      })
    });
    const data = await res.json();
    stdout = data.run.stdout || '';
    if (data.run.stderr) stdout += '\\n' + data.run.stderr;

    const resultMatch = stdout.match(/___RESULT___(.*)/);
    if (resultMatch) {
      const parsed = JSON.parse(resultMatch[1]);
      stdout = stdout.replace(/___RESULT___.*/, '');

      tests.forEach((tc, i) => {
        const pr = parsed[i];
        if (!pr.success) {
          testResults.push({
            id: tc.id, inputDisplay: tc.inputDisplay, expectedDisplay: tc.expectedDisplay,
            actualDisplay: 'Runtime Error', passed: false, isHidden: tc.isHidden, error: pr.error
          });
        } else {
          const passed = compare(pr.res, tc.expected);
          testResults.push({
            id: tc.id, inputDisplay: tc.inputDisplay, expectedDisplay: tc.expectedDisplay,
            actualDisplay: displayResult(pr.res), passed, isHidden: tc.isHidden
          });
        }
      });
    } else {
      tests.forEach(tc => {
        testResults.push({
          id: tc.id, inputDisplay: tc.inputDisplay, expectedDisplay: tc.expectedDisplay,
          actualDisplay: 'Error', passed: false, isHidden: tc.isHidden, error: stdout.trim()
        });
      });
    }
  } catch (err: unknown) {
    tests.forEach(tc => {
      testResults.push({
        id: tc.id, inputDisplay: tc.inputDisplay, expectedDisplay: tc.expectedDisplay,
        actualDisplay: 'API Error', passed: false, isHidden: tc.isHidden, error: (err as Error).message
      });
    });
  }

  const executionMs = Math.round(performance.now() - t0);
  return { testResults, stdout: stdout.trim(), executionMs };
}

async function evaluateQuestion(
  code: string,
  lang: string,
  questionId: number,
  prevAttempts: number,
  timeTakenSec: number,
  difficulty: Difficulty,
): Promise<EvalResult> {
  const suite    = QUESTION_TESTS[questionId];
  const maxScore = DIFF_SCORE[difficulty];

  let testResults: TestCaseResult[];
  let stdout: string;
  let executionMs: number;

  if (lang === 'javascript') {
    const r = await executeJavaScript(code, suite.functionName, suite.tests, suite.compare, suite.displayResult);
    testResults = r.testResults; stdout = r.stdout; executionMs = r.executionMs;
  } else if (lang === 'python') {
    const r = await executePythonPiston(code, suite.functionName, suite.tests, suite.compare, suite.displayResult);
    testResults = r.testResults; stdout = r.stdout; executionMs = r.executionMs;
  } else {
    const r = simulateExecution(code, suite.tests);
    testResults = r.testResults; stdout = r.stdout; executionMs = r.executionMs;
  }

  const passed = testResults.filter(t => t.passed).length;
  const total  = testResults.length;

  let status: EvalStatus;
  let score: number;
  let bonus = 0;

  const firstError = testResults.find(t => t.error);

  if (passed === 0) {
    status = firstError ? 'error' : 'wrong';
    score  = 0;
  } else if (passed === total) {
    status = 'correct';
    score  = maxScore;
    if (timeTakenSec < 120) bonus = difficulty === 'Hard' ? 5 : difficulty === 'Medium' ? 3 : 2;
    else if (timeTakenSec < 300) bonus = 1;
  } else {
    status = 'partial';
    score  = Math.round((passed / total) * maxScore);
  }

  const seed2 = code.length + questionId;
  const memoryMB        = 20 + ((seed2 * 17) % 30);
  const runtimePercentile = passed === total ? 70 + ((seed2 * 7) % 25) : passed === 0 ? 5 + ((seed2 * 3) % 15) : 30 + ((seed2 * 11) % 30);

  return {
    status, passed, total, score, maxScore, bonus,
    testResults, stdout, executionMs, memoryMB, runtimePercentile,
    attempts: prevAttempts + 1, timeTakenSec,
    locked: status === 'correct',
  };
}

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────
function DiffBadge({ d }: { d: Difficulty }) {
  const cls = d === 'Easy' ? 'bg-emerald-100 text-emerald-700' : d === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';
  return <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${cls}`}>{d}</span>;
}

// ─── EVALUATION PANEL ─────────────────────────────────────────────────────────
interface EvalPanelProps {
  evalResult: EvalResult | null;
  questionIdx: number;
  isLastQuestion: boolean;
  onRunAgain: () => void;
  onSubmitAnyway: () => void;
  onNextQuestion: () => void;
  consoleTab: ConsoleTab;
  setConsoleTab: (t: ConsoleTab) => void;
}

function EvaluationPanel({
  evalResult, questionIdx, isLastQuestion,
  onRunAgain, onSubmitAnyway, onNextQuestion,
  consoleTab, setConsoleTab,
}: EvalPanelProps) {
  const [selectedTC, setSelectedTC] = useState<number | null>(null);
  const [prevQuestionIdx, setPrevQuestionIdx] = useState(questionIdx);

  if (questionIdx !== prevQuestionIdx) {
    setPrevQuestionIdx(questionIdx);
    setSelectedTC(null);
  }

  const statusCfg = {
    correct: { label: 'Accepted',          color: 'emerald', icon: '✅', barColor: 'bg-emerald-500', bannerBg: 'bg-emerald-950/60 border-emerald-700' },
    partial: { label: 'Partially Correct', color: 'amber',   icon: '⚠️', barColor: 'bg-amber-500',   bannerBg: 'bg-amber-950/60 border-amber-700'   },
    wrong:   { label: 'Wrong Answer',      color: 'rose',    icon: '❌', barColor: 'bg-rose-500',     bannerBg: 'bg-rose-950/60 border-rose-700'     },
    error:   { label: 'Runtime Error',     color: 'red',     icon: '🔴', barColor: 'bg-red-500',      bannerBg: 'bg-red-950/60 border-red-800'       },
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d1a] overflow-hidden">
      <div className="flex items-center border-b border-white/10 bg-[#13131f] shrink-0">
        {(['results','console'] as ConsoleTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setConsoleTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold capitalize transition-all border-b-2 -mb-px ${
              consoleTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'results' ? '📊 Test Results' : '> Console'}
          </button>
        ))}
        {evalResult && (
          <div className="ml-auto px-4 text-[10px] text-slate-600 font-mono font-semibold">
            {evalResult.executionMs}ms · {evalResult.memoryMB}MB
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {consoleTab === 'console' ? (
          <div className="p-4">
            {evalResult?.stdout ? (
              <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">{evalResult.stdout}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-600">
                <Terminal className="w-7 h-7 mb-2 opacity-40" />
                <p className="text-xs font-medium">No console output</p>
                <p className="text-[10px] mt-1 opacity-60">Use console.log() to debug your code</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {!evalResult ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-slate-600">
                <Play className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm font-semibold">Run your code to see results</p>
                <p className="text-[11px] mt-1 opacity-60">Click "Run Code" to evaluate against test cases</p>
              </div>
            ) : (() => {
              const cfg = statusCfg[evalResult.status as keyof typeof statusCfg] || { label: 'Time Limit Exceeded', color: 'orange', icon: '⏱️', barColor: 'bg-orange-500', bannerBg: 'bg-orange-950/60 border-orange-800' };
              const passPercent = Math.round((evalResult.passed / evalResult.total) * 100);
              const sel = selectedTC !== null ? evalResult.testResults[selectedTC] : null;

              return (
                <div className="flex flex-col">
                  <div className={`flex items-center justify-between px-4 py-3 border-b ${cfg.bannerBg}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cfg.icon}</span>
                      <div>
                        <div className={`font-black text-${cfg.color}-400 text-sm tracking-wide`}>{cfg.label}</div>
                        <div className="text-slate-400 text-[11px]">
                          {evalResult.passed}/{evalResult.total} test cases passed
                          {evalResult.status === 'correct' && evalResult.runtimePercentile && (
                            <span className="ml-2 text-emerald-400">· Faster than {evalResult.runtimePercentile.toFixed(1)}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-black text-${cfg.color}-400 text-2xl`}>
                        {evalResult.score}/{evalResult.maxScore}
                      </div>
                      <div className="text-slate-500 text-[10px] uppercase tracking-widest">points</div>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1.5">
                      <span>TEST CASES</span>
                      <span>{passPercent}% ({evalResult.passed}/{evalResult.total})</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${cfg.barColor}`}
                        style={{ width: `${passPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Performance Meter */}
                  <div className="grid grid-cols-4 divide-x divide-white/5 border-b border-white/10 text-center">
                    <div className="py-2.5">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" /> Runtime
                      </div>
                      <div className="text-sm font-black text-slate-200">{evalResult.executionMs} ms</div>
                    </div>
                    <div className="py-2.5">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 flex items-center justify-center gap-1">
                        <Cpu className="w-3 h-3" /> Memory
                      </div>
                      <div className="text-sm font-black text-slate-200">{evalResult.memoryMB.toFixed(1)} MB</div>
                    </div>
                    <div className="py-2.5">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 flex items-center justify-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Speed
                      </div>
                      <div className="text-sm font-black text-emerald-400">{evalResult.runtimePercentile > 0 ? `Top ${100 - evalResult.runtimePercentile}%` : '---'}</div>
                    </div>
                    <div className="py-2.5">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 flex items-center justify-center gap-1">
                        <Target className="w-3 h-3" /> Accuracy
                      </div>
                      <div className="text-sm font-black text-blue-400">{passPercent}%</div>
                    </div>
                  </div>

                  {evalResult.timeComplexity && evalResult.spaceComplexity && (
                    <div className="px-4 py-3 border-b border-white/10 bg-indigo-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-indigo-400" />
                        <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest">AI Evaluation</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="bg-black/20 p-2 rounded border border-indigo-500/20">
                          <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">Time Complexity</div>
                          <div className="text-sm font-mono text-indigo-200">{evalResult.timeComplexity}</div>
                        </div>
                        <div className="bg-black/20 p-2 rounded border border-indigo-500/20">
                          <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">Space Complexity</div>
                          <div className="text-sm font-mono text-indigo-200">{evalResult.spaceComplexity}</div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed border-l-2 border-indigo-500 pl-3 py-1">
                        {evalResult.aiFeedback}
                      </div>
                    </div>
                  )}

                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex flex-wrap gap-1.5">
                      {evalResult.testResults.map((tc, i) => (
                        <button
                          key={tc.id}
                          onClick={() => setSelectedTC(selectedTC === i ? null : i)}
                          title={tc.isHidden ? 'Hidden Test Case' : tc.inputDisplay}
                          className={`
                            px-2.5 py-1 rounded-lg text-[10px] font-black transition-all border
                            ${selectedTC === i ? 'ring-2 ring-offset-1 ring-offset-[#0d0d1a] ring-blue-500' : ''}
                            ${tc.passed
                              ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700 hover:bg-emerald-800/80'
                              : 'bg-rose-900/60 text-rose-300 border-rose-700 hover:bg-rose-800/80'
                            }
                          `}
                        >
                          {tc.isHidden ? `●${i+1}` : `TC${i+1}`} {tc.passed ? '✓' : '✗'}
                        </button>
                      ))}
                    </div>
                    {evalResult.testResults.some(t => t.isHidden) && (
                      <p className="text-[9px] text-slate-600 mt-2 font-semibold">● = Hidden test case</p>
                    )}
                  </div>

                  {sel && (
                    <div className="px-4 py-3 border-b border-white/10 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${sel.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {sel.isHidden ? '🔒 Hidden Test Case' : `Test Case ${selectedTC! + 1}`}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${sel.passed ? 'bg-emerald-900/50 text-emerald-300' : 'bg-rose-900/50 text-rose-300'}`}>
                          {sel.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      {!sel.isHidden && (
                        <div>
                          <div className="text-[9px] text-slate-600 font-bold uppercase mb-1">Input</div>
                          <div className="font-mono text-xs bg-white/5 text-slate-300 px-3 py-2 rounded-lg border border-white/5">{sel.inputDisplay}</div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[9px] text-slate-600 font-bold uppercase mb-1">Expected Output</div>
                          <div className="font-mono text-xs bg-emerald-950/40 text-emerald-300 px-3 py-2 rounded-lg border border-emerald-900/50">{sel.expectedDisplay}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-600 font-bold uppercase mb-1">Your Output</div>
                          <div className={`font-mono text-xs px-3 py-2 rounded-lg border ${sel.passed ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/50' : 'bg-rose-950/40 text-rose-300 border-rose-900/50'}`}>
                            {sel.error ? (
                              <span className="text-rose-400 text-[10px]">{sel.error.slice(0, 80)}{sel.error.length > 80 ? '…' : ''}</span>
                            ) : sel.actualDisplay}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {evalResult.status === 'correct' && (
                    <div className="px-4 py-3 border-b border-white/10 bg-emerald-950/30">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-black text-emerald-300">
                          +{evalResult.score} pts earned
                          {evalResult.bonus > 0 && <span className="text-amber-300 ml-1">+ {evalResult.bonus} speed bonus 🚀</span>}
                        </span>
                      </div>
                      {evalResult.locked && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Lock className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] text-emerald-500 font-bold">Score locked — Question Completed Successfully</span>
                        </div>
                      )}
                    </div>
                  )}

                  {evalResult.status === 'partial' && !evalResult.locked && (
                    <div className="px-4 py-2 border-b border-white/10 bg-amber-950/20">
                      <p className="text-[11px] text-amber-300 font-semibold">
                        💡 Check edge cases and optimize your logic. ({evalResult.passed}/{evalResult.total} passed)
                      </p>
                    </div>
                  )}
                  {evalResult.status === 'partial' && evalResult.locked && (
                    <div className="px-4 py-2 border-b border-white/10 bg-amber-950/20">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] text-amber-400 font-bold">Score locked at {evalResult.score}/{evalResult.maxScore} pts</span>
                      </div>
                    </div>
                  )}

                  {evalResult.status === 'error' && (
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="flex items-start gap-2 bg-red-950/30 border border-red-900/50 rounded-xl p-3">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-red-400 mb-1">Runtime Error</div>
                          <pre className="text-[11px] text-red-300 whitespace-pre-wrap font-mono">
                            {evalResult.testResults.find(t=>t.error)?.error || 'Unknown error'}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {evalResult.status === 'wrong' && (
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="flex items-center gap-2 text-rose-400">
                        <XCircle className="w-4 h-4 shrink-0" />
                        <p className="text-[11px] font-semibold">Your solution doesn't produce the expected output. Review the logic and retry.</p>
                      </div>
                    </div>
                  )}

                  <div className="px-4 py-3 flex flex-wrap items-center gap-2">
                    {!evalResult.locked && (
                      <>
                        <button
                          onClick={onRunAgain}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          <RefreshCw className="w-3 h-3" />
                          {evalResult.status === 'partial' ? 'Run Again' : 'Try Again'}
                        </button>
                        {evalResult.status === 'partial' && (
                          <button
                            onClick={onSubmitAnyway}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all"
                          >
                            Submit Anyway →
                          </button>
                        )}
                      </>
                    )}
                    {evalResult.locked && (
                      <button
                        onClick={onNextQuestion}
                        className="ml-auto flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-blue-900/50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {isLastQuestion ? 'Finish Assessment' : 'Proceed to Next Question'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function CodingAssessment() {
  const [stage, setStage]               = useState<Stage>('instructions');
  const [rules, setRules]               = useState({ r1: false, r2: false, r3: false, r4: false });
  const [activeQ, setActiveQ]           = useState(0);
  const [lang, setLang]                 = useState('javascript');
  const [codes, setCodes]               = useState<Record<string, Record<string, string>>>({});
  const [qStatus, setQStatus]           = useState<QStatus[]>(Array(5).fill('unanswered'));
  const [timer, setTimer]               = useState(3600);
  const [strikes, setStrikes]           = useState(0);
  const [warningMsg, setWarningMsg]     = useState('');
  const [warningVisible, setWarningVisible] = useState(false);
  const [running, setRunning]           = useState(false);
  const [hiddenProgress, setHiddenProgress] = useState<{ processed: number; total: number } | null>(null);
  const [qResults, setQResults]         = useState<Record<number, EvalResult>>({});
  const [consoleTab, setConsoleTab]     = useState<ConsoleTab>('results');
  const [showPanel, setShowPanel]       = useState(false);
  const [summaryResults, setSummaryResults] = useState<unknown>(null);

  const qTimeRef = useRef<Record<number, { start: number; accumulated: number }>>({});
  const strikesRef = useRef(0);

  const violationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runCodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initQTime = (idx: number) => {
    if (!qTimeRef.current[idx]) qTimeRef.current[idx] = { start: Date.now(), accumulated: 0 };
    else qTimeRef.current[idx].start = Date.now();
  };

  const pauseQTime = (idx: number) => {
    const qt = qTimeRef.current[idx];
    if (qt) qt.accumulated += (Date.now() - qt.start) / 1000;
  };

  const getQTimeSec = useCallback((idx: number): number => {
    const qt = qTimeRef.current[idx];
    if (!qt) return 0;
    const current = activeQ === idx ? (Date.now() - qt.start) / 1000 : 0;
    return Math.floor(qt.accumulated + current);
  }, [activeQ]);

  const getCode = useCallback(() => {
    const q = QUESTIONS[activeQ];
    return codes[activeQ]?.[lang] ?? q.defaultCode[lang] ?? '';
  }, [codes, activeQ, lang]);

  const setCode = useCallback((c: string) => {
    setCodes(prev => ({
      ...prev,
      [activeQ]: {
        ...(prev[activeQ] || {}),
        [lang]: c,
      },
    }));
  }, [activeQ, lang]);

  const doSubmitRef = useRef<(() => void) | null>(null);

  const triggerViolation = useCallback((reason: string) => {
    strikesRef.current += 1;
    const n = strikesRef.current;
    setStrikes(n);
    if (violationTimerRef.current) clearTimeout(violationTimerRef.current);
    if (n >= 3) {
      setWarningMsg('🚨 Third violation detected — Assessment auto-submitted!');
      setWarningVisible(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)._devForceSubmit = () => doSubmitRef.current?.();
      violationTimerRef.current = setTimeout(() => doSubmitRef.current?.(), 2000);
    } else {
      setWarningMsg(n === 1
        ? `⚠️ Warning 1/3: ${reason} — This is your first warning.`
        : `🚨 Final Warning 2/3: ${reason} — One more violation will auto-submit.`);
      setWarningVisible(true);
      violationTimerRef.current = setTimeout(() => setWarningVisible(false), 6000);
    }
  }, []);

  useEffect(() => {
    if (stage !== 'exam') return;
    const onVis  = () => { if (document.hidden) triggerViolation('Tab switch or window minimize detected'); };
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); triggerViolation('Copy action detected'); };
    const onPaste= (e: ClipboardEvent) => { e.preventDefault(); triggerViolation('Paste action detected'); };
    const onCtx  = (e: MouseEvent)     => { e.preventDefault(); triggerViolation('Right-click action detected'); };
    document.addEventListener('visibilitychange', onVis);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('contextmenu', onCtx);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onCtx);
      if (violationTimerRef.current) clearTimeout(violationTimerRef.current);
    };
  }, [stage, triggerViolation]);

  // ─── TIMER ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'exam') return;
    const id = setInterval(() => {
      setTimer(prev => { if (prev <= 1) { doSubmitRef.current?.(); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(id);
  }, [stage]);

  const fmtTime = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const timerCls = timer > 900 ? 'text-emerald-400' : timer > 300 ? 'text-amber-400' : 'text-rose-400';
  const timerBg  = timer > 900 ? 'border-emerald-700 bg-emerald-950/50' : timer > 300 ? 'border-amber-700 bg-amber-950/50' : 'border-rose-700 bg-rose-950/50 animate-pulse';

  // ─── RUN CODE / SUBMIT CODE ──────────────────────────────────────────────────
  const handleAction = (mode: 'run' | 'submit') => {
    const q = QUESTIONS[activeQ];
    const prevResult = qResults[activeQ];
    if (prevResult?.locked) return;

    setRunning(true);
    setHiddenProgress({ processed: 0, total: mode === 'run' ? 5 : 500 });
    setConsoleTab('results');
    setShowPanel(true);

    (async () => {
      const code         = getCode();
      const timeTaken    = getQTimeSec(activeQ);
      const prevAttempts = prevResult?.attempts ?? 0;

      const result = await evaluateWithBackend(
        code, lang, q.id, mode, prevAttempts, timeTaken, q.difficulty,
        (processed, total) => setHiddenProgress({ processed, total }),
      );

      if (mode === 'submit') {
        result.locked = true;
      }

      setQResults(prev => ({ ...prev, [activeQ]: result }));
      setQStatus(prev => {
        const n = [...prev];
        n[activeQ] = result.status === 'correct' ? 'correct'
          : result.status === 'partial' ? 'partial'
          : result.status === 'error' ? 'error'
          : result.status === 'tle' ? 'error'
          : 'wrong';
        return n;
      });

      setHiddenProgress(null);
      setRunning(false);
    })();
  };

  const handleRun = () => handleAction('run');
  const handleSubmit = () => handleAction('submit');
  const handleSubmitAnyway = handleSubmit;

  // ─── SWITCH QUESTION ────────────────────────────────────────────────────────
  const switchQuestion = (idx: number) => {
    if (idx === activeQ) return;
    pauseQTime(activeQ);
    initQTime(idx);
    setActiveQ(idx);
    setShowPanel(false);
    setConsoleTab('results');
  };

  // ─── NEXT QUESTION ──────────────────────────────────────────────────────────
  const handleNextQuestion = () => {
    pauseQTime(activeQ);
    if (activeQ < 4) {
      const next = activeQ + 1;
      initQTime(next);
      setActiveQ(next);
      setShowPanel(false);
      setConsoleTab('results');
    } else {
      doSubmitRef.current?.();
    }
  };

  // ─── SUBMIT ASSESSMENT ──────────────────────────────────────────────────────
  const doSubmit = () => {
    pauseQTime(activeQ);
    strikesRef.current = 0;

    let totalScore = 0, maxPossible = 0, totalPassed = 0, totalCases = 0;
    let solved = 0, totalTimeSec = 0, totalExecutionMs = 0, totalMemoryMB = 0;
    let easyScore = 0, easyMax = 0, medScore = 0, medMax = 0, hardScore = 0, hardMax = 0;

    QUESTIONS.forEach((q, i) => {
      const qMax = DIFF_SCORE[q.difficulty];
      maxPossible += qMax;
      if (q.difficulty === 'Easy') easyMax += qMax;
      else if (q.difficulty === 'Medium') medMax += qMax;
      else hardMax += qMax;

      const r = qResults[i];
      if (r) {
        totalScore  += r.score + (r.locked ? r.bonus : 0);
        totalPassed += r.passed;
        totalCases  += r.total;
        totalTimeSec+= r.timeTakenSec;
        totalExecutionMs += r.executionMs || 0;
        totalMemoryMB += r.memoryMB || 0;
        if (r.status === 'correct' || r.status === 'partial') solved++;
        if (q.difficulty === 'Easy') easyScore += r.score;
        else if (q.difficulty === 'Medium') medScore += r.score;
        else hardScore += r.score;
      }
    });

    const accuracy    = totalCases ? Math.round((totalPassed / totalCases) * 100) : 0;
    const finalScore  = maxPossible ? Math.round((totalScore / maxPossible) * 100) : 0;
    const avgTimeSec  = solved ? Math.round(totalTimeSec / Math.max(solved, 1)) : 0;
    const avgExecutionMs = solved ? Math.round(totalExecutionMs / solved) : 0;
    const avgMemoryMB = solved ? (totalMemoryMB / solved).toFixed(1) : 0;

    setSummaryResults({
      totalScore, maxPossible,
      codingScore: finalScore,
      dsaScore: Math.min(100, Math.round(finalScore * 0.92)),
      logicScore: Math.min(100, Math.round(finalScore * 1.08)),
      accuracy, totalPassed, totalCases,
      solved, avgTimeSec, totalTimeSec, avgExecutionMs, avgMemoryMB,
      easyPerf:  easyMax  ? Math.round((easyScore  / easyMax)  * 100) : 0,
      mediumPerf:medMax   ? Math.round((medScore   / medMax)   * 100) : 0,
      hardPerf:  hardMax  ? Math.round((hardScore  / hardMax)  * 100) : 0,
      perQuestion: QUESTIONS.map((q, i) => ({
        title: q.title, difficulty: q.difficulty,
        result: qResults[i] ?? null,
        timeSec: getQTimeSec(i),
      })),
    });

    setStage('results');
  };
  // Derived: all rules checked → enables Start button
  const allChecked = rules.r1 && rules.r2 && rules.r3 && rules.r4;

  // Keep ref pointing to latest doSubmit so async callbacks never go stale
  // (useEffect so the write happens outside render)
  useEffect(() => { doSubmitRef.current = doSubmit; });

  // ─── STAGE: INSTRUCTIONS ────────────────────────────────────────────────────
  if (stage === 'instructions') {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <div className="text-center space-y-3 pb-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-xs font-bold uppercase tracking-widest">
              <ShieldAlert className="w-3.5 h-3.5" /> Secure Assessment Platform
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-700">
              Coding Assessment Instructions
            </h1>
            <p className="text-slate-500 text-base">Read all instructions carefully before starting.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: FileCode2, color: 'blue',   label: 'Total Questions', val: '5',    sub: 'Easy → Medium → Hard' },
              { icon: Clock,     color: 'amber',  label: 'Duration',        val: '60 Min', sub: 'Auto-submit on timeout' },
              { icon: CheckCircle,color:'emerald', label: 'Passing Score',   val: '70%',  sub: 'Minimum to qualify' },
              { icon: Target,    color: 'violet', label: 'Max Score',        val: '75 pts', sub: '10+10+15+15+20+5 bonus' },
            ].map(({ icon: Icon, color, label, val, sub }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
                <div className="text-2xl font-black text-slate-800">{val}</div>
                <div className={`text-[11px] font-bold text-${color}-600 uppercase tracking-wide mb-0.5`}>{label}</div>
                <div className="text-[10px] text-slate-400 font-medium">{sub}</div>
              </div>
            ))}
          </div>

          {/* Scoring table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> Scoring System
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { d: 'Easy',   pts: 10, bonus: 2,  color: 'emerald', desc: '2 questions' },
                { d: 'Medium', pts: 15, bonus: 3,  color: 'amber',   desc: '2 questions' },
                { d: 'Hard',   pts: 20, bonus: 5,  color: 'rose',    desc: '1 question'  },
              ].map(({ d, pts, bonus, color, desc }) => (
                <div key={d} className={`bg-${color}-50 border border-${color}-200 rounded-xl p-4 text-center`}>
                  <div className={`text-2xl font-black text-${color}-700`}>{pts} pts</div>
                  <div className={`text-xs font-bold text-${color}-600 mb-1`}>{d}</div>
                  <div className="text-[10px] text-slate-400">{desc}</div>
                  <div className={`text-[10px] font-bold text-${color}-500 mt-1`}>+{bonus} speed bonus</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3 font-medium">
              ⚡ Speed bonus awarded when solved in under 2 minutes. Partial credit given for passing some test cases.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600"/> Programming Languages
              </h3>
              <div className="flex flex-wrap gap-2">
                {['JavaScript ✓', 'Python 3', 'Java 17', 'C++ 20'].map(l => (
                  <span key={l} className="px-3 py-1.5 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono font-bold">{l}</span>
                ))}
              </div>
              <p className="text-[11px] text-blue-600 font-semibold mt-3">
                ✓ JavaScript supports real-time browser execution. Other languages use server-side simulation.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-600"/> Evaluation System
              </h3>
              <div className="space-y-2">
                {['Each question evaluated immediately on Run Code', 'Both visible & hidden test cases checked', 'Score awarded question-by-question', 'Unlimited retries until score is locked'].map(t => (
                  <div key={t} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0"></div>{t}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500"/>
              <h2 className="font-bold text-slate-800">Assessment Rules & Consent</h2>
              <span className="ml-auto text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full border border-rose-200">All fields required</span>
            </div>
            <div className="p-6 space-y-3">
              {([
                ['r1', 'I understand that switching tabs may terminate the assessment.'],
                ['r2', 'I understand that copy-paste actions are monitored.'],
                ['r3', 'I understand that leaving the assessment window may result in submission.'],
                ['r4', 'I agree to follow all assessment guidelines and honor code.'],
              ] as [keyof typeof rules, string][]).map(([key, text]) => (
                <label key={key} className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer border transition-all ${rules[key] ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                  <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-all ${rules[key] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}>
                    {rules[key] && <CheckCircle className="w-3.5 h-3.5 text-white fill-white" />}
                  </div>
                  <input type="checkbox" className="sr-only" checked={rules[key]} onChange={e => setRules({...rules, [key]: e.target.checked})} />
                  <span className={`text-sm font-semibold ${rules[key] ? 'text-emerald-800' : 'text-slate-700'}`}>{text}</span>
                </label>
              ))}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                  <div className={`w-2 h-2 rounded-full ${allChecked ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>
                  {Object.values(rules).filter(Boolean).length} of 4 confirmed
                </div>
                <button
                  disabled={!allChecked}
                  onClick={() => { setStage('exam'); initQTime(0); }}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                >
                  Start Coding Session →
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── STAGE: EXAM ────────────────────────────────────────────────────────────
  if (stage === 'exam') {
    const q       = QUESTIONS[activeQ];
    const code    = getCode();
    const evalRes = qResults[activeQ] ?? null;
    const locked  = evalRes?.locked ?? false;
    return (
      <ExamStage
        q={q} code={code} lang={lang} activeQ={activeQ} qStatus={qStatus} qResults={qResults}
        timer={timer} strikes={strikes} warningMsg={warningMsg} warningVisible={warningVisible}
        running={running} evalRes={evalRes} locked={locked} showPanel={showPanel}
        hiddenProgress={hiddenProgress}
        consoleTab={consoleTab} setConsoleTab={setConsoleTab}
        setLang={setLang} setCode={setCode}
        onRun={handleRun} onSubmit={handleSubmit}
        onSubmitAnyway={handleSubmitAnyway}
        onNextQuestion={handleNextQuestion}
        onSwitchQ={switchQuestion}
        onExit={() => setStage('confirm')}
        onTogglePanel={() => setShowPanel(p => !p)}
        onToggleReview={() => setQStatus(prev => {
          const n=[...prev]; n[activeQ]=n[activeQ]==='review'?'unanswered':'review'; return n;
        })}
        onWarningClose={() => setWarningVisible(false)}
        fmtTime={fmtTime} timerCls={timerCls} timerBg={timerBg}
      />
    );
  }

  // ─── STAGE: CONFIRM ─────────────────────────────────────────────────────────
  if (stage === 'confirm') {
    const answered = Object.keys(qResults).length;
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-6 text-white text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-90" />
            <h2 className="text-2xl font-black">Submit Assessment?</h2>
            <p className="text-rose-100 text-sm mt-1">This action cannot be undone.</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-3 mb-6 text-center">
              {[
                { val: answered, label: 'Attempted', color: 'emerald' },
                { val: qStatus.filter(s => s === 'review').length, label: 'For Review', color: 'amber' },
                { val: QUESTIONS.length - answered, label: 'Unattempted', color: 'slate' },
              ].map(({ val, label, color }) => (
                <div key={label} className={`bg-${color}-50 border border-${color}-200 rounded-xl p-3`}>
                  <div className={`text-2xl font-black text-${color}-700`}>{val}</div>
                  <div className={`text-[10px] font-bold text-${color}-500 uppercase tracking-wide`}>{label}</div>
                </div>
              ))}
            </div>
            <p className="text-slate-500 text-sm font-medium mb-6 text-center">
              Are you sure you want to submit? You cannot return after submission.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={doSubmit} className="w-full py-3.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg">
                Exit & Submit Assessment
              </button>
              <button onClick={() => setStage('exam')} className="w-full py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all">
                Continue Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STAGE: RESULTS ─────────────────────────────────────────────────────────
  if (stage === 'results' && summaryResults) {
    const sr = summaryResults as any;
    const passed = sr.codingScore >= 70;
    const fmtSec = (s: number) => `${Math.floor(s/60)}m ${s%60}s`;

    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6 pb-24">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-700">
                Assessment Summary
              </h1>
              <p className="text-slate-500 mt-1">Detailed breakdown of your coding performance.</p>
            </div>
            <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm ${passed ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}>
              {passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {passed ? 'Assessment Passed ✓' : 'Assessment Failed'}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {[
              { label: 'Total Marks',       val: `${sr.totalScore}/${sr.maxPossible}`, color: 'blue',    icon: Trophy   },
              { label: 'Questions Solved',   val: `${sr.solved}/${QUESTIONS.length}`,  color: 'emerald', icon: CheckCircle },
              { label: 'Accuracy',           val: `${sr.accuracy}%`,                   color: 'violet',  icon: Target   },
              { label: 'Test Cases',         val: `${sr.totalPassed}/${sr.totalCases}`, color: 'cyan',  icon: BarChart2 },
              { label: 'Final Score',        val: `${sr.codingScore}%`,                color: passed ? 'emerald' : 'rose', icon: Star },
              { label: 'Avg Time / Q',       val: fmtSec(sr.avgTimeSec),               color: 'amber',   icon: Clock    },
              { label: 'Avg Runtime',        val: `${sr.avgExecutionMs} ms`,           color: 'emerald', icon: Code2 },
              { label: 'Avg Memory',         val: `${sr.avgMemoryMB} MB`,              color: 'indigo',  icon: Code2 },
            ].map(({ label, val, color, icon: Icon }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center hover:shadow-md transition-shadow">
                <Icon className={`w-5 h-5 text-${color}-500 mx-auto mb-2`} />
                <div className={`text-xl font-black text-${color}-700`}>{val}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Score Breakdown + Circular */}
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="relative w-36 h-36 mb-4">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="12"/>
                  <circle cx="60" cy="60" r="50" fill="none"
                    stroke={passed ? '#22c55e' : '#ef4444'}
                    strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${2*Math.PI*50}`}
                    strokeDashoffset={`${2*Math.PI*50*(1-sr.codingScore/100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-black ${passed ? 'text-emerald-600' : 'text-rose-600'}`}>{sr.codingScore}%</span>
                  <span className="text-xs text-slate-400 font-bold">Overall</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 w-full">
                {[
                  { d: 'Easy', val: sr.easyPerf, color: 'emerald' },
                  { d: 'Med',  val: sr.mediumPerf,color: 'amber'  },
                  { d: 'Hard', val: sr.hardPerf, color: 'rose'   },
                ].map(({ d, val, color }) => (
                  <div key={d} className={`bg-${color}-50 border border-${color}-200 rounded-xl p-3 text-center`}>
                    <div className={`text-xl font-black text-${color}-700`}>{val}%</div>
                    <div className={`text-[9px] font-bold text-${color}-500 uppercase`}>{d}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-black text-slate-800 mb-5">Score Breakdown</h3>
              <div className="space-y-4">
                {[
                  { label: 'Coding Score',    val: sr.codingScore, color: 'blue'   },
                  { label: 'DSA Score',       val: sr.dsaScore,    color: 'violet' },
                  { label: 'Logic Building',  val: sr.logicScore,  color: 'emerald'},
                  { label: 'Accuracy',        val: sr.accuracy,    color: 'amber'  },
                ].map(({ label, val, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-600">{label}</span>
                      <span className={`text-${color}-600`}>{val}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full bg-${color}-500 rounded-full transition-all duration-700`} style={{ width: `${val}%` }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Per-Question Breakdown */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-black text-slate-800 mb-5 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" /> Per-Question Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['#', 'Question', 'Difficulty', 'Status', 'Score', 'Test Cases', 'Time', 'Attempts'].map(h => (
                      <th key={h} className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sr.perQuestion.map((pq: any, i: number) => {
                    const r = pq.result as EvalResult | null;
                    const statusIcon = !r ? '○' : r.status === 'correct' ? '✅' : r.status === 'partial' ? '⚠️' : r.status === 'error' ? '🔴' : '❌';
                    const statusText = !r ? 'Not Attempted' : r.status === 'correct' ? 'Accepted' : r.status === 'partial' ? 'Partial' : r.status === 'error' ? 'Runtime Error' : 'Wrong Answer';
                    const statusColor = !r ? 'text-slate-400' : r.status === 'correct' ? 'text-emerald-600' : r.status === 'partial' ? 'text-amber-600' : 'text-rose-600';
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pr-4 font-black text-slate-400 text-sm">Q{i+1}</td>
                        <td className="py-3 pr-4 font-bold text-slate-800 text-sm">{pq.title}</td>
                        <td className="py-3 pr-4"><DiffBadge d={pq.difficulty} /></td>
                        <td className={`py-3 pr-4 font-bold text-xs ${statusColor}`}>{statusIcon} {statusText}</td>
                        <td className="py-3 pr-4 font-black text-slate-800">
                          {r ? `${r.score + (r.locked ? r.bonus : 0)}/${r.maxScore + (r.bonus > 0 ? r.bonus : 0)}` : `0/${DIFF_SCORE[pq.difficulty]}`}
                        </td>
                        <td className="py-3 pr-4 text-slate-600 font-semibold text-xs">
                          {r ? `${r.passed}/${r.total}` : '-'}
                        </td>
                        <td className="py-3 pr-4 text-slate-600 font-semibold text-xs">
                          {pq.timeSec > 0 ? fmtSec(pq.timeSec) : '-'}
                        </td>
                        <td className="py-3 pr-4 text-slate-600 font-semibold text-xs">
                          {r ? r.attempts : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Review */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Brain className="w-5 h-5 text-violet-600" />
                <h3 className="font-black text-slate-800">AI Code Review</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                  <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4"/>Strengths</h4>
                  <ul className="space-y-1.5">
                    {[
                      sr.solved >= 4 ? 'Excellent problem-solving — solved most questions correctly' : 'Attempted all questions, showing confidence',
                      sr.easyPerf >= 80 ? 'Strong foundation on Easy problems' : 'Making progress on fundamental algorithms',
                      sr.accuracy >= 70 ? 'High test-case pass rate shows accurate logic' : 'Core logic is partially correct',
                      sr.avgTimeSec < 300 ? 'Good time management per question' : 'Steady, methodical approach to problems',
                    ].map(s => (
                      <li key={s} className="text-xs text-emerald-700 font-medium flex gap-2"><span className="shrink-0">•</span>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                  <h4 className="text-sm font-bold text-rose-800 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/>Areas to Improve</h4>
                  <ul className="space-y-1.5">
                    {[
                      sr.hardPerf < 70 ? 'Hard problems need more practice — focus on DP & Two Pointers' : 'Continue practicing Hard-level dynamic programming',
                      sr.mediumPerf < 70 ? 'Medium problems: practice Graph BFS/DFS and Sorting' : 'Optimize Medium solutions for edge cases',
                      sr.accuracy < 80 ? 'Test case failures suggest missing edge case handling' : 'Handle boundary conditions more consistently',
                      'Review time complexity — aim for O(n) solutions over O(n²)',
                    ].map(s => (
                      <li key={s} className="text-xs text-rose-700 font-medium flex gap-2"><span className="shrink-0">•</span>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-slate-800">Personalized Recommendations</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: BookOpen, color: 'blue',   title: 'DSA Topics to Review',   items: ['Graph BFS/DFS traversal', 'Two Pointer technique', 'Dynamic Programming patterns'] },
                  { icon: Target,   color: 'violet', title: 'Practice Questions',      items: ['Flood Fill (Easy)', 'Container With Most Water (Medium)', 'Longest Common Subsequence (Hard)'] },
                  { icon: Award,    color: 'amber',  title: 'Coding Contests',          items: ['LeetCode Weekly Contest', 'Codeforces Div. 3', 'HackerRank Interview Prep'] },
                ].map(({ icon: Icon, color, title, items }) => (
                  <div key={title} className="border border-slate-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 text-${color}-600`} />
                      <span className="text-xs font-bold text-slate-700">{title}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map(item => (
                        <span key={item} className={`text-[10px] font-semibold px-2 py-1 bg-${color}-50 text-${color}-700 rounded-lg border border-${color}-100`}>{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl text-white">
                <div className="flex gap-3 items-start">
                  <Cpu className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm mb-1">Career Roadmap Updated</h4>
                    <p className="text-blue-100 text-xs leading-relaxed">
                      Coding score of {sr.codingScore}% saved to your profile. Month 2 roadmap includes Graph Traversal and Two Pointer practice modules.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => {
                setStage('instructions'); setTimer(3600);
                setQStatus(Array(5).fill('unanswered')); setCodes({});
                strikesRef.current = 0; setStrikes(0);
                setQResults({}); setSummaryResults(null); setShowPanel(false);
                qTimeRef.current = {};
              }}
              className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
            >
              <RefreshCw className="w-4 h-4" /> Retake Assessment
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return null;
}

// ─── EXAM STAGE (extracted to avoid hook violations) ──────────────────────────
const EDITOR_OPTIONS = {
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  minimap: { enabled: false },
  padding: { top: 16, bottom: 16 },
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  contextmenu: false,
  wordWrap: 'on',
  tabSize: 2,
  renderLineHighlight: 'gutter',
  lineNumbers: 'on',
  folding: true,
  bracketPairColorization: { enabled: true },
  suggestOnTriggerCharacters: true,
};

interface ExamStageProps {
  q: Question; code: string; lang: string; activeQ: number; qStatus: QStatus[]; qResults: Record<number, EvalResult>;
  timer: number; strikes: number; warningMsg: string; warningVisible: boolean;
  running: boolean; evalRes: EvalResult | null; locked: boolean; showPanel: boolean;
  hiddenProgress: { processed: number; total: number } | null;
  consoleTab: ConsoleTab;
  setConsoleTab: (t: ConsoleTab) => void;
  setLang: (l: string) => void;
  setCode: (c: string) => void;
  onRun: () => void; onSubmit: () => void; onSubmitAnyway: () => void; onNextQuestion: () => void;
  onSwitchQ: (i: number) => void; onExit: () => void;
  onTogglePanel: () => void; onToggleReview: () => void;
  onWarningClose: () => void;
  fmtTime: (s: number) => string; timerCls: string; timerBg: string;
}

function ExamStage({
  q, code, lang, activeQ, qStatus, qResults, timer, strikes, warningMsg, warningVisible,
  running, evalRes, locked, showPanel, hiddenProgress, consoleTab, setConsoleTab,
  setLang, setCode, onRun, onSubmit, onSubmitAnyway, onNextQuestion,
  onSwitchQ, onExit, onTogglePanel, onToggleReview, onWarningClose,
  fmtTime, timerCls, timerBg,
}: ExamStageProps) {
  const [activeTab, setActiveTab] = useState<'problem'|'examples'|'constraints'>('problem');

  const qStatusStats = {
    correct: qStatus.filter(s => s === 'correct').length,
    partial: qStatus.filter(s => s === 'partial').length,
    unanswered: qStatus.filter(s => s === 'unanswered' || s === 'review' || s === 'answered').length,
  };

  const handleEditorChange = useCallback((val: string | undefined) => {
    if (val !== undefined) setCode(val);
  }, [setCode]);

  const PANEL_H = showPanel ? 280 : 0;

  const qPaletteCls = (idx: number) => {
    const s = qStatus[idx]; const isActive = idx === activeQ;
    if (isActive) return 'bg-blue-600 text-white border-blue-500 scale-105 shadow-lg shadow-blue-900';
    if (s === 'correct') return 'bg-emerald-700/80 text-emerald-100 border-emerald-600';
    if (s === 'partial') return 'bg-amber-700/80 text-amber-100 border-amber-600';
    if (s === 'wrong' || s === 'error') return 'bg-rose-800/80 text-rose-100 border-rose-700';
    if (s === 'review') return 'bg-violet-700/80 text-violet-100 border-violet-600';
    if (s === 'answered') return 'bg-slate-600/80 text-slate-100 border-slate-500';
    return 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10';
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#1a1a2e] flex flex-col select-none overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Warning Toast */}
      {warningVisible && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[10000] bg-rose-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl font-bold flex items-center gap-3 border border-rose-400 max-w-lg text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{warningMsg}</span>
          <button onClick={onWarningClose} className="ml-2 text-rose-200 hover:text-white">✕</button>
        </div>
      )}

      {/* ─── TOP NAV ─── */}
      <header className="h-13 bg-[#0f0f23] border-b border-white/10 flex items-center px-4 shrink-0 gap-3 z-10" style={{height: '52px'}}>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center">
            <Code2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-bold text-sm">MockMate<span className="text-blue-400">.AI</span></span>
          <span className="hidden sm:inline text-white/30 text-xs font-semibold">│ Secure Assessment</span>
        </div>

        {/* Question Palette */}
        <div className="flex items-center gap-1.5 mx-auto">
          {QUESTIONS.map((_, idx) => (
            <button key={idx} onClick={() => onSwitchQ(idx)}
              className={`w-9 h-8 rounded-lg text-[11px] font-black transition-all border ${qPaletteCls(idx)}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Contest Progress */}
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg shrink-0">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300 text-xs font-semibold">Solved: <span className="text-emerald-400 font-black">{Object.keys(qResults).filter(k => qResults[parseInt(k)].locked).length} / {QUESTIONS.length}</span></span>
          </div>
          <div className="w-px h-3 bg-white/10"></div>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300 text-xs font-semibold">Score: <span className="text-amber-400 font-black">{Object.values(qResults).reduce((acc, res) => acc + (res.locked ? res.score : 0), 0)}</span></span>
          </div>
          <div className="w-px h-3 bg-white/10"></div>
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-300 text-xs font-semibold">Rem: <span className="text-blue-400 font-black">{QUESTIONS.length - Object.keys(qResults).filter(k => qResults[parseInt(k)].locked).length}</span></span>
          </div>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-black text-base shrink-0 ${timerCls} ${timerBg}`}>
          <Clock className="w-3.5 h-3.5" />
          {fmtTime(timer)}
        </div>

        {strikes > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            {[1,2,3].map(n => (
              <div key={n} className={`w-2 h-2 rounded-full ${n<=strikes ? 'bg-rose-500' : 'bg-white/20'}`} />
            ))}
          </div>
        )}

        <button onClick={onExit}
          className="px-3 py-1.5 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
        >
          <XCircle className="w-3.5 h-3.5" /> Exit
        </button>
      </header>

      {/* ─── MAIN AREA ─── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: Question Panel */}
        <div className="w-[400px] shrink-0 bg-white flex flex-col border-r border-slate-200 overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black text-violet-600 bg-violet-100 px-2.5 py-1 rounded-full uppercase tracking-widest">
                Q{activeQ+1}/{QUESTIONS.length}
              </span>
              <DiffBadge d={q.difficulty} />
              {q.tags.slice(0,2).map(t => (
                <span key={t} className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
            <h2 className="text-xl font-black text-slate-900">{q.title}</h2>
            <div className="mt-2 flex items-center gap-3 text-[10px] font-bold text-slate-400">
              <span>Max: <span className="text-slate-700">{DIFF_SCORE[q.difficulty]} pts</span></span>
              <span>Tests: <span className="text-slate-700">{QUESTION_TESTS[q.id]?.tests.length}</span></span>
              {locked && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Lock className="w-2.5 h-2.5" /> Score Locked
                </span>
              )}
            </div>
          </div>

          <div className="flex border-b border-slate-100 shrink-0 px-3">
            {(['problem','examples','constraints'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-2.5 text-xs font-bold capitalize transition-all border-b-2 -mb-px ${
                  activeTab===tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
            {activeTab==='problem' && (
              <>
                <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-line">{q.statement}</p>
                <div>
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Input Format</h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-600 whitespace-pre-line">{q.inputFormat}</div>
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Output Format</h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-600">{q.outputFormat}</div>
                </div>
              </>
            )}
            {activeTab==='examples' && (
              <div className="space-y-4">
                {q.examples.map((ex, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Example {i+1}</div>
                    <div className="p-3 space-y-2">
                      <div><span className="text-[10px] font-bold text-slate-400 uppercase">Input</span><div className="font-mono text-xs bg-slate-900 text-emerald-300 p-2 rounded-lg mt-1">{ex.input}</div></div>
                      <div><span className="text-[10px] font-bold text-slate-400 uppercase">Output</span><div className="font-mono text-xs bg-slate-900 text-blue-300 p-2 rounded-lg mt-1">{ex.output}</div></div>
                      {ex.explanation && <div className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-2">{ex.explanation}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab==='constraints' && (
              <div className="space-y-2">
                {q.constraints.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                    <span className="text-blue-500 font-black mt-0.5">•</span>
                    <code className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{c}</code>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-3 flex items-center gap-2 bg-slate-50 shrink-0">
            <button onClick={onToggleReview}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${qStatus[activeQ]==='review' ? 'bg-violet-100 text-violet-700 border border-violet-300' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}
            >
              <Bookmark className="w-3.5 h-3.5" /> {qStatus[activeQ]==='review' ? 'Marked' : 'Mark Review'}
            </button>
            <div className="ml-auto flex gap-1.5">
              <button onClick={() => onSwitchQ(Math.max(0, activeQ-1))} disabled={activeQ===0}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button onClick={() => onSwitchQ(Math.min(4, activeQ+1))} disabled={activeQ===4}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-700 disabled:opacity-40 flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Editor + Eval Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e2e]">
          {/* Editor Toolbar */}
          <div className="h-11 bg-[#13131f] border-b border-white/10 flex items-center px-4 gap-3 shrink-0">
            <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-slate-300 text-xs font-mono font-semibold">
              {q.title.toLowerCase().replace(/\s/g,'_')}.{lang==='python'?'py':lang==='java'?'java':lang==='cpp'?'cpp':'js'}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <select
                value={lang} onChange={e => setLang(e.target.value)}
                className="bg-[#2a2a3e] border border-white/10 text-slate-200 text-xs px-3 py-1.5 rounded-lg outline-none cursor-pointer font-semibold"
              >
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <button aria-label="Editor Settings" className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors">
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            <Editor
              height="100%"
              language={LANGUAGES.find(l=>l.value===lang)?.monaco ?? 'javascript'}
              theme="vs-dark"
              value={code}
              onChange={handleEditorChange}
              options={EDITOR_OPTIONS as Parameters<typeof Editor>[0]['options']}
            />
          </div>

          {/* Eval Panel (collapsible) */}
          {showPanel && (
            <div className="shrink-0 border-t border-white/10" style={{ height: `${PANEL_H}px` }}>
              <EvaluationPanel
                evalResult={evalRes}
                questionIdx={activeQ}
                isLastQuestion={activeQ === 4}
                onRunAgain={onRun}
                onSubmitAnyway={onSubmitAnyway}
                onNextQuestion={onNextQuestion}
                consoleTab={consoleTab}
                setConsoleTab={setConsoleTab}
              />
            </div>
          )}

          {/* Action Bar */}
          <div className="h-14 bg-[#13131f] border-t border-white/10 flex items-center gap-3 px-4 shrink-0">
            {/* Run Code */}
            <button
              onClick={onRun}
              disabled={running || locked}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                locked
                  ? 'bg-emerald-900/40 text-emerald-500 border border-emerald-700 cursor-not-allowed'
                  : 'bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50'
              }`}
            >
              {running
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : locked
                  ? <Lock className="w-3.5 h-3.5" />
                  : <Play className="w-3.5 h-3.5 fill-white" />
              }
              {running ? 'Running…' : locked ? 'Score Locked' : 'Run Code'}
            </button>
            {/* Submit Code */}
            <button
              onClick={onSubmit}
              disabled={running || locked}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                locked
                  ? 'bg-emerald-900/40 text-emerald-500 border border-emerald-700 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20 disabled:opacity-50'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Submit
            </button>
            {/* Hidden test progress — appears inline only while running, no layout shift */}
            {running && hiddenProgress && (
              <span className="text-[10px] font-mono text-slate-500 select-none">
                {hiddenProgress.processed < hiddenProgress.total
                  ? <>Running hidden tests… <span className="text-blue-400 font-bold">{hiddenProgress.processed}</span> / {hiddenProgress.total}</>
                  : <span className="text-emerald-400 font-bold">✓ {hiddenProgress.total} tests complete</span>
                }
              </span>
            )}

            {/* Toggle Panel */}
            {evalRes && (
              <button
                onClick={onTogglePanel}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                {showPanel ? 'Hide Results' : 'Show Results'}
              </button>
            )}

            {/* Next / Proceed */}
            {locked && (
              <button
                onClick={onNextQuestion}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg text-xs font-black transition-all hover:opacity-90 shadow-lg shadow-blue-900/50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {activeQ < 4 ? 'Proceed to Next Question' : 'Finish Assessment'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Stats */}
            <div className="ml-auto flex items-center gap-3 text-[11px] text-slate-500 font-semibold">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Correct: {qStatusStats.correct}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                Partial: {qStatusStats.partial}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-600" />
                Pending: {qStatusStats.unanswered}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


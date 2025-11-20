export const MOCK_PROBLEMS = [
  {
    title: 'A + B',
    description: 'Write a program that takes two integers as input and prints their sum.',
    initialCode: 'a, b = input().split()\nprint(a + b)',
    inputFormat: 'A single line containing two space-separated integers, A and B.',
    outputFormat: 'A single integer, the sum of A and B.',
    constraints: [
      '0 <= A <= 1,000,000',
      '0 <= B <= 1,000,000',
    ],
    hint: "Remember to read the two numbers from the input. You might need to split the input string by spaces.",
    solution: "a, b = map(int, input().split())\nprint(a + b)",
    showSampleCases: true,
    visibleTestCases: [
      { id: 1, input: '2 3', expected: '5' },
      { id: 2, input: '100 200', expected: '300' },
    ],
    hiddenTestCases: [
      { id: 3, input: '0 0', expected: '0' },
      { id: 4, input: '999999 1', expected: '1000000' },
      { id: 5, input: '12345 67890', expected: '80235' },
    ],
  },
    {
    title: 'Reverse a String',
    description: 'Write a program that takes a string as input and prints the string in reverse order.',
    initialCode: 's = input\nprint(s[::1])',
    inputFormat: 'A single line containing a string S.',
    outputFormat: 'A single line containing the reversed string.',
    constraints: [
      '1 <= length of S <= 1000',
      'S contains only alphanumeric characters and spaces.',
    ],
    hint: "In Python, you can reverse a string `s` easily using slicing: `s[::-1]`.",
    solution: "s = input()\nprint(s[::-1])",
    showSampleCases: true,
    visibleTestCases: [
      { id: 1, input: 'hello world', expected: 'dlrow olleh' },
      { id: 2, input: 'Python', expected: 'nohtyP' },
    ],
    hiddenTestCases: [
      { id: 3, input: 'a', expected: 'a' },
      { id: 4, input: 'racecar', expected: 'racecar' },
      { id: 5, input: '123 456', expected: '654 321' },
    ],
  }
];

export const MOCK_COMPETITION_STATE = {
    isActive: true,
    timer: 60, // 60 minutes
    allowHints: true,
    useAntiCheat: true,
    autoDisqualifyOnTabSwitch: true,
    tabSwitchViolationLimit: 1,
    violationLimit: 3,
    isPaused: false,
    announcement: {
        message: '',
        timestamp: 0,
    }
};
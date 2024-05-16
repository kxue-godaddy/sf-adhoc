import { awscdk, Task } from 'projen';
import {
  ArrowParens,
  TrailingComma,
  NodePackageManager,
  Transform,
} from 'projen/lib/javascript';
const project = new awscdk.AwsCdkTypeScriptApp({
  name: 'sf-adhoc',
  repository: 'https://github.com/kxue-godaddy/sf-adhoc',
  defaultReleaseBranch: 'main',
  projenrcTs: true,

  cdkVersion: '2.105.0',
  constructsVersion: '10.3.0',
  deps: ['@aws-cdk/assert', 'yaml@^2.3.4'],

  packageManager: NodePackageManager.NPM,

  docgen: false,
  autoMerge: false,
  clobber: false,
  github: false,
  licensed: false,
  prettier: true,
  prettierOptions: {
    settings: {
      semi: true,
      printWidth: 140,
      tabWidth: 2,
      singleQuote: true,
      bracketSpacing: true,
      useTabs: false,
      arrowParens: ArrowParens.AVOID,
      jsxSingleQuote: true,
      trailingComma: TrailingComma.ALL,
    },
    ignoreFile: true,
  },

  tsconfig: {
    compilerOptions: {
      lib: ['es2022'],
      rootDir: '.',
    },
    include: ['test/**/*.ts'],
    exclude: ['node_modules'],
  },
  tsconfigDev: {
    compilerOptions: {
      lib: ['es2022'],
      rootDir: '.',
    },
  },

  release: false,
  jestOptions: {
    jestConfig: {
      transform: {
        '^.+\\.[tj]sx?$': new Transform('ts-jest', {
          tsconfig: 'tsconfig.dev.json',
        }),
      },
      testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)@(spec|test).ts?(x)'],
    },
  },
});
const packageJson = project.tryFindObjectFile('package.json');
packageJson?.addDeletionOverride('jest.globals');
packageJson?.addDeletionOverride('jest.preset');
project.prettier?.ignoreFile?.addPatterns(
  '**/node_modules',
  '**/dist',
  '**/cdk.out',
  '**/package.json',
  '**/package-lock.json',
  '**/tsconfig.json',
  '**/.github',
  '**/README.md',
  '**/.git',
  '**/build',
);

project.gitignore.addPatterns('.idea/');
project.gitignore.addPatterns('/.vscode');
// Github runners default CICD role do not have permissions required to synth app
project.tasks
  .tryFind('synth:silent')
  ?.reset('if [ -z ${SYNTH_SKIP+x} ]; then cdk synth -q; fi');
// Allow passing arguments to cdk diff
project.tasks.tryFind('diff')?.reset('cdk diff', { receiveArgs: true });
// Clean dist folder before build
project.tasks.tryFind('pre-compile')?.prependSpawn(
  project.tasks.addTask('clean', {
    exec: 'rm -rf dist && rm -rf lib',
  }),
);
const testTask = project.tasks.tryFind('test');
testTask?.reset('jest --silent --verbose', { receiveArgs: true });
testTask?.spawn(new Task('eslint'));
project.synth();

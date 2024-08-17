export type FilesServiceRepository = {
  getRepoContents: (repoUrl: string, path: string) => Promise<any[]>;
  getFileContent: (repoUrl: string, path: string) => Promise<string>;
  getIgnoredFiles: (repoUrl: string) => Promise<any>;
};

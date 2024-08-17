import type { GithubService } from "../GithubService";

export class FilesService {
  constructor(private githubService: GithubService) {}

  async generateFileListing(repoUrl: string) {
    const ignorer = await this.githubService.getIgnoredFiles(repoUrl);
    const result: string[] = [];

    const processDirectory = async (path: string = "") => {
      const contents = await this.githubService.getRepoContents(repoUrl, path);
      for (const item of contents) {
        if (item.type === "file" && !ignorer.ignores(item.path)) {
          const content = await this.githubService.getFileContent(
            repoUrl,
            item.path,
          );
          result.push(
            `File path: ${item.path}\nFile content:\n${content}\n---------\n`,
          );
        } else if (item.type === "dir") {
          await processDirectory(item.path);
        }
      }
    };

    await processDirectory();
    return result;
  }
}

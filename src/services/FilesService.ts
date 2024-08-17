import type { GithubService } from "./GithubService";

export class FilesService {
  constructor(private githubService: GithubService) {}

  async generateFileListing(repoUrl: string) {
    const result: string[] = [];

    const processDirectory = async (path: string = "") => {
      const contents = await this.githubService.getFilteredRepoContents(
        repoUrl,
        path,
      );
      for (const item of contents) {
        if (item.type === "file") {
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

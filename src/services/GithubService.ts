import { Octokit } from "@octokit/rest";
import ignore from "ignore";
import path from "path";
import { excludedExtensions } from "../const/excludedExtensions";
import { excludedFiles } from "../const/excludedFiles";
import { env } from "../env";

export class GithubService {
  private octokit = new Octokit({
    auth: env.GITHUB_TOKEN,
  });

  async getRepoContents(repoUrl: string, filePath: string = "") {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
    });
    return Array.isArray(data) ? data : [data];
  }

  async getIgnoredFiles(repoUrl: string) {
    try {
      const gitignoreContent = await this.getFileContent(repoUrl, ".gitignore");
      return ignore().add(gitignoreContent);
    } catch (error) {
      console.warn(".gitignore not found");
      return ignore();
    }
  }

  async getFileContent(repoUrl: string, filePath: string) {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
    });
    if ("content" in data) {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return "";
  }

  private parseGitHubUrl(url: string): { owner: string; repo: string } {
    const parts = url.split("/");
    const owner = parts[parts.length - 2];
    const repo = parts[parts.length - 1];
    return { owner, repo };
  }

  async getFilteredRepoContents(repoUrl: string, filePath: string = "") {
    const contents = await this.getRepoContents(repoUrl, filePath);
    const ignoredFiles = await this.getIgnoredFiles(repoUrl);

    return contents.filter((item) => {
      if (item.type === "dir") return true;

      const fileName = item.name;
      const fileExtension = path.extname(fileName).toLowerCase();

      return !(
        excludedFiles.includes(fileName) ||
        excludedExtensions.includes(fileExtension) ||
        ignoredFiles.ignores(fileName)
      );
    });
  }
}

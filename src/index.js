import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Octokit } from "@octokit/rest";
import { z } from "zod";

// Create GitHub client using free Personal Access Token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const server = new McpServer({
  name: "github-mcp-server",
  version: "1.0.0",
  description: "Free GitHub MCP Server — search repos, manage issues, PRs, and more",
});

// ─── Tool 1: Search Repositories ────────────────────────────────────────────
server.tool(
  "search_repositories",
  "Search for GitHub repositories by keyword",
  {
    query: z.string().describe("Search query (e.g., 'machine learning python')"),
    per_page: z.number().optional().default(5).describe("Number of results (max 30)"),
  },
  async ({ query, per_page }) => {
    const result = await octokit.search.repos({
      q: query,
      per_page: Math.min(per_page, 30),
      sort: "stars",
      order: "desc",
    });

    const repos = result.data.items.map((repo) => ({
      name: repo.full_name,
      description: repo.description,
      stars: repo.stargazers_count,
      language: repo.language,
      url: repo.html_url,
      updated: repo.updated_at,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(repos, null, 2) }],
    };
  }
);

// ─── Tool 2: Get Repository Info ────────────────────────────────────────────
server.tool(
  "get_repository",
  "Get detailed information about a specific GitHub repository",
  {
    owner: z.string().describe("Repository owner (e.g., 'facebook')"),
    repo: z.string().describe("Repository name (e.g., 'react')"),
  },
  async ({ owner, repo }) => {
    const { data } = await octokit.repos.get({ owner, repo });

    const info = {
      full_name: data.full_name,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      open_issues: data.open_issues_count,
      language: data.language,
      license: data.license?.name,
      created: data.created_at,
      updated: data.updated_at,
      url: data.html_url,
      default_branch: data.default_branch,
      topics: data.topics,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
    };
  }
);

// ─── Tool 3: List Issues ────────────────────────────────────────────────────
server.tool(
  "list_issues",
  "List issues for a GitHub repository",
  {
    owner: z.string().describe("Repository owner"),
    repo: z.string().describe("Repository name"),
    state: z.enum(["open", "closed", "all"]).optional().default("open").describe("Issue state"),
    per_page: z.number().optional().default(10).describe("Number of issues to return"),
  },
  async ({ owner, repo, state, per_page }) => {
    const { data } = await octokit.issues.listForRepo({
      owner,
      repo,
      state,
      per_page: Math.min(per_page, 30),
    });

    const issues = data
      .filter((issue) => !issue.pull_request) // Exclude PRs
      .map((issue) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        author: issue.user?.login,
        labels: issue.labels.map((l) => (typeof l === "string" ? l : l.name)),
        created: issue.created_at,
        url: issue.html_url,
      }));

    return {
      content: [{ type: "text", text: JSON.stringify(issues, null, 2) }],
    };
  }
);

// ─── Tool 4: Create Issue ───────────────────────────────────────────────────
server.tool(
  "create_issue",
  "Create a new issue in a GitHub repository",
  {
    owner: z.string().describe("Repository owner"),
    repo: z.string().describe("Repository name"),
    title: z.string().describe("Issue title"),
    body: z.string().optional().describe("Issue body/description"),
    labels: z.array(z.string()).optional().describe("Labels to apply"),
  },
  async ({ owner, repo, title, body, labels }) => {
    const { data } = await octokit.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    });

    return {
      content: [
        {
          type: "text",
          text: `Issue #${data.number} created successfully!\nURL: ${data.html_url}`,
        },
      ],
    };
  }
);

// ─── Tool 5: List Pull Requests ─────────────────────────────────────────────
server.tool(
  "list_pull_requests",
  "List pull requests for a GitHub repository",
  {
    owner: z.string().describe("Repository owner"),
    repo: z.string().describe("Repository name"),
    state: z.enum(["open", "closed", "all"]).optional().default("open").describe("PR state"),
    per_page: z.number().optional().default(10).describe("Number of PRs to return"),
  },
  async ({ owner, repo, state, per_page }) => {
    const { data } = await octokit.pulls.list({
      owner,
      repo,
      state,
      per_page: Math.min(per_page, 30),
    });

    const prs = data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      author: pr.user?.login,
      branch: pr.head.ref,
      created: pr.created_at,
      url: pr.html_url,
      draft: pr.draft,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(prs, null, 2) }],
    };
  }
);

// ─── Tool 6: Get File Contents ──────────────────────────────────────────────
server.tool(
  "get_file_contents",
  "Get the contents of a file from a GitHub repository",
  {
    owner: z.string().describe("Repository owner"),
    repo: z.string().describe("Repository name"),
    path: z.string().describe("File path in the repository"),
    ref: z.string().optional().describe("Branch or commit SHA (defaults to main branch)"),
  },
  async ({ owner, repo, path, ref }) => {
    const params = { owner, repo, path };
    if (ref) params.ref = ref;

    const { data } = await octokit.repos.getContent(params);

    if (Array.isArray(data)) {
      // It's a directory
      const files = data.map((f) => ({
        name: f.name,
        type: f.type,
        path: f.path,
        size: f.size,
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(files, null, 2) }],
      };
    }

    if (data.type === "file" && data.content) {
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      return {
        content: [{ type: "text", text: content }],
      };
    }

    return {
      content: [{ type: "text", text: `Unsupported content type: ${data.type}` }],
    };
  }
);

// ─── Tool 7: List Commits ───────────────────────────────────────────────────
server.tool(
  "list_commits",
  "List recent commits for a repository",
  {
    owner: z.string().describe("Repository owner"),
    repo: z.string().describe("Repository name"),
    per_page: z.number().optional().default(10).describe("Number of commits to return"),
    sha: z.string().optional().describe("Branch name or commit SHA to start from"),
  },
  async ({ owner, repo, per_page, sha }) => {
    const params = { owner, repo, per_page: Math.min(per_page, 30) };
    if (sha) params.sha = sha;

    const { data } = await octokit.repos.listCommits(params);

    const commits = data.map((c) => ({
      sha: c.sha.substring(0, 7),
      message: c.commit.message.split("\n")[0],
      author: c.commit.author?.name,
      date: c.commit.author?.date,
      url: c.html_url,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(commits, null, 2) }],
    };
  }
);

// ─── Tool 8: Get User Profile ───────────────────────────────────────────────
server.tool(
  "get_user_profile",
  "Get a GitHub user's profile information",
  {
    username: z.string().describe("GitHub username"),
  },
  async ({ username }) => {
    const { data } = await octokit.users.getByUsername({ username });

    const profile = {
      login: data.login,
      name: data.name,
      bio: data.bio,
      company: data.company,
      location: data.location,
      public_repos: data.public_repos,
      followers: data.followers,
      following: data.following,
      created: data.created_at,
      url: data.html_url,
      avatar: data.avatar_url,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(profile, null, 2) }],
    };
  }
);

// ─── Tool 9: List User Repos ────────────────────────────────────────────────
server.tool(
  "list_user_repos",
  "List repositories for a GitHub user",
  {
    username: z.string().describe("GitHub username"),
    sort: z.enum(["created", "updated", "pushed", "full_name"]).optional().default("updated"),
    per_page: z.number().optional().default(10).describe("Number of repos to return"),
  },
  async ({ username, sort, per_page }) => {
    const { data } = await octokit.repos.listForUser({
      username,
      sort,
      per_page: Math.min(per_page, 30),
    });

    const repos = data.map((repo) => ({
      name: repo.full_name,
      description: repo.description,
      stars: repo.stargazers_count,
      language: repo.language,
      url: repo.html_url,
      private: repo.private,
      fork: repo.fork,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(repos, null, 2) }],
    };
  }
);

// ─── Tool 10: Search Code ───────────────────────────────────────────────────
server.tool(
  "search_code",
  "Search for code across GitHub repositories",
  {
    query: z.string().describe("Search query (e.g., 'useState repo:facebook/react')"),
    per_page: z.number().optional().default(5).describe("Number of results"),
  },
  async ({ query, per_page }) => {
    const result = await octokit.search.code({
      q: query,
      per_page: Math.min(per_page, 30),
    });

    const matches = result.data.items.map((item) => ({
      file: item.name,
      path: item.path,
      repository: item.repository.full_name,
      url: item.html_url,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(matches, null, 2) }],
    };
  }
);

// ─── Tool 11: Create or Update File (Push Changes) ─────────────────────────
server.tool(
  "create_or_update_file",
  "Create or update a file in a GitHub repository (this pushes a commit)",
  {
    owner: z.string().describe("Repository owner"),
    repo: z.string().describe("Repository name"),
    path: z.string().describe("File path in the repository (e.g., 'src/app.js')"),
    content: z.string().describe("The file content to write"),
    message: z.string().describe("Commit message"),
    branch: z.string().optional().describe("Branch name (defaults to repo's default branch)"),
    sha: z
      .string()
      .optional()
      .describe("SHA of the file being replaced (required for updates, omit for new files)"),
  },
  async ({ owner, repo, path, content, message, branch, sha }) => {
    const params = {
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString("base64"),
    };
    if (branch) params.branch = branch;
    if (sha) params.sha = sha;

    const { data } = await octokit.repos.createOrUpdateFileContents(params);

    return {
      content: [
        {
          type: "text",
          text: `✅ File "${path}" ${sha ? "updated" : "created"} successfully!\nCommit: ${data.commit.sha.substring(0, 7)} — ${data.commit.message}\nURL: ${data.content?.html_url}`,
        },
      ],
    };
  }
);

// ─── Tool 12: Delete File ───────────────────────────────────────────────────
server.tool(
  "delete_file",
  "Delete a file from a GitHub repository (pushes a commit)",
  {
    owner: z.string().describe("Repository owner"),
    repo: z.string().describe("Repository name"),
    path: z.string().describe("File path to delete"),
    message: z.string().describe("Commit message"),
    sha: z.string().describe("SHA of the file to delete (get this from get_file_contents)"),
    branch: z.string().optional().describe("Branch name"),
  },
  async ({ owner, repo, path, message, sha, branch }) => {
    const params = { owner, repo, path, message, sha };
    if (branch) params.branch = branch;

    await octokit.repos.deleteFile(params);

    return {
      content: [{ type: "text", text: `✅ File "${path}" deleted successfully.` }],
    };
  }
);

// ─── Tool 13: Create Branch ─────────────────────────────────────────────────
server.tool(
  "create_branch",
  "Create a new branch in a GitHub repository",
  {
    owner: z.string().describe("Repository owner"),
    repo: z.string().describe("Repository name"),
    branch: z.string().describe("New branch name"),
    from_branch: z
      .string()
      .optional()
      .describe("Source branch to branch from (defaults to repo's default branch)"),
  },
  async ({ owner, repo, branch, from_branch }) => {
    // Get the SHA of the source branch
    const sourceRef = from_branch || (await octokit.repos.get({ owner, repo })).data.default_branch;
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${sourceRef}`,
    });

    // Create the new branch
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: refData.object.sha,
    });

    return {
      content: [
        {
          type: "text",
          text: `✅ Branch "${branch}" created from "${sourceRef}" (${refData.object.sha.substring(0, 7)})`,
        },
      ],
    };
  }
);

// ─── Tool 14: Create Pull Request ───────────────────────────────────────────
server.tool(
  "create_pull_request",
  "Create a pull request in a GitHub repository",
  {
    owner: z.string().describe("Repository owner"),
    repo: z.string().describe("Repository name"),
    title: z.string().describe("PR title"),
    head: z.string().describe("Branch with changes (source branch)"),
    base: z.string().describe("Branch to merge into (target branch, e.g., 'main')"),
    body: z.string().optional().describe("PR description"),
    draft: z.boolean().optional().default(false).describe("Create as draft PR"),
  },
  async ({ owner, repo, title, head, base, body, draft }) => {
    const { data } = await octokit.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body,
      draft,
    });

    return {
      content: [
        {
          type: "text",
          text: `✅ Pull Request #${data.number} created!\nTitle: ${data.title}\nURL: ${data.html_url}`,
        },
      ],
    };
  }
);

// ─── Tool 15: Fork Repository ───────────────────────────────────────────────
server.tool(
  "fork_repository",
  "Fork a GitHub repository to your account",
  {
    owner: z.string().describe("Repository owner to fork from"),
    repo: z.string().describe("Repository name to fork"),
  },
  async ({ owner, repo }) => {
    const { data } = await octokit.repos.createFork({ owner, repo });

    return {
      content: [
        {
          type: "text",
          text: `✅ Forked "${owner}/${repo}" → "${data.full_name}"\nURL: ${data.html_url}`,
        },
      ],
    };
  }
);

// ─── Tool 16: Merge Pull Request ────────────────────────────────────────────
server.tool(
  "merge_pull_request",
  "Merge a pull request",
  {
    owner: z.string().describe("Repository owner"),
    repo: z.string().describe("Repository name"),
    pull_number: z.number().describe("Pull request number"),
    merge_method: z
      .enum(["merge", "squash", "rebase"])
      .optional()
      .default("merge")
      .describe("Merge method"),
    commit_message: z.string().optional().describe("Custom merge commit message"),
  },
  async ({ owner, repo, pull_number, merge_method, commit_message }) => {
    const params = { owner, repo, pull_number, merge_method };
    if (commit_message) params.commit_message = commit_message;

    const { data } = await octokit.pulls.merge(params);

    return {
      content: [
        {
          type: "text",
          text: `✅ PR #${pull_number} merged successfully!\nSHA: ${data.sha.substring(0, 7)}\nMessage: ${data.message}`,
        },
      ],
    };
  }
);

// ─── Tool 17: Push Multiple Files (Tree + Commit) ───────────────────────────
server.tool(
  "push_files",
  "Push multiple files in a single commit to a GitHub repository",
  {
    owner: z.string().describe("Repository owner"),
    repo: z.string().describe("Repository name"),
    branch: z.string().describe("Branch to push to"),
    message: z.string().describe("Commit message"),
    files: z
      .array(
        z.object({
          path: z.string().describe("File path in the repo"),
          content: z.string().describe("File content"),
        })
      )
      .describe("Array of files to push"),
  },
  async ({ owner, repo, branch, message, files }) => {
    // 1. Get the current commit SHA for the branch
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const latestCommitSha = refData.object.sha;

    // 2. Get the tree SHA of the current commit
    const { data: commitData } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSha,
    });
    const baseTreeSha = commitData.tree.sha;

    // 3. Create blobs for each file
    const tree = await Promise.all(
      files.map(async (file) => {
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content).toString("base64"),
          encoding: "base64",
        });
        return {
          path: file.path,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        };
      })
    );

    // 4. Create a new tree
    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree,
    });

    // 5. Create a new commit
    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message,
      tree: newTree.sha,
      parents: [latestCommitSha],
    });

    // 6. Update the branch reference
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
    });

    return {
      content: [
        {
          type: "text",
          text: `✅ Pushed ${files.length} file(s) to "${branch}" in a single commit!\nCommit: ${newCommit.sha.substring(0, 7)} — ${message}\nFiles: ${files.map((f) => f.path).join(", ")}`,
        },
      ],
    };
  }
);

// ─── Start the server ───────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 GitHub MCP Server running (free, using your PAT)");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

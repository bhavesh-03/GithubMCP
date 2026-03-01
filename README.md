# 🐙 GithubMCP

A **free, open-source** Model Context Protocol (MCP) server that connects GitHub to VS Code Copilot Chat. Search repos, manage issues, push code, create PRs — all from your editor, at **zero cost**.

[![npm version](https://img.shields.io/npm/v/@bhavesh2003/githubmcp?color=blue&logo=npm)](https://www.npmjs.com/package/@bhavesh2003/githubmcp)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green?logo=node.js)
![License](https://img.shields.io/badge/License-MIT-blue)
![MCP](https://img.shields.io/badge/MCP-Compatible-purple)

---

## ✨ Features

### 📖 Read Tools (10)
| Tool | Description |
|------|-------------|
| `search_repositories` | Search GitHub repos by keyword, sorted by stars |
| `get_repository` | Get detailed repo info (stars, forks, topics, license) |
| `list_issues` | List issues for any repository |
| `list_pull_requests` | List pull requests for any repository |
| `get_file_contents` | Read files or list directories from any repo |
| `list_commits` | View recent commits for a repo/branch |
| `get_user_profile` | Get a GitHub user's profile info |
| `list_user_repos` | List all repositories for a user |
| `search_code` | Search for code across GitHub |

### ✏️ Write Tools (7)
| Tool | Description |
|------|-------------|
| `create_issue` | Create a new issue in a repository |
| `create_or_update_file` | Create or update a single file (pushes a commit) |
| `delete_file` | Delete a file from a repository |
| `push_files` | Push multiple files in a single commit |
| `create_branch` | Create a new branch from any existing branch |
| `create_pull_request` | Open a pull request |
| `merge_pull_request` | Merge a PR (merge, squash, or rebase) |
| `fork_repository` | Fork any repository to your account |

---

## 🔑 Prerequisites (All Free)

1. **Node.js** v18 or later — [Download](https://nodejs.org)
2. **VS Code** with GitHub Copilot
3. **GitHub Personal Access Token** (free) — [Generate here](https://github.com/settings/tokens)

### Generate Your Free GitHub Token

1. Go to → [**github.com/settings/tokens**](https://github.com/settings/tokens)
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Set a name (e.g., `mcp-server`) and choose an expiration
4. Select these scopes:
   - ✅ **`repo`** — Read & write access to repositories
   - ✅ **`read:user`** — Read user profile info
5. Click **"Generate token"** and **copy it immediately** (starts with `ghp_...`)

> ⚠️ GitHub only shows the token once! Save it somewhere safe.

---

## 🚀 Installation & Setup

Choose the method that works best for you:

---

### Method 1: npm / npx (Recommended — Works in Any Project)

**No cloning needed.** Just add the config and it works everywhere.

#### For a specific project (workspace-level):

Create a `.vscode/mcp.json` in your project:

```jsonc
{
  "servers": {
    "GithubMCP": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@bhavesh2003/githubmcp"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

#### For all projects (global — one-time setup):

Add the config to your **VS Code User MCP settings**:

| OS | File Location |
|----|---------------|
| **macOS** | `~/Library/Application Support/Code/User/mcp.json` |
| **Windows** | `%APPDATA%\Code\User\mcp.json` |
| **Linux** | `~/.config/Code/User/mcp.json` |

```jsonc
{
  "servers": {
    "GithubMCP": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@bhavesh2003/githubmcp"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

Reload VS Code → Done! ✅

---

### Method 2: Clone from GitHub (For Contributors / Self-Hosting)

```bash
# 1. Clone the repo
git clone https://github.com/bhavesh-03/githubMcp.git
cd githubMcp

# 2. Install dependencies
npm install
```

#### Use in this project only (workspace-level):

Create `.vscode/mcp.json`:

```jsonc
{
  "servers": {
    "GithubMCP": {
      "type": "stdio",
      "command": "node",
      "args": ["src/index.js"],
      "cwd": "${workspaceFolder}",
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

#### Use across all projects (global):

Add to your VS Code User `mcp.json` (paths above ☝️):

```jsonc
{
  "servers": {
    "GithubMCP": {
      "type": "stdio",
      "command": "node",
      "args": ["/full/path/to/githubMcp/src/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

> 💡 Replace `/full/path/to/githubMcp` with the actual path where you cloned the repo.

---

### Method 3: Install Globally via npm

```bash
npm install -g @bhavesh2003/githubmcp
```

Then add to your VS Code `mcp.json` (workspace or global):

```jsonc
{
  "servers": {
    "GithubMCP": {
      "type": "stdio",
      "command": "GithubMCP",
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

---

## ✅ Verify It's Working

1. Reload VS Code: `Cmd+Shift+P` (macOS) / `Ctrl+Shift+P` (Windows/Linux) → **"Developer: Reload Window"**
2. Open **Copilot Chat**
3. You should see **GithubMCP** listed as an available MCP server
4. Try a prompt like: *"List all repos for bhavesh-03"*

---

## 💬 Example Prompts

Once set up, try these in Copilot Chat:

| Prompt | What it does |
|--------|-------------|
| *"Search GitHub for trending Python AI projects"* | Searches repos by keyword |
| *"Show me the latest issues on facebook/react"* | Lists open issues |
| *"List all repos for bhavesh-03"* | Lists a user's repositories |
| *"Get the profile info of torvalds"* | Shows user profile |
| *"Show me the README.md of microsoft/vscode"* | Reads a file from a repo |
| *"Create a branch called feature/login on my repo"* | Creates a new branch |
| *"Push a file hello.txt with content 'Hello World' to my repo"* | Pushes a file |
| *"Create a PR from feature/login to main"* | Opens a pull request |
| *"Merge PR #5 on my repo using squash"* | Merges a pull request |

---

## 📁 Project Structure

```
githubMcp/
├── src/
│   └── index.js          # MCP server with all 17 GitHub tools
├── .vscode/
│   └── mcp.json          # VS Code MCP configuration (workspace)
├── .gitignore            # Ignores node_modules and mcp.json (token safety)
├── package.json          # Project metadata and dependencies
└── README.md             # This file
```

---

## 🔒 Security

- Your GitHub token is stored **locally** — never uploaded anywhere
- `.gitignore` excludes `.vscode/mcp.json` so your token is **never committed**
- The token only leaves your machine to authenticate with GitHub's official API
- **Tip:** Use a token with an expiration date and minimal scopes

---

## 💰 Cost

**$0 — Completely free!**

| Component | Cost |
|-----------|------|
| GitHub Personal Access Token | Free |
| GitHub REST API (5,000 req/hr) | Free |
| npm package | Free |
| All dependencies (open source) | Free |

---

## 🛠️ Tech Stack

- [**Model Context Protocol SDK**](https://github.com/modelcontextprotocol/sdk) — MCP server framework
- [**Octokit**](https://github.com/octokit/rest.js) — Official GitHub REST API client
- [**Zod**](https://github.com/colinhacks/zod) — Schema validation for tool inputs
- **Node.js** — Runtime

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Bad credentials" error | Your token is invalid/expired. Generate a new one at [github.com/settings/tokens](https://github.com/settings/tokens) |
| MCP server not showing in Copilot | Reload VS Code (`Cmd+Shift+P` → "Developer: Reload Window") |
| `npx` command not found | Install Node.js v18+ from [nodejs.org](https://nodejs.org) |
| 403 Forbidden on push/write | Make sure your token has the `repo` scope |
| Rate limit exceeded | Authenticated requests get 5,000/hr. Wait or check your usage |

---

## 📄 License

MIT — feel free to use, modify, and share.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a PR.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/awesome`)
3. Commit your changes (`git commit -m 'Add awesome feature'`)
4. Push to the branch (`git push origin feature/awesome`)
5. Open a Pull Request

---

Made with ❤️ by [bhavesh-03](https://github.com/bhavesh-03)

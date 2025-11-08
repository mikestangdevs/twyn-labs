# Project Git Workflow Guide

This document outlines the Git workflow and best practices for our project. Following these guidelines ensures code quality, maintains a clean repository history, and allows for efficient collaboration.

## Table of Contents
- [Setting Up Your Development Environment](#setting-up-your-development-environment)
- [Git Workflow Overview](#git-workflow-overview)
- [Branching Strategy](#branching-strategy)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Review Standards](#code-review-standards)
- [Deployment Process](#deployment-process)
- [Common Git Commands Reference](#common-git-commands-reference)
- [Troubleshooting](#troubleshooting)

## Setting Up Your Development Environment

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd [repository-name]
   ```

2. **Install dependencies**
   ```bash
   # Install project dependencies (adjust command based on your project)
   npm install  # For Node.js projects
   # or
   pip install -r requirements.txt  # For Python projects
   # etc.
   ```

3. **Set up Git configuration**
   ```bash
   # Configure your identity
   git config user.name "Your Name"
   git config user.email "your.email@example.com"
   
   # Set up Git to pull with rebase by default (recommended)
   git config pull.rebase true
   ```

4. **Install recommended Git tools (optional)**
   - GitHub Desktop: For GUI-based Git operations
   - GitLens: VSCode extension for enhanced Git capabilities

## Git Workflow Overview

We follow a branch-based workflow that keeps `main` stable and deployable at all times:

1. Create a feature branch from `main`
2. Develop and test your changes locally
3. Commit your changes with clear messages
4. Push your branch to GitHub
5. Create a Pull Request (PR) for review
6. Address feedback and update your PR
7. Once approved, merge to `main`
8. Automated CI/CD deploys changes to the appropriate environment

## Branching Strategy

### Branch Types

- **`main`**: Production-ready code, always stable and deployable
- **`feature/[feature-name]`**: New features or enhancements
- **`bugfix/[bug-name]`**: Bug fixes
- **`hotfix/[hotfix-name]`**: Critical fixes for production issues
- **`refactor/[description]`**: Code refactoring without behavior changes
- **`docs/[description]`**: Documentation updates only

### Branch Naming Convention

Follow this format for branch names:
```
[type]/[short-description]
```

Examples:
- `feature/user-authentication`
- `bugfix/login-validation`
- `refactor/database-queries`
- `docs/api-documentation`

### Branch Workflow

1. **Create a new branch from `main`**
   ```bash
   git checkout main
   git pull  # Ensure main is up-to-date
   git checkout -b feature/your-feature-name
   ```

2. **Regularly update your branch with changes from `main`**
   ```bash
   git checkout feature/your-feature-name
   git fetch origin
   git rebase origin/main
   ```

3. **Push your branch to GitHub**
   ```bash
   git push -u origin feature/your-feature-name
   ```

### Working with Large Features (Sub-branching)

For large feature developments that involve multiple components or significant changes:

1. **Create a main feature branch from `main`**
   ```bash
   git checkout main
   git pull  # Ensure main is up-to-date
   git checkout -b feature/major-feature
   ```

2. **Create sub-feature branches from your main feature branch**
   ```bash
   git checkout feature/major-feature
   git checkout -b feature/major-feature-component-a
   
   # Later, when working on another component
   git checkout feature/major-feature
   git checkout -b feature/major-feature-component-b
   ```

3. **Merge completed sub-features back to your main feature branch**
   ```bash
   # After completing component A
   git checkout feature/major-feature
   git merge feature/major-feature-component-a
   ```

4. **Keep your feature branches updated with main**
   ```bash
   git checkout feature/major-feature
   git fetch origin
   git rebase origin/main
   
   # Then update sub-branches if needed
   git checkout feature/major-feature-component-b
   git rebase feature/major-feature
   ```

5. **When the entire feature is complete, create a single PR to merge to main**

This approach allows you to:
- Work on individual components in isolation
- Ensure each component is functioning before merging to the main feature
- Create a comprehensive PR for the entire feature

## Commit Guidelines

### Commit Message Format

Use the following format for commit messages:
```
[type]: [concise description]

[optional detailed description]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without behavior changes
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates, etc.

Examples:
```
feat: add user authentication functionality

Implement JWT-based authentication with login/logout endpoints
```

```
fix: resolve password reset email not sending
```

### Best Practices for Commits

1. **Make small, focused commits** that address a single concern
2. **Write descriptive commit messages** that explain what and why (not how)
3. **Commit often** to create a detailed history
4. **Squash related commits** before merging if they're part of the same logical change
5. **Never commit sensitive information** like API keys or passwords

## Pull Request Process

1. **Create a Pull Request on GitHub**
   - Provide a clear title and description
   - Reference any related issues (#123)
   - Include screenshots for UI changes (if applicable)
   - Add appropriate labels

2. **PR Template (copy this when creating a PR)**
   ```markdown
   ## Description
   [Describe what changes you've made and why]

   ## Related Issues
   [Link any related issues using #issue-number]

   ## Testing
   [Describe how you tested these changes]

   ## Screenshots (if applicable)
   [Add screenshots of UI changes]

   ## Checklist
   - [ ] Code follows project style guidelines
   - [ ] Tests have been added/updated
   - [ ] Documentation has been updated
   - [ ] Changes work across supported browsers/devices
   ```

3. **Request code review** from team members
4. **Address feedback promptly**
5. **Merge when approved**

## Code Review Standards

### For Authors

1. **Self-review** your code before requesting a review
2. **Keep PRs small** (ideally < 500 lines of code) for easier review
3. **Respond to feedback** with code changes or explanations
4. **Test your changes thoroughly** before requesting review

### For Reviewers

1. **Be respectful and constructive** in your feedback
2. **Review code not people** - focus on the code, not the author
3. **Consider both implementation and design** aspects
4. **Check for edge cases and error handling**
5. **Verify test coverage** for new functionality

## Deployment Process

Our deployment process is automated through GitHub and our hosting services:

1. **Merges to `main`** trigger automatic deployment to our staging environment
2. **After verification in staging**, a manual approval triggers production deployment
3. **Hotfixes may bypass staging** in critical situations (requires approval)

### Deployment Guidelines

1. **Don't merge on Fridays** or before holidays
2. **Always verify your changes** in staging before promoting to production
3. **Monitor deployments** for unexpected behavior
4. **Be prepared to roll back** if issues arise

## Common Git Commands Reference

### Basic Commands

```bash
# Check status of your working directory
git status

# View commit history
git log
git log --oneline --graph  # Compact graph view

# Stage files for commit
git add filename.ext       # Stage specific file
git add .                  # Stage all changes

# Commit changes
git commit -m "Your message"

# Push to remote
git push
git push -u origin branch-name  # First push of a new branch

# Pull changes
git pull

# View changes
git diff                   # Unstaged changes
git diff --staged          # Staged changes
```

### Advanced Commands

```bash
# Discard changes
git checkout -- filename.ext  # Discard changes to a file
git restore filename.ext      # Modern alternative

# Undo last commit (keeping changes)
git reset --soft HEAD~1

# Stash changes temporarily
git stash                  # Stash changes
git stash pop              # Apply and remove stashed changes
git stash list             # List stashes

# Fix last commit message
git commit --amend -m "New message"

# Rebase interactively
git rebase -i HEAD~3       # Rebase last 3 commits

# List branches
git branch                 # Local branches
git branch -r              # Remote branches
git branch -a              # All branches

# Delete branch
git branch -d branch-name  # Local branch
git push origin --delete branch-name  # Remote branch
```

## Troubleshooting

### Common Issues

1. **Merge conflicts**
   - Use VS Code's merge conflict resolver
   - Or resolve manually:
     ```bash
     # After conflict appears
     # Edit files to resolve conflicts
     git add resolved-file.ext
     git rebase --continue  # If during rebase
     # or
     git merge --continue   # If during merge
     ```

2. **Accidentally committed to wrong branch**
   ```bash
   # Create a new branch with your changes
   git branch new-branch-name
   
   # Reset current branch to original state
   git reset --hard origin/main
   
   # Switch to new branch
   git checkout new-branch-name
   ```

3. **Need to undo a pushed commit**
   ```bash
   # Revert the commit
   git revert commit-hash
   git push
   ```

4. **Accidentally pushed sensitive information**
   - Change any compromised credentials immediately
   - Contact repository admin to remove sensitive data from history

### Getting Help

- Check this README first
- Ask team members for assistance
- Consult [Git documentation](https://git-scm.com/docs)
- Use `git --help` or `git command --help` for command-specific help

---

This workflow document is subject to updates and improvements. Team members are encouraged to suggest changes by creating a PR with the `docs/` prefix.

Last Updated: May 30, 2024
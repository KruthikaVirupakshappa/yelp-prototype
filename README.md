# yelp-prototype
Prototype of Yelp with multiple functionalities and chatbot.

## Description:


### Execute backend

To run the backend application and load it in Swagger UI, follow [backend/README.md](backend/README.md).

---

## Team Git sync Workflow

**Repo**: `yelp-prototype`  

**Details**: 
- Main branch: main  
- Backend branch: `backend-kv`  
- Frontend branch: `frontend-sadaf`  

**Goal**:
- Work independently on backend and frontend.
- Keep `main` in a non-conflicting, clean state, merge to main only when it's safe to proceed.
- Merge into `main` directly (no Pull Requests).

---

### Rules We Follow

1. **Never commit directly to `main`.**
2. **Always sync your branch with `main` before starting work and before merging to `main`.**
3. **Keep changes separated by folder** to avoid conflicts:
   - Backend changes should stay under something like: `backend/` or necessary differentiator.
   - Frontend changes should stay under something like: `frontend/` or necessary differentiator.
4. **Small, frequent commits** with clear messages of the change.
5. Let's Communicate if there is any doubt or before modifying shared files like README, package.json, or environment files.

------------------------------------------------------------
### BACKEND WORKFLOW (branch: backend-kv)
------------------------------------------------------------

#### ONE TIME SETUP (first time only)

```bash
git clone https://github.com/KruthikaVirupakshappa/yelp-prototype.git   # Clone the repository
cd yelp-prototype                                                       # Enter project folder
git fetch origin                                                        # Fetch all remote branches
git checkout backend-kv                                                 # Switch to backend branch
git pull origin backend-kv                                              # Get latest backend branch updates
```


#### BEFORE STARTING ANY NEW WORK (always sync from main)

```bash
git fetch origin                        # Fetch latest changes from remote without modifying local branches
git checkout backend-kv                 # Switch to your feature branch
git rebase origin/main                  # Move backend-kv commits on top of latest remote main branch

# If there are conflicts:
#   - Fix the conflicted files manually
#   - Run: git add <resolved-files>
git rebase --continue                   # Continue the rebase after resolving conflicts

git push --force-with-lease origin backend-kv   # Safely update remote branch after rebase (required because history changed)
```

#### COMMIT AND PUSH CHANGES 

```bash
git add .                       # Stage all changes
git commit -m "backend: message"   # Commit backend changes
git push origin backend-kv      # Push backend branch to GitHub

#Optional safety step before pushing or if push fails:
git checkout main               # Go to main
git pull origin main            # Ensure main is updated
git checkout backend-kv         # Return to backend branch
git rebase main                 # Re-apply backend changes on latest main
git push --force-with-lease origin backend-kv   # Safely force push after rebase
```

#### MERGE BACKEND INTO MAIN (no PR)

We can discuss and sync before pushing your branch changes to main branch.
To simplify the workflow and avoid confusion, we can create a PR by following below workflow.

1. Go to GitHub UI after pushing your local changes by following previous steps.
2. It will usually indicate in yellow bar on top to create PR with your latest changes.
You can click it to create PR.
3. If you don't see that option, you can select your branch in dropdown and 
click contribute button to create PR.
4. Once PR is created, if there is no merge conflict, we can merge it directly
to main since we both have merge permission.

------------------------------------------------------------
## FRONTEND WORKFLOW (branch: frontend-sadaf)
------------------------------------------------------------

#### ONE TIME SETUP (first time only)

```bash
git clone https://github.com/KruthikaVirupakshappa/yelp-prototype.git   # Clone the repository
cd yelp-prototype                                                       # Enter project folder
git fetch origin                                                        # Fetch all remote branches
git checkout frontend-sadaf                                             # Switch to frontend branch
git pull origin frontend-sadaf                                          # Get latest frontend branch updates
```

#### BEFORE STARTING ANY NEW WORK (always sync from main)

```bash
git fetch origin                        # Fetch latest changes from remote without modifying local branches
git checkout frontend-sadaf                # Switch to your feature branch
git rebase origin/main                  # Move frontend-sadaf commits on top of latest remote main branch

# If there are conflicts:
#   - Fix the conflicted files manually
#   - Run: git add <resolved-files>
git rebase --continue                   # Continue the rebase after resolving conflicts

git push --force-with-lease origin frontend-sadaf   # Safely update remote branch after rebase (required because history changed)
```

#### COMMIT AND PUSH CHANGES 

```bash

git add .                       # Stage all changes
git commit -m "frontend: message"   # Commit frontend changes
git push origin frontend-sadaf      # Push frontend branch to GitHub

# Optional safety step before pushing or if push fails::
git checkout main               # Go to main
git pull origin main            # Ensure main is updated
git checkout frontend-sadaf     # Return to frontend branch
git rebase main                 # Re-apply frontend changes on latest main
git push --force-with-lease origin frontend-sadaf   # Safely force push after rebase
```


#### MERGE FRONTEND INTO MAIN - PR
We can discuss and sync before pushing your branch changes to main branch.
To simplify the workflow and avoid confusion, we can create a PR by following below workflow.

1. Go to GitHub UI after pushing your local changes by following previous steps.
2. It will usually indicate in yellow bar on top to create PR with your latest changes.
You can click it to create PR.
3. If you don't see that option, you can select your branch in dropdown and 
click contribute button to create PR.
4. Once PR is created, if there is no merge conflict, we can merge it directly
to main since we both have merge permission.


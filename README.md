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
git checkout main               # Switch to main branch
git pull origin main            # Pull latest changes from remote main
git checkout backend-kv         # IMPORTANT: Switch back to backend branch
git rebase main                 # sync both main code and branch code by moving backend branch on top of latest main
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

```bash
git checkout main               # Switch to main
git pull origin main            # Ensure main is latest
git merge --no-ff backend-kv    # Merge backend branch into main
git push origin main            # Push updated main to GitHub
```

#### AFTER MERGING TO MAIN (keep backend branch clean)

```bash
git checkout backend-kv         # Switch to backend branch
git rebase main                 # Sync backend branch with updated main
git push --force-with-lease origin backend-kv   # Update remote backend branch
```

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
git checkout main               # Switch to main branch
git pull origin main            # Pull latest changes from remote main
git checkout frontend-sadaf     # Switch back to frontend branch
git rebase main                 # Move frontend branch on top of latest main
```

#### BEFORE OR AFTER COMMITTING

```bash

git add .                       # Stage all changes
git commit -m "frontend: message"   # Commit frontend changes
git push origin frontend-sadaf      # Push backend branch to GitHub

# Optional safety step before pushing or if push fails::
git checkout main               # Go to main
git pull origin main            # Ensure main is updated
git checkout frontend-sadaf     # Return to frontend branch
git rebase main                 # Re-apply frontend changes on latest main
git push --force-with-lease origin frontend-sadaf   # Safely force push after rebase
```


#### MERGE FRONTEND INTO MAIN (no PR)
We can discuss and sync before pushing your branch changes to main branch.

```bash
git checkout main               # Switch to main
git pull origin main            # Ensure main is latest
git merge --no-ff frontend-sadaf   # Merge frontend branch into main
git push origin main            # Push updated main to GitHub
```

#### AFTER MERGING TO MAIN (keep frontend branch clean)

```bash
git checkout frontend-sadaf     # Switch to frontend branch
git rebase main                 # Sync frontend branch with updated main
git push --force-with-lease origin frontend-sadaf   # Update remote frontend branch
```

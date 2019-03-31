This is the checklist that we try to go through for every single pull request that we get. If you're wondering why it takes so long for us to accept pull requests, this is why.

## General

- [ ] Is this change useful, or something that I think will benefit others greatly?
- [ ] Check for overlap with other PRs.
- [ ] Are there any long-term consequences of this PR? Will it overtly cause any regressions?
- [ ] Could the abstractions in the code be made better?

## Check the Code

- [ ] If it does too much, can it to be broken up into smaller PRs?
- [ ] Does it pass TSLint?
- [ ] Is it consistent?

## Check the Tests

- [ ] Does it have tests? New tests?
- [ ] Does code coverage decrease with the incoming PR? If yes then add tests that will fix that.

## Check the Docs

- [ ] If any new functions/classes are added, do they contain docstrings?

## Closing Issues

- [ ] Squash the PR branch. This will close the PR's issue.

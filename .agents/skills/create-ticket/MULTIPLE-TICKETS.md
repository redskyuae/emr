# Splitting a long requirement

A long requirement becomes one parent ticket with the pieces attached as GitHub sub-issues. The parent then shows every piece and its progress, and each piece stays small enough to build and review on its own.

## When to split

Split when the requirement holds several capabilities that would each be useful to the hospital if shipped alone, or when it is more work than one developer could build and have reviewed as a single pull request per layer.

Do not split small related changes to one feature. Three adjustments to the same screen are one ticket per layer, not a parent with three children.

## Shape

**The parent** holds the whole requirement in business terms: Why, What to build as an overview of the full capability, every Business rule, and Out of scope. Leave out Implementation notes beyond a sentence on the overall approach, and do not hand-write a checklist of the children; GitHub lists the sub-issues and their progress on the parent.

**Each child** is a complete ticket in the normal format, one per capability and layer. It must stand on its own: it repeats the rules its implementer needs instead of pointing at the parent for them, and it delivers something that can be checked without the other children.

Keep it one level deep. A child that needs children of its own is a sign the parent should be two requirements.

Sizing checks:

- A child too large for one pull request: split the capability further.
- A child that cannot be verified on its own: merge it into its neighbour.
- A child nobody at the hospital would notice shipping: it is probably a step inside another child, not a ticket.

Order the children by capability, not by layer: the backend and frontend of the first capability come before the backend of the second, so something usable exists as early as possible.

If the requester pointed you at an existing ticket as the requirement, attach the children to that ticket instead of creating a new parent. Do not rewrite its body.

## Labels

The parent still needs exactly one layer label. Use the layer all its children share, or `backend` when they span both, as the existing parent tickets do.

## Publishing

Publish the parent first, then the children in build order, so each child can name real issue numbers:

```bash
gh issue create --title "<parent title>" --body-file <path> --label backend --label enhancement
gh issue create --title "<child title>" --body-file <path> --label backend --label enhancement --parent <parent>
gh issue create --title "<child title>" --body-file <path> --label frontend --label enhancement --parent <parent> --blocked-by <n>
```

`--parent` attaches the new ticket as a sub-issue. `--blocked-by` takes a comma-separated list of the tickets that must land first. Keep the `Parent` and `Blocked by` sections in the body as well, so the ticket reads completely on its own.

## Older versions of `gh`

`--parent` and `--blocked-by` are recent flags. Check for them before publishing anything, so a missing flag does not stop the run with half the tickets created:

```bash
gh issue create --help | grep -E -- '--parent|--blocked-by'
```

If either is missing, create every ticket without it, then add the links through the API. Both calls want the other issue's database id, not its issue number:

```bash
# Attach <child> to <parent> as a sub-issue
gh api repos/{owner}/{repo}/issues/<parent>/sub_issues -F sub_issue_id="$(gh api repos/{owner}/{repo}/issues/<child> --jq .id)"

# Mark <ticket> as blocked by <blocker>
gh api repos/{owner}/{repo}/issues/<ticket>/dependencies/blocked_by -F issue_id="$(gh api repos/{owner}/{repo}/issues/<blocker> --jq .id)"
```

If an API call fails as well, the `Parent` and `Blocked by` sections in the body still record the relationship. Tell the requester which native links are missing when you share the tickets.

## After publishing

When everything is published, confirm that every child is attached and every dependency is recorded before sharing the links:

```bash
gh api repos/{owner}/{repo}/issues/<parent>/sub_issues --jq '.[].number'
gh api repos/{owner}/{repo}/issues/<ticket>/dependencies/blocked_by --jq '.[].number'
```

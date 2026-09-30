export function getAuthLinkFlags() {
  return {
    showCreateWorkspaceLink: process.env.AUTH_SHOW_CREATE_WORKSPACE_LINK === 'true',
    showBackToSiteLink: process.env.AUTH_SHOW_BACK_TO_SITE_LINK === 'true',
  };
}

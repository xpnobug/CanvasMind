export const VIDEO_PROJECTS_BASE_PATH = '/api/video-projects'

export const isVideoProjectsPath = (requestPath: string) => {
  return requestPath === VIDEO_PROJECTS_BASE_PATH || requestPath.startsWith(`${VIDEO_PROJECTS_BASE_PATH}/`)
}

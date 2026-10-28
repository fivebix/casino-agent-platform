/**
 * Materialized path for the agent tree: "/<id>/<id>/". Top-level agents
 * (children of the operator admin) have a parent path of "/".
 */
export const ROOT_PATH = '/';

export function childPath(parentPath: string, id: string): string {
  return `${parentPath}${id}/`;
}

/** True when `path` is `ancestorPath` itself or anything below it. */
export function isInSubtree(path: string, ancestorPath: string): boolean {
  return path.startsWith(ancestorPath);
}

export function isStrictDescendant(path: string, ancestorPath: string): boolean {
  return path !== ancestorPath && path.startsWith(ancestorPath);
}

export function depthOf(path: string): number {
  return path.split('/').filter(Boolean).length;
}

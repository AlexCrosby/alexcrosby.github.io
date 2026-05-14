export type VfsNodeType = 'file' | 'dir';

import focusAdviceText from './content/focus-advice.txt?raw';
import astonMartinText from './content/aston-martin.txt?raw';
import policeText from './content/police.txt?raw';
import universityText from './content/university.txt?raw';
import universityProjectsText from './content/university-projects.txt?raw';

export interface VfsFile {
  type: 'file';
  content: string;
}

export interface VfsDir {
  type: 'dir';
  children: Record<string, VfsNode>;
}

export type VfsNode = VfsFile | VfsDir;

export const fileSystem: VfsDir = {
  type: 'dir',
  children: {
    'about.txt': {
      type: 'file',
      content: 'Hi! I am Alex. Welcome to my terminal portfolio.\nType `ls` to see what is here, and `cat <filename>` to read a file.',
    },
    work: {
      type: 'dir',
      children: {
        'focus-advice.txt': {
          type: 'file',
          content: focusAdviceText,
        },
        'aston-martin.txt': {
          type: 'file',
          content: astonMartinText,
        },
        'police.txt': {
          type: 'file',
          content: policeText,
        }
      },
    },
    projects: {
      type: 'dir',
      children: {
        'terminal-portfolio.txt': {
          type: 'file',
          content: 'Terminal Portfolio: You are looking at it right now! Built with React and Vite.',
        },
        'picar-RTC.txt': {
          type: 'file',
          content: 'A raspberry pi based robotic car capable of being controlled via a browser. Featured webRTC based video feed for low latency first person view.',
        },
        'university-projects.txt': {
          type: 'file',
          content: universityProjectsText,
        }
      },
    },
    education: {
      type: 'dir',
      children: {
        'university.txt': {
          type: 'file',
          content: universityText,
        },
        'university-projects.txt': {
          type: 'file',
          content: universityProjectsText,
        },
      },
    },
  },
};

/**
 * Resolves a given target path against the current working directory.
 * Does not check if the path actually exists.
 * Returns absolute path without trailing slash (except for root `/`).
 */
export function resolvePath(cwd: string, target: string): string {
  if (!target) return cwd;

  // If absolute path
  let parts: string[];

  if (target.startsWith('~')) {
    parts = target.split('/').filter(Boolean);
  } else if (target.startsWith('/')) {
    parts = ['~', ...target.split('/').filter(Boolean)];
  } else {
    parts = [...cwd.split('/').filter(Boolean), ...target.split('/').filter(Boolean)];
  }

  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      if (resolved.length > 1) { // Prevent going above ~
        resolved.pop();
      }
    } else {
      resolved.push(part);
    }
  }

  if (resolved.length === 0) return '~';
  return resolved.join('/');
}

/**
 * Retrieves the VFS node at a given absolute path.
 */
export function getNode(absolutePath: string): VfsNode | null {
  const parts = absolutePath.split('/').filter(Boolean);
  if (parts.length === 0 || parts[0] !== '~') return null;

  let current: VfsNode = fileSystem;

  for (let i = 1; i < parts.length; i++) {
    if (current.type !== 'dir') return null;
    current = current.children[parts[i]];
    if (!current) return null;
  }

  return current;
}

export interface AutocompleteOption {
  name: string;
  isDir: boolean;
}

/**
 * Given a partial path, returns all matching children in the target directory.
 */
export function getAutocompleteOptions(cwd: string, partialPath: string): AutocompleteOption[] {
  let dirPath = cwd;
  let prefix = partialPath;

  const lastSlashIndex = partialPath.lastIndexOf('/');
  if (lastSlashIndex !== -1) {
    const targetDir = partialPath.substring(0, lastSlashIndex);
    // If targetDir is empty (e.g. partialPath is '/home'), resolve relative to root
    dirPath = resolvePath(cwd, targetDir || '/');
    prefix = partialPath.substring(lastSlashIndex + 1);
  }

  const node = getNode(dirPath);
  if (!node || node.type !== 'dir') return [];

  const matches: AutocompleteOption[] = [];
  for (const [name, child] of Object.entries(node.children)) {
    if (name.toLowerCase().startsWith(prefix.toLowerCase())) {
      matches.push({ name, isDir: child.type === 'dir' });
    }
  }

  return matches;
}

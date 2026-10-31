export interface CatalogEntry {
  readonly id: string;
  readonly aliases: readonly string[];
}

export interface LoadedCatalog {
  readonly version: string;
  readonly entries: readonly CatalogEntry[];
}

export function loadCatalog(): LoadedCatalog {
  return {
    version: '1.0.0',
    entries: [
      { id: 'cplusplus', aliases: ['C++', 'cpp'] },
      { id: 'csharp', aliases: ['C#', 'csharp'] },
      { id: 'docker', aliases: ['Docker'] },
      { id: 'git', aliases: ['Git'] },
      { id: 'java', aliases: ['Java'] },
      { id: 'javascript', aliases: ['JavaScript', 'JS'] },
      { id: 'nodejs', aliases: ['Node.js', 'NodeJS', 'Node'] },
      { id: 'react', aliases: ['React', 'React.js'] },
      { id: 'react-native', aliases: ['React Native', 'ReactNative'] },
      { id: 'sql', aliases: ['SQL', 'Structured Query Language'] },
    ],
  };
}

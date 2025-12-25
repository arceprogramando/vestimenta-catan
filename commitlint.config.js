// Configuración de Commitlint para Conventional Commits
// Docs: https://commitlint.js.org/
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Tipos permitidos (según Conventional Commits)
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nueva funcionalidad
        'fix',      // Corrección de bugs
        'docs',     // Documentación
        'style',    // Formato, sin cambios de código
        'refactor', // Refactorización
        'perf',     // Mejoras de rendimiento
        'test',     // Tests
        'build',    // Build system o dependencias
        'ci',       // CI/CD
        'chore',    // Tareas de mantenimiento
        'revert',   // Revertir commits
      ],
    ],
    // El tipo debe estar en minúsculas
    'type-case': [2, 'always', 'lower-case'],
    // El subject no puede estar vacío
    'subject-empty': [2, 'never'],
    // El tipo no puede estar vacío
    'type-empty': [2, 'never'],
    // Longitud máxima del header (tipo + scope + subject)
    'header-max-length': [2, 'always', 100],
  },
};

export const snakeToCamel = (str) => str.replace(
/([-_][a-z])/g,
    (group) => group.toUpperCase()
        .replace('-', '')
        .replace('_', '')
);

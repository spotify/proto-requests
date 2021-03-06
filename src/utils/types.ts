export const protoPrimitiveTypesToTsTypes = {
    double: 'number',
    float: 'number',
    int32: 'number',
    int64: 'number',
    uint32: 'number',
    uint64: 'number',
    sint32: 'number',
    sint64: 'number',
    fixed32: 'number',
    fixed64: 'number',
    sfixed32: 'number',
    sfixed64: 'number',
    bool: 'boolean',
    string: 'string',
    bytes: 'any',
};

export const typeDefaults = {
    double: '0',
    float: '0',
    int32: '0',
    int64: '0',
    uint32: '0',
    uint64: '0',
    sint32: '0',
    sint64: '0',
    fixed32: '0',
    fixed64: '0',
    sfixed32: '0',
    sfixed64: '0',
    bool: 'false',
    string: '\"\"',
    bytes: '\"\"',
};

#matchesFilter(text, searchValue, filterMode, caseSensitive = false) {
    text = text.trim();
    searchValue = searchValue.trim();
    if (!caseSensitive) text = text.toLowerCase();

    switch (filterMode) {
        case 'boolean': {
            // --- Tokenizer ---
            // Handles: parentheses, AND/OR/NOT, quoted strings, and bare words
            const tokenize = expr => {
                const tokens = [];
                const regex = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|(\bAND\b|\bOR\b|\bNOT\b)|([()])|([^()\s]+)/gi;
                let match;
                while ((match = regex.exec(expr)) !== null) {
                    if (match[1] !== undefined) tokens.push(match[1]);        // double-quoted
                    else if (match[2] !== undefined) tokens.push(match[2]);   // single-quoted
                    else if (match[3] !== undefined) tokens.push(match[3].toUpperCase()); // operator
                    else if (match[4] !== undefined) tokens.push(match[4]);   // parenthesis
                    else if (match[5] !== undefined) tokens.push(match[5]);   // bare word
                }
                return tokens;
            };

            // --- Recursive Descent Parser ---
            const parseExpression = tokens => {
                const parseTerm = () => {
                    let node = parseFactor();
                    while (tokens[0] === 'AND') {
                        tokens.shift();
                        node = { op: 'AND', left: node, right: parseFactor() };
                    }
                    return node;
                };

                const parseFactor = () => {
                    const tok = tokens.shift();
                    if (tok === '(') {
                        const node = parseExpression(tokens);
                        if (tokens[0] === ')') tokens.shift();
                        return node;
                    }
                    if (tok === 'NOT') {
                        return { op: 'NOT', value: parseFactor() };
                    }
                    return tok;
                };

                let node = parseTerm();
                while (tokens[0] === 'OR') {
                    tokens.shift();
                    node = { op: 'OR', left: node, right: parseTerm() };
                }
                return node;
            };

            // --- Evaluator ---
            const evaluateNode = (node, text) => {
                if (typeof node === 'string') {
                    const term = caseSensitive ? node : node.toLowerCase();
                    const isRegex = term.startsWith('^') || term.endsWith('$') || /[.*+?()[\]|]/.test(term);
                    try {
                        return isRegex
                            ? new RegExp(term, caseSensitive ? '' : 'i').test(text)
                            : text.includes(term);
                    } catch {
                        return false;
                    }
                }
                switch (node.op) {
                    case 'AND': return evaluateNode(node.left, text) && evaluateNode(node.right, text);
                    case 'OR':  return evaluateNode(node.left, text) || evaluateNode(node.right, text);
                    case 'NOT': return !evaluateNode(node.value, text);
                }
            };

            // --- Driver logic ---
            try {
                const tokens = tokenize(searchValue);
                const ast = parseExpression(tokens);
                return evaluateNode(ast, text);
            } catch (e) {
                console.error('Boolean filter parse error:', e);
                return false;
            }
        }

        // --- other filter modes ---
        default:
            return text.includes(searchValue);
    }
}

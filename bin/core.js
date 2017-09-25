"use strict";
var Workout;
(function (Workout) {
    var Parser;
    (function (Parser) {
        function parse(code) {
            const lines = code.split('\n')
                .filter(line => !/^\s*$/.test(line));
            for (const line of lines) {
                const splinted = line.split('=');
                if (splinted.length !== 2)
                    throw { line: line, message: "Has more than one definition sign" };
                if (!/^[a-z]$/.test(splinted[0].trim()))
                    throw { line: line, message: "Bad formula symbol" };
            }
            const formulas = lines.map(line => {
                const [name, rule] = line.split('=');
                return {
                    dependencies: fetchSymbols(rule),
                    formula: rule.trim(),
                    symbol: name.trim(),
                };
            });
            return formulas;
        }
        Parser.parse = parse;
        function fetchSymbols(rule) {
            const matches = new Array();
            rule.replace(/(?:\b((?:[a-z])+)\b)(?!(?:\s)*\()/g, match => {
                matches.push(match);
                return '';
            });
            return matches;
        }
    })(Parser = Workout.Parser || (Workout.Parser = {}));
})(Workout || (Workout = {}));
var Octobass;
(function (Octobass) {
    function exec(data, func) {
        const computedData = {};
        let countDownCounter = data.length;
        let lastCountDownCounterBackup = Infinity;
        while (countDownCounter > 0) {
            lastCountDownCounterBackup = countDownCounter;
            for (const input of data)
                countDownCounter =
                    tryToCompute(input, computedData, countDownCounter, func);
            if (lastCountDownCounterBackup === countDownCounter)
                return computedData;
        }
        return computedData;
    }
    Octobass.exec = exec;
    function tryToCompute(inputData, computedData, countDownCounter, func) {
        if (!isComputable(inputData, computedData))
            return countDownCounter;
        computedData[inputData.info.id] =
            func(computedData, inputData);
        return countDownCounter - 1;
    }
    function isComputable(inputData, computedData) {
        for (const id of inputData.dependencies)
            if (computedData[id] === undefined)
                return false;
        return true;
    }
})(Octobass || (Octobass = {}));
var Workout;
(function (Workout) {
    var OctobassAdapter;
    (function (OctobassAdapter) {
        function compute(ast) {
            const octobassData = createOctobassData(ast);
            const computedValue = Octobass.exec(octobassData, octobassComputingFunction);
            return computedValue;
        }
        OctobassAdapter.compute = compute;
        function createOctobassData(ast) {
            return ast.map(node => ({
                info: {
                    id: node.symbol,
                    name: node.symbol,
                },
                dependencies: new Set(node.dependencies),
                formula: node.formula
            }));
        }
        function octobassComputingFunction(computedData, input) {
            const functionDataAsConstants = [...input.dependencies]
                .map(symbol => `const ${symbol} = ${computedData[symbol]};`)
                .join('\n');
            const funcString = (`(( ) => {
                ${functionDataAsConstants}
                return ${input.formula};
            })( )`);
            const computedValue = eval(funcString);
            return computedValue;
        }
    })(OctobassAdapter = Workout.OctobassAdapter || (Workout.OctobassAdapter = {}));
})(Workout || (Workout = {}));
var Workout;
(function (Workout) {
    function compute(code) {
        const ast = Workout.Parser.parse(code);
        const computed = Workout.OctobassAdapter.compute(ast);
        return {
            ast: ast,
            results: computed
        };
    }
    Workout.compute = compute;
})(Workout || (Workout = {}));
var Workout;
(function (Workout) {
    var LaTeX;
    (function (LaTeX) {
        function generateDiagram(ast) {
            const formulas = ast.map(x => generateLatexForFormula(x))
                .join('\n\\\\\n');
            return `\\begin{split}\n${formulas}\n\\end{split}`;
        }
        LaTeX.generateDiagram = generateDiagram;
        function generateLatexForFormula(formula) {
            const dependenciesCode = ((formula.dependencies.length > 0)
                ? ('\\ \\begin{cases}'
                    + formula.dependencies
                        .map(x => `\\text{${x}}`)
                        .join('\\\\\n')
                    + '\\end{cases}')
                : '');
            const formulaCode = `\\overbrace{${formula.formula}}^{${formula.symbol}}`;
            return `${formulaCode} & ${dependenciesCode} \n`;
        }
    })(LaTeX = Workout.LaTeX || (Workout.LaTeX = {}));
})(Workout || (Workout = {}));
var TestWorkspace;
(function (TestWorkspace) {
    window.onload = () => {
        const code = (`
                a = 2
                y = x + 2
                x = 3 * a
                z = y + w
            `);
        const computed = Workout.compute(code);
        const latexCode = Workout.LaTeX.generateDiagram(computed.ast);
        console.log(latexCode);
        console.log(computed);
    };
})(TestWorkspace || (TestWorkspace = {}));
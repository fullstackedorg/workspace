import ts from "typescript";

function compile(fileName, options) {
    // Create a Program with an in-memory emit
    const createdFiles = {}
    const host = ts.createCompilerHost(options);
    host.writeFile = (fileName, contents) => createdFiles[fileName.replace(process.cwd() + "/", "")] = contents

    // Prepare and emit the d.ts files
    const program = ts.createProgram([fileName], options, host);
    program.emit();
}

// Run the compiler
compile(process.argv.at(2), {
    declaration: true,
    emitDeclarationOnly: true,
});

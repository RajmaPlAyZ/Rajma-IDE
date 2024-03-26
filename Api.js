const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const compiler = require('compilex');
const options = { stats: true };
compiler.init(options);

app.use(bodyParser.json());
app.use("/codemirror-5.65.9", express.static(__dirname + "/codemirror-5.65.9"));
app.use("/images", express.static(__dirname + "/images"));
app.use("/icons", express.static(__dirname + "/icons"));

app.get("/", function (req, res) {
    compiler.flush(function () {
        console.log("All temporary files are flushed");
    });
    res.sendFile(__dirname + "/index.html");
});

app.post("/save", function (req, res) {
    var code = req.body.code;

    // Log to check if the code is received
    console.log('Code received:', code);

    // Add your code to save the 'code' variable to a file, database, or any storage mechanism you prefer
    // For example, saving to a file:
    const fs = require('fs');
    fs.writeFile('savedCode.txt', code, (err) => {
        if (err) {
            res.json({ success: false });
        } else {
            console.log('Code saved successfully!');

            // Set the appropriate headers for triggering a file download
            res.setHeader('Content-Disposition', 'attachment; filename=savedCode.txt');
            res.setHeader('Content-Type', 'text/plain');

            // Send the saved file as the response
            res.sendFile('savedCode.txt', { root: __dirname }, function (err) {
                if (err) {
                    res.json({ success: false });
                } else {
                    console.log('File sent successfully!');
                    // Optional: Delete the file after download if needed
                    // fs.unlinkSync('savedCode.txt');
                }
            });
        }
    });
});

app.post("/compile", async function (req, res) {
    var code = req.body.code;
    var input = req.body.input;
    var lang = req.body.lang;

    try {
        var envData = { OS: "windows" };

        if (lang == "Cpp") {
            envData.cmd = "g++";
            envData.options = { timeout: 10000 };
            if (input) {
                compiler.compileCPPWithInput(envData, code, input, handleCompilationResponse(res));
            } else {
                compiler.compileCPP(envData, code, handleCompilationResponse(res));
            }
        } else if (lang == "Java") {
            compiler.compileJava(envData, code, handleCompilationResponse(res, "error"));
        } else if (lang == "Python") {
            compiler.compilePython(envData, code, handleCompilationResponse(res));
        } else if (lang == "C") {
            envData.cmd = "gcc";
            envData.options = { timeout: 10000 };
            if (input) {
                compiler.compileCWithInput(envData, code, input, handleCompilationResponse(res));
            } else {
                compiler.compileC(envData, code, handleCompilationResponse(res));
            }
        } else if (lang == "C#") {
            envData.cmd = "csc";
            envData.options = { timeout: 10000 };
            if (input) {
                compiler.compileCS(envData, code, input, handleCompilationResponse(res));
            } else {
                compiler.compileCSWithInput(envData, code, input, function (data) {
                    res.send(data);
                });
            }
        }

        
    } catch (e) {
        console.error("Compilation error:", e);
        res.send({ output: "error" });
    }
});

function handleCompilationResponse(res, defaultError = "error") {
    return function (data) {
        if (data.output) {
            res.send(data);
        } else {
            res.send({ output: defaultError });
        }
    };
}

app.listen(8000, function () {
    console.log("Server is running on port http://localhost:8000");
});

function checkArgumentsDefinedAndHaveValue(args)
{
    var x;
    for (x in args)
    {
        arg = args[x];
        console.assert(!(typeof arg == "undefined" || arg == null));
    }
}

function padStringToLength(str, len)
{
    console.assert(str.length <= len);
    checkArgumentsDefinedAndHaveValue(arguments);

    let padLength = len - str.length;
    let pad1 = Math.floor(padLength / 2);
    let pad2 = padLength - pad1;
    let padLeft = Math.max(pad1,pad2);

    let leftPadStr = str.padStart(padLeft + str.length, ' ');

    return leftPadStr.padEnd(len, ' ');
}

function randomInt(min, max)
{
    checkArgumentsDefinedAndHaveValue(arguments);
    return Math.round(Math.random() * (max-min) + min);
}

function randomFloat(min, max)
{
    checkArgumentsDefinedAndHaveValue(arguments);
    return (Math.random() * (max-min) + min);
}

function gameOutputAppend(str)
{
    let textarea = document.getElementById("gameOutputBox")
    textarea.value += str + '\n';
    textarea.scrollTop = textarea.scrollHeight;
}

function updateMap(mapString = game.currentQuadrant.toString())
{
    document.getElementById("map").innerHTML = mapString;
}

function autosave(game)
{
    //console.log("autosave func");
    //console.log(JSON.stringify(game));

    if (game && !game.gameOver)
    {
        localStorage.setItem("autosave", JSON.stringify(game));
    }
    else
    {
        localStorage.setItem("autosave", null);
    }
}

function makeCDF(instanceProbabilities)
{
    var rval = [];
    let totalSum = 0.0;

    for (var x in instanceProbabilities)
    {
        totalSum += instanceProbabilities[x];
        rval.push(totalSum);
    }

    for (var x in rval)
    {
        rval[x] /= totalSum;
    }

    // last value should always be exactly 1
    rval[rval.length-1] = 1.0;

    return rval;
}

// generates a random value, between 0 and valueProbabilities.length-1, where each possible value's chance of
// being generated is listed in the corresponding array entry
function randomWithProbabilities(valueProbabilities)
{
    let randomVal = randomFloat(0.0, 1.0);
    let cdf = makeCDF(valueProbabilities);

    //console.log("" + cdf);
    var x;
    for (x in cdf)
    {
        if (randomVal < cdf[x])
        {
            return x;
        }
    }
    return cdf.length-1;
}
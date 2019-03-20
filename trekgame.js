const mapWidthQuadrants = 8;
const mapHeightQuadrants = 8;
const quadrantWidthSectors = 8;
const quadrantHeightSectors = 8;
const sectorDisplayWidthChars = 4;

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

class Grid
{
    constructor(gridX, gridY, gridItemConstructor)
    {
        checkArgumentsDefinedAndHaveValue(arguments);

        this.contents = new Array()

        this.width = gridX;
        this.height = gridY;
        this.size = gridX * gridY;

        for (let i = 0; i < this.size; i++)
        {
            this.contents[i] = gridItemConstructor();
        }
    }

    lookup(x,y)
    {
        checkArgumentsDefinedAndHaveValue(arguments);
        return this.contents [y * this.width + x];
    }

    setValue(x,y,val)
    {
        checkArgumentsDefinedAndHaveValue(arguments);
        this.contents [y * this.width + x] = val;
    }

    toString()
    {
        let rval = "";
        for ( let y = 0; y < this.height; y++)
        {
            for (let x = 0; x < this.width; x++)
            {
                let catstr = this.lookup(x,y).toString();
                rval += catstr;
            }

            rval += '\n';
        }
        return rval;
    }
}

class GameObject
{
    constructor()
    {
        this.sectorX = 0;
        this.sectorY = 0;
        this.quadrantX = 0;
        this.quadrantY = 0;
    }
}

class Star extends GameObject
{
    constructor()
    {
        super();
    }

    toString()
    {
        return "*";
    }
}

class Enterprise extends GameObject
{
    constructor()
    {
        super();
    }

    toString()
    {
        return "<*>";
    }
}

class Quadrant
{
    constructor(widthSectorsIn, heightSectorsIn)
    {
        checkArgumentsDefinedAndHaveValue(arguments);
        this.width = widthSectorsIn;
        this.height = heightSectorsIn;
        this.quadrantEntities = new Array();
    }

    toString()
    {
        let borderString = "---------------------------------\n";

        let quadrantStringGrid = new Grid(this.width, this.height, function(){return " ".padStart(sectorDisplayWidthChars, ' ')})

        var gameObjectIndex;
        for (gameObjectIndex in this.quadrantEntities)
        {
            let gameObject = this.quadrantEntities[gameObjectIndex];
            let objStr = gameObject.toString().padStart(sectorDisplayWidthChars, ' ');
            quadrantStringGrid.setValue(gameObject.sectorX, gameObject.sectorY, objStr);
        }

        let mapString = quadrantStringGrid.toString();

        return "<pre>" + borderString + mapString + borderString + "</pre>";
    }
}

class GalaxyMap extends Grid
{
    constructor(quadrantsX, quadrantsY)
    {
        checkArgumentsDefinedAndHaveValue(arguments);
        super(quadrantsX, quadrantsY, function(){return new Quadrant(quadrantWidthSectors,quadrantHeightSectors)});
    }
}

class TrekGame
{
    constructor()
    {
        this.galaxyMap = new GalaxyMap(mapWidthQuadrants, mapHeightQuadrants);
        this.enterprise = new Enterprise();
        this.currentQuadrant = this.galaxyMap.lookup(this.enterprise.quadrantX, this.enterprise.quadrantY);
        
        this.currentQuadrant.quadrantEntities.push(this.enterprise);
    }
}

console.log("Hope you enjoy the game!");

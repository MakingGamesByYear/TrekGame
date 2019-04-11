const mapWidthQuadrants = 8;
const mapHeightQuadrants = 8;
const quadrantWidthSectors = 8;
const quadrantHeightSectors = 8;
const sectorDisplayWidthChars = 4;
const minKlingonsGame = 8;

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

    // 1D array based lookup
    lookup1D(x)
    {
        checkArgumentsDefinedAndHaveValue(arguments);
        return this.contents[x];
    }

    setValue(x,y,val)
    {
        checkArgumentsDefinedAndHaveValue(arguments);
        this.contents [y * this.width + x] = val;
    }

    getEmptySquare()
    {
        let startIndex = randomInt(0, this.contents.length-1);
        let emptyIndex = null;

        for (let i = 0; i < this.contents.length; i++)
        {
            let lookup = ( startIndex + i ) % this.contents.length;
            if (!this.contents.lookup)
            {
                emptyIndex = i;
                break;
            }
        }

        if (emptyIndex)
        {
            let rx = emptyIndex % this.width;
            let ry = emptyIndex / this.height;

            return {x : rx, y:ry};
        }
        
        return null;
    }

    toString()
    {
        let rval = "";
        for ( let y = 0; y < this.height; y++)
        {
            rval += '|';
            for (let x = 0; x < this.width; x++)
            {
                let catstr = this.lookup(x,y).toString();
                rval += catstr;
            }
            rval += '|';
            rval += '\n';
        }
        return rval;
    }
}

class GameObject
{
    constructor(className)
    {
        this.sectorX = 0;
        this.sectorY = 0;
        this.quadrantX = 0;
        this.quadrantY = 0;

        if (!className.Instances)
        {
            className.Instances = 0;
        }

        className.Instances++;
    }

    setLocationSector(sectorXY)
    {
        this.sectorX = sectorXY.x;
        this.sectorY = sectorXY.y;
    }

    // randomly generate the number of GameObject instances to put in a new quadrant
    static randomCountForQuadrant(quadrantFreeSpaces)
    {
        let rval = randomInt(0, this.maxInstancesQuadrant());
        rval = Math.min(rval, quadrantFreeSpaces);

        if (!this.Instances)
        {
            this.Instances = 0;
        }

        rval = Math.min(rval, this.maxInstancesGame() - this.Instances);

        console.assert(this.Instances <= this.maxInstancesGame());

        return rval;
    }

    static minInstancesGame()
    {
        return 0;
    }

    static maxInstancesQuadrant()
    {
        return 8;
    }

    static maxInstancesGame()
    {
        return this.maxInstancesQuadrant() * mapWidthQuadrants * mapHeightQuadrants;
    }
}

class StarBase extends GameObject
{
    constructor()
    {
        super(StarBase);
    }

    toString()
    {
        return ">!<";
    }

    static maxInstancesQuadrant()
    {
        return 1;
    }

    static minInstancesGame()
    {
        return 1;
    }
}

class Klingon extends GameObject
{
    constructor()
    {
        super(Klingon);
    }

    toString()
    {
        return "+K+";
    }
    
    static maxInstancesQuadrant()
    {
        return 4;
    }

    static maxInstancesGame()
    {
        return 18;
    }

    static minInstancesGame()
    {
        return minKlingonsGame;
    }
}

class Star extends GameObject
{
    constructor()
    {
        super(Star);
    }

    toString()
    {
        return "*";
    }

    static maxInstancesQuadrant()
    {
        return 4;
    }
}

class Enterprise extends GameObject
{
    static StartTorpedoes = 10;
    static StartEnergy = 3000;
    static StartShields = 0;

    constructor()
    {
        super(Enterprise);
        this.torpedoes = Enterprise.StartTorpedoes;
        this.shields = Enterprise.StartShields;
        this.energy = Enterprise.StartEnergy;
    }

    toString()
    {
        return "<*>";
    }

    static maxInstancesGame()
    {
        return 1;
    }

    static maxInstancesQuadrant()
    {
        return 1;
    }

    static minInstancesGame()
    {
        return 1;
    }

    conditionString()
    {
        return "GREEN";
    }

    // long range scan
    lrsString(galaxyMap)
    {
        let border = "-------------------";
        let rval = border + '\n';

        for (let y = this.quadrantY - 1; y <= this.quadrantY + 1; y++)
        {
            rval += "|";
            for (let x = this.quadrantX - 1; x <= this.quadrantX + 1; x++)
            {
                let quadrant = galaxyMap.lookup(x, y);
                if (quadrant)
                {
                    // klingons, starbases, stars
                    let k = quadrant.countEntitiesOfType(Klingon);
                    let s = quadrant.countEntitiesOfType(StarBase);
                    let st = quadrant.countEntitiesOfType(Star);

                    rval += " " + k + s + st + " |";
                }
                else
                {
                    rval += " *** |";
                }
            }
            rval += "\n" + border + "\n";
        }
        return rval;
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

    countEntitiesOfType(classtype)
    {
        var rval=0;
        for (var x in this.quadrantEntities)
        {
            if (this.quadrantEntities[x].constructor == classtype)
            {
                rval++;
            }
        }
        return rval;
    }

    createEntities(entityTypes)
    {
        var entityIdx;
        for (entityIdx in entityTypes)
        {
            let entityType = entityTypes[entityIdx];

            let numEntities = entityType.randomCountForQuadrant(this.emptySquares());

            for (let i =0; i < numEntities; i++ )
            {
                this.addEntity(new entityType());
            }
        }
    }

    addEntity(entity)
    {
        entity.setLocationSector(this.getEmptySquare());
        this.quadrantEntities.push(entity);
    }

    emptySquares()
    {
        return this.width*this.height - this.quadrantEntities.length;
    }

    getEmptySquare()
    {
        console.assert(this.width * this.height > this.quadrantEntities.length);

        if (this.quadrantEntities.length >= this.width*this.height)
        {
            return null;
        }

        let emptyFound = false;

        let testRandom = randomInt(0, (this.width*this.height)-1);

        while (!emptyFound)
        {
            let randomX = testRandom % this.width;
            let randomY = Math.floor(testRandom / this.height);

            var entityIdx;
            emptyFound = true;
            for (entityIdx in this.quadrantEntities)
            {
                let entity = this.quadrantEntities[entityIdx];
                if (entity.sectorX == randomX && entity.sectorY == randomY)
                {
                    emptyFound = false;
                    break;
                }
            }

            if (emptyFound)
            {
                return {x : randomX, y : randomY};
            }

            testRandom++;
        }
    }

    toString()
    {
        let borderString = " =---=---=---=---=---=---=---=---\n";

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
    constructor(quadrantsX, quadrantsY, entityTypes)
    {
        checkArgumentsDefinedAndHaveValue(arguments);
        super(quadrantsX, quadrantsY, function(){return new Quadrant(quadrantWidthSectors,quadrantHeightSectors)});

        this.createMinimumInstances(entityTypes);

        for (let i = 0; i < quadrantsX*quadrantsY; i++)
        {
            this.lookup1D(i).createEntities(entityTypes);
        }
    }

    createMinimumInstances(entityTypes)
    {
        var x;
        for (x in entityTypes)
        {
            let etype = entityTypes[x];

            let instancesToCreate = etype.minInstancesGame() - etype.Instances;

            if (instancesToCreate > 0)
            {
                for (let i = 0; i < instancesToCreate; i++)
                {
                    let inst = new etype();
                    let randomQuadrant = randomInt(0, (quadrantsX * quadrantsY)-1);

                    let instAssigned = false;
                    for (let quad = 0; quad < quadrantsX*quadrantsY; quad++)
                    {
                        if (this.lookup1D(randomQuadrant).quadrantFreeSpaces())
                        {
                            this.lookup1D(randomQuadrant).addEntity(inst);
                            instAssigned = true;
                            break;
                        }

                        randomQuadrant = (randomQuadrant + 1 ) % quadrantsX*quadrantsY;
                    }
                    
                    if (!instAssigned)
                    {
                        throw "Not enough space to assign minumum instances of " + etype.name;
                    }
                }
            }
            
        }
    }
}

class TrekGame
{
    static EntityTypes = [Star, StarBase, Klingon];

    constructor()
    {
        this.galaxyMap = new GalaxyMap(mapWidthQuadrants, mapHeightQuadrants, TrekGame.EntityTypes);
        
        this.enterprise = new Enterprise();

        // start in a random quadrant
        this.enterprise.quadrantX = randomInt(0, mapWidthQuadrants - 1);
        this.enterprise.quadrantY = randomInt(0, mapHeightQuadrants - 1);
        this.enterprise.sectorX = 0;
        this.enterprise.sectorY = 0;
        
        this.currentQuadrant = this.galaxyMap.lookup(this.enterprise.quadrantX, this.enterprise.quadrantY);

        this.currentQuadrant.addEntity(this.enterprise);

        this.klingonsRemaining = Klingon.Instances;

        // pick a stardate between the start and end of TOS
        this.starDate = randomInt(1312, 5928);
    }

    currentStardate()
    {
        return this.starDate;
    }

    statusString()
    {
        return "<pre>" +
        "\n\n" + 
        "STARDATE           " + this.currentStardate() + '\n' +  
        "CONDITION          " + this.enterprise.conditionString() + '\n' + 
        "QUADRANT           " + (this.enterprise.quadrantX+1) +  ',' + (this.enterprise.quadrantY+1) + '\n' + 
        "SECTOR             " + (this.enterprise.sectorX+1) +  ',' + (this.enterprise.sectorY+1) + '\n' + 
        "PHOTON TORPEDOES   " + this.enterprise.torpedoes + '\n' + 
        "TOTAL ENERGY       " + this.enterprise.energy + '\n' + 
        "SHIELDS            " + this.enterprise.shields + '\n' + 
        "KLINGONS REMAINING " + this.klingonsRemaining + '\n' + 
        "</pre>";
    }

    gameInput(inputStr)
    {
        console.log(inputStr);

        if (inputStr == "lrs")
        {
            document.getElementById("lrs").innerHTML = "<pre>" + this.enterprise.lrsString(this.galaxyMap) + "</pre>";
        }
    }
}

console.log("Hope you enjoy the game!");

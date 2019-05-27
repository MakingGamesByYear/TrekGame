const mapWidthQuadrants = 8;
const mapHeightQuadrants = 8;
const quadrantWidthSectors = 8;
const quadrantHeightSectors = 8;
const sectorDisplayWidthChars = 4;
const minKlingonsGame = 8;

const defaultInputPrompt = "ENTER ONE OF THE FOLLOWING:\nNAV  (TO SET COURSE)\nLRS  (FOR LONG RANGE SENSOR SCAN)\nPHA  (TO FIRE PHASERS)\nTOR  (TO FIRE PHOTON TORPEDOES)\nSHE  (TO RAISE OR LOWER SHIELDS)\nDAM  (FOR DAMAGE CONTROL REPORTS)\nCOM  (TO CALL ON LIBRARY-COMPUTER)\nXXX  (TO RESIGN YOUR COMMAND)\n\nYour orders :";

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
            rval += (y+1) + '|';
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
        this.entityType = this.constructor.name;

        if (!className.Instances)
        {
            className.Instances = 0;
        }

        className.Instances++;
    }

    distanceToObject(obj2)
    {
        // assumes objects are in the same quadrant, for now
        let xdiff = this.sectorX - obj2.sectorX;
        let ydiff = this.sectorY - obj2.sectorY;
        return Math.sqrt(xdiff*xdiff + ydiff*ydiff);
    }

    setLocationSector(sectorXY)
    {
        this.sectorX = sectorXY.x;
        this.sectorY = sectorXY.y;
    }

    onTorpedoHit(quadrant)
    {
        console.log("Torpedo hit (base class)");
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

    onTorpedoHit(quadrant)
    {
        console.log("hit a starbase");
        gameOutputAppend("\nReport from sector " + (this.sectorX + 1) + ", " + (this.sectorY+1));
        gameOutputAppend("The torpedo strikes and destroys the friendly starbase! I bet you'll be court martialled for that one!");

        quadrant.removeEntity(this);
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
        this.shields = randomInt(100, 300);
    }

    onTorpedoHit(quadrant)
    {
        console.log("hit a klingon");
        gameOutputAppend("\nReport from sector " + (this.sectorX + 1) + ", " + (this.sectorY+1));
        gameOutputAppend("Klingon Fighter Destroyed");

        quadrant.removeEntity(this);
    }

    onPhaserHit(energy, quadrant)
    {
        console.log("Klingon::onPhaserHit");
        let shieldDeflectionLevel = Klingon.shieldDeflectionPercent * this.shields;

        gameOutputAppend("\nReport from sector " + (this.sectorX + 1) + ", " + (this.sectorY+1));
        if (energy <= shieldDeflectionLevel)
        {
            gameOutputAppend("Phaser hit did no damage!");
        }
        else
        {
            gameOutputAppend("Phaser hit the klingon fighter for " + energy + " damage.");

            this.shields -= energy;

            if (this.shields <= 0)
            {
                gameOutputAppend("Klingon Fighter Destroyed");
                quadrant.removeEntity(this);
            }
            else
            {
                gameOutputAppend("" + this.shields + " units remain.");
            }
        }
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

Klingon.shieldDeflectionPercent = .15;

class Star extends GameObject
{
    constructor()
    {
        super(Star);
    }

    onTorpedoHit()
    {
        console.log("hit a star");
        gameOutputAppend("\nReport from sector " + (this.sectorX + 1) + ", " + (this.sectorY+1));
        gameOutputAppend("The star absorbs the torpedo without a trace.");
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
    constructor()
    {
        super(Enterprise);
        this.torpedoes = Enterprise.StartTorpedoes;
        this.shields = Enterprise.StartShields;

        this.freeEnergy = Enterprise.StartEnergy;
    }

    // assumes that the input value has been previously checked for the appropriate range and available value
    setShieldLevel(newShields)
    {
        if ((newShields > this.freeEnergy + this.shields) || newShields < 0.0)
        {
            throw "Invalid value for shield level"; 
        }

        this.freeEnergy += this.shields - newShields;
        this.shields = newShields;
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


    firePhasers(energy, targets, quadrant)
    {
        console.log("fire phasers");

        console.assert(energy <= this.freeEnergy);

        this.freeEnergy -= energy;

        gameOutputAppend("Firing phasers at " + targets.length + " targets.");
        console.assert(targets.length > 0);
        let damagePerTarget = energy / targets.length;

        var x;
        for (x in targets)
        {
            console.log("target");
            let target = targets[x];
            let dist = this.distanceToObject(target);

            let damageAttenuated = damagePerTarget / dist;
            let damageFinal = Math.floor(randomFloat(2.0, 3.0) * damageAttenuated);

            target.onPhaserHit(damageFinal, quadrant);
        }
    }

    fireTorpedo(quadrant, angle)
    {
        if (this.freeEnergy >= Enterprise.TorpedoEnergyCost)
        {
            let torpedoIntersection = quadrant.intersectionTest(this.sectorX, this.sectorY, angle);
            this.torpedoes--;
            this.freeEnergy -= Enterprise.TorpedoEnergyCost;
            
            if (torpedoIntersection.intersects != null)
            {
               torpedoIntersection.intersects.onTorpedoHit(quadrant);
            }
            else
            {
                gameOutputAppend("The torpedo missed!");
            }
        }
        else
        {
            //not enough energy
            gameOutputAppend("Not enough energy to fire torpedoes!");
        }

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

Enterprise.StartTorpedoes = 10;
Enterprise.StartEnergy = 3000;
Enterprise.StartShields = 0;
Enterprise.TorpedoEnergyCost = 2;

class Quadrant
{
    constructor(widthSectorsIn, heightSectorsIn)
    {
        checkArgumentsDefinedAndHaveValue(arguments);
        this.width = widthSectorsIn;
        this.height = heightSectorsIn;
        this.quadrantEntities = new Array();
    }

    populateFromJSData(entitiesQuadrantJS)
    {
        var x;
        for (x in entitiesQuadrantJS.quadrantEntities)
        {
            let entData = entitiesQuadrantJS.quadrantEntities[x];

            // we construct and insert the enterprise entity elsewhere.
            if (entData.entityType != "Enterprise")
            {
                let ctype = EntityMap.get(entData.entityType);

                let entityObj = new ctype(); 
                Object.assign(entityObj, entData);

                this.quadrantEntities.push(entityObj);
            }
        }
    }


    removeEntity(entity)
    {
        let rmindex = this.quadrantEntities.indexOf(entity);
        if (rmindex == -1)throw "Entity not found";
        this.quadrantEntities.splice( rmindex, 1 );
    }

    entityAtLocation(nextXCoord, nextYCoord)
    {
        nextXCoord = Math.floor(nextXCoord);
        nextYCoord = Math.floor(nextYCoord);
        
        for (var x in this.quadrantEntities)
        {
            let objTest = this.quadrantEntities[x];

            if ((objTest.sectorX == nextXCoord) && (objTest.sectorY == nextYCoord))
            {
                return objTest;
            }
        }

        return null;
    }

    // return a tuple containing
    // the last sector prior to the intersection
    // and the intersection object (null if none)
    intersectionTest(sectorX, sectorY, angleDegrees, maxSectorsToTravel = Number.MAX_VALUE)
    {
        checkArgumentsDefinedAndHaveValue(arguments);
        // console.log(""+angleDegrees);

        // take angle in degrees to radians, then create a vector
        // start from 360 CCW because we have a top left origin (y axis goes down) internally
        // instead of y axis goes up like in your math textbook
        let angle = 360.0 - angleDegrees

        let radians = angle * Math.PI / 180.0;

        // polar to euclidean coordinates
        let xVec = Math.cos(radians);
        let yVec = Math.sin(radians);

        // we'll step through the grid in in increments of one cell; -1 if the x / y direction are negative
        let xNextF = xVec > 0.0 ? 1.0 : -1.0;
        let yNextF = yVec > 0.0 ? 1.0 : -1.0;

        // start in the middle of the cell.
        let startCoordX = Math.floor(sectorX) + .5;
        let startCoordY = Math.floor(sectorY) + .5;

        // return values
        let lastCellBeforeIntersectionX = startCoordX;
        let lastCellBeforeIntersectionY = startCoordY;
        let intersectionObject = null;

        //console.log("start coord " + (startCoordX) + " " + (startCoordY));
        //console.log("vec " + (xVec) + " " + (yVec));

        var nextXCoord = 0;
        var nextYCoord = 0;

        var steps = 0;
        while (steps < maxSectorsToTravel)
        {
            // we have, given a start coordinate and a direction vector, the parametric equation of a line
            // Pt = P0 + D*t
            // From this we can derive the parameter t at which the line will reach a particular X or Y value
            // X_t = X_0 + V_x * t
            // Y_t = Y_0 + V_y * t
            // implies
            // (X_t - X_0) / V_x = t
            // or
            // (Y_t - Y_0) / V_y = t
            // so we can figure out what the next cell on the x axis is (current plus or minus one) and figure
            // out the t parameter where the line crosses it.  
            // We can do the same for the next call on the y axis.
            // Then, whichever cell has the lower t parameter the line crosses first.
            // Because there's a division and it's possible the direction vector has a zero component, we'll check for divide by zero

            nextXCoord = Math.floor(lastCellBeforeIntersectionX + xNextF);
            nextYCoord = Math.floor(lastCellBeforeIntersectionY + yNextF);

            //console.log("next " + nextXCoord + " " + nextYCoord);

            let tXBound = (nextXCoord - lastCellBeforeIntersectionX) / xVec;
            let tYBound = (nextYCoord - lastCellBeforeIntersectionY) / yVec;

            tXBound = Math.abs(xVec) > .00001 ?  tXBound : Number.MAX_VALUE;
            tYBound = Math.abs(yVec) > .00001 ?  tYBound : Number.MAX_VALUE;

            var currentT = 0.0;
            if (tXBound < tYBound)
            {
                //console.log("xb " + tXBound);
                nextYCoord = lastCellBeforeIntersectionY + yVec * tXBound;
            }
            else
            {
                //console.log("yb");
                nextXCoord = lastCellBeforeIntersectionX + xVec * tYBound;
            }

            intersectionObject = this.entityAtLocation(nextXCoord, nextYCoord);

            if (intersectionObject != null)
            {
                //console.log("intersection return");
                break;
            }

            if (nextXCoord < 0 || nextXCoord >= quadrantWidthSectors || nextYCoord < 0 || nextYCoord >= quadrantHeightSectors)
            {
                //console.log("next out of bounds " + nextXCoord + " " + nextYCoord);
                break;
            }

            // manhattan distance.
            //console.log("next " + Math.floor(nextXCoord) + " " + Math.floor(nextYCoord));

            lastCellBeforeIntersectionX = nextXCoord;
            lastCellBeforeIntersectionY = nextYCoord;

            steps++;

            //console.log("cell step" + (1+lastCellBeforeIntersectionX) + " " + (1+lastCellBeforeIntersectionY));
        }

        //console.log("cell end " + (1+lastCellBeforeIntersectionX) + " " + (1+lastCellBeforeIntersectionY)+ " " + intersectionObject);
        return {lastX : lastCellBeforeIntersectionX, lastY : lastCellBeforeIntersectionY, intersects : intersectionObject, stepIterations:steps, nextX : nextXCoord, nextY : nextYCoord};
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

    getEntitiesOfType(classtype)
    {
        return this.quadrantEntities.filter(function(item){return item.constructor == classtype});
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
        let borderStringPost = "  -1---2---3---4---5---6---7---8--\n";
        let borderStringPre = "  =---=---=---=---=---=---=---=---\n";

        let quadrantStringGrid = new Grid(this.width, this.height, function(){return " ".padStart(sectorDisplayWidthChars, ' ')})

        var gameObjectIndex;
        for (gameObjectIndex in this.quadrantEntities)
        {
            let gameObject = this.quadrantEntities[gameObjectIndex];
            let objStr = gameObject.toString().padStart(sectorDisplayWidthChars, ' ');
            quadrantStringGrid.setValue(gameObject.sectorX, gameObject.sectorY, objStr);
        }

        let mapString = quadrantStringGrid.toString();

        return "<pre>" + borderStringPre + mapString + borderStringPost + "</pre>";
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

    static ConstructFromJSData(jsData)
    {
        let rval = new GalaxyMap(mapWidthQuadrants, mapHeightQuadrants, []);

        var x;
        for (x in jsData.contents)
        {
            let entitiesQuadrantJS = jsData.contents[x];

            rval.contents[x].populateFromJSData(entitiesQuadrantJS);
        }

        return rval;
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
    static ConstructFromJSData(jsData)
    {
        let gamerval = Object.create(TrekGame.prototype);
        Object.assign(gamerval, jsData);

        gamerval.enterprise = Object.create(Enterprise.prototype);
        Object.assign(gamerval.enterprise, jsData.enterprise);

        gamerval.galaxyMap = GalaxyMap.ConstructFromJSData(jsData.galaxyMap);

        // console.log("galaxy map : " + gamerval.galaxyMap);

        gamerval.currentQuadrant = gamerval.galaxyMap.lookup(gamerval.enterprise.quadrantX, gamerval.enterprise.quadrantY);

        gamerval.currentQuadrant.quadrantEntities.push(gamerval.enterprise);

        return gamerval;
    }

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

        this.setInputPrompt(defaultInputPrompt);

        autosave(this);
    }

    changeToQuadrant(qX, qY)
    {
        this.currentQuadrant.removeEntity(this.enterprise);
        this.currentQuadrant = this.galaxyMap.lookup(qX, qY);
        this.enterprise.quadrantX = qX;
        this.enterprise.quadrantY = qY;
        this.currentQuadrant.quadrantEntities.push(this.enterprise);
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
        "FREE ENERGY        " + this.enterprise.freeEnergy + '\n' + 
        "SHIELDS            " + this.enterprise.shields + '\n' + 
        "KLINGONS REMAINING " + this.klingonsRemaining + '\n' + 
        "</pre>";
    }

    setInputPrompt(newprompt)
    {
        document.getElementById("inputPrompt").innerHTML = newprompt;

    }

    shieldHandler(inputline)
    {
        let parsedVal = parseInt(inputline);

        if (isNaN(parsedVal) || parsedVal < 0)
        {
            gameOutputAppend("Invalid value!");
            return false;
        }
        if (parsedVal > (this.enterprise.shields + this.enterprise.freeEnergy))
        {
            gameOutputAppend("We don't have enough energy for that, captain!");
            return false;
        }
        
        //gameOutputAppend(""+parsedVal);

        this.enterprise.setShieldLevel(parsedVal);
        this.updateStatus();

        return true;
    }

    navigationHandler(inputline)
    {
        console.log("nav");
        let angle = parseInt(inputline);

        if ((angle == null) || isNaN(angle) || angle < 0 || angle > 360.0)
        {
            gameOutputAppend("Invalid value!");
            return false;
        }

        this.awaitInput("Input warp factor (0-8).", 5, function(inputline){return this.navigationHandler2(inputline, angle)});
        return false;
    }

    navigationHandler2(inputline, angle)
    {
        console.log("nav2");
        let warpFactor = parseFloat(inputline);

        if ((warpFactor == null) || isNaN(warpFactor) || warpFactor < 0.0 || warpFactor > 8.0)
        {
            gameOutputAppend("Invalid value");
            return false;
        }

        console.assert(quadrantHeightSectors == quadrantWidthSectors);
        let warpFactorScale = quadrantHeightSectors;

        let sectorsToTravel = Math.round(warpFactorScale * warpFactor);

        if (sectorsToTravel < 1)
        {
            gameOutputAppend("Warp factor is too small to get anywhere!");
        }

        //console.log("Sectors to travel : "  + sectorsToTravel);

        //console.log("intersect test");

        // do an intersection test of the enterprise against the map, in the direction of warp.
        // update the enterprise position to the last valid sector square along the warp vector
        // if we have an obstacle ahead we're done.
        // if we have no squares left to travel we're done.
        // if we have squares left to travel and the way ahead is clear, we need to go to the next sector.
        // but the first square along our line might be obstructed.  so we'll test that before changing sectors.
        while (sectorsToTravel > 0)
        {
            console.log("Loop. " + sectorsToTravel);
            let intersection = this.currentQuadrant.intersectionTest(this.enterprise.sectorX, this.enterprise.sectorY, angle, sectorsToTravel);
           
            console.log("Got intersection result");

            this.enterprise.sectorX = Math.floor(intersection.lastX);
            this.enterprise.sectorY = Math.floor(intersection.lastY);

            if (intersection.intersects != null)
            {
                gameOutputAppend("Obstruction ahead.  Exiting warp.");
                break;
            }

            sectorsToTravel -= intersection.stepIterations;

            if (sectorsToTravel <= 0.0)
            {
                break;
            }

            // if we get here that means we've gone out of bounds for the quadrant

            var sectorXNext = this.enterprise.sectorX;
            var sectorYNext = this.enterprise.sectorY;
            var quadrantXNext = this.enterprise.quadrantX;
            var quadrantYNext = this.enterprise.quadrantY;

            if (intersection.nextX < 0)
            {
                console.log("intersection nextx less 0");
                quadrantXNext = this.enterprise.quadrantX - 1;
                sectorXNext = quadrantWidthSectors - 1;
            }
            if (intersection.nextX >= quadrantWidthSectors)
            {
                console.log("intersection nextx > 8");
                quadrantXNext = this.enterprise.quadrantX + 1;
                sectorXNext = 0;
            }
            if (intersection.nextY < 0)
            {
                console.log("intersection nexty < 0");
                quadrantYNext = this.enterprise.quadrantY - 1;
                sectorYNext = quadrantWidthSectors - 1;
            }
            if (intersection.nextY >= quadrantHeightSectors)
            {
                console.log("intersection nexty > 8");
                quadrantYNext = this.enterprise.quadrantY + 1;
                sectorYNext = 0;
            }

            // we should see SOME change in quadrant.  assert check.
            console.assert((this.enterprise.quadrantX != quadrantXNext) || (this.enterprise.quadrantY != quadrantYNext));

            var nextQuadrantValid = (quadrantXNext >= 0.0) && (quadrantXNext < mapWidthQuadrants) && (quadrantYNext >= 0.0) && (quadrantYNext < mapHeightQuadrants);

            console.log("next quadrant valid " + nextQuadrantValid);

            if (nextQuadrantValid)
            {
                console.log("map lookup quadrant " + quadrantXNext + " " + quadrantYNext);
                var nextQuadrantTest = this.galaxyMap.lookup(quadrantXNext, quadrantYNext);

                console.log("next quadrant test");
                var startSquareFree = nextQuadrantTest.entityAtLocation(sectorXNext, sectorYNext) == null;

                console.log("Start square free : " + startSquareFree);
                if (startSquareFree)
                {
                    this.enterprise.sectorX = sectorXNext;
                    this.enterprise.sectorY = sectorYNext;
                    sectorsToTravel -= 1.0;
                    gameOutputAppend("Entering galactic quadrant " + quadrantXNext + " " + quadrantYNext);
                    this.changeToQuadrant(quadrantXNext, quadrantYNext);
                }
                else
                {
                    gameOutputAppend("Obstruction in sector " + sectorXNext + ", " + sectorYNext + " of quadrant " + quadrantXNext + ", " + quadrantYNext );
                    gameOutputAppend("Exiting warp.");
                    break;
                }
            }
            else
            {
                gameOutputAppend("You are not authorized by Starfleet to cross the galactic perimeter.  Shutting down warp engines.");
                break;
            }
        }

        //console.log("updating " + intersection.lastX + " " + intersection.lastY);
        this.updateStatus();
        updateMap();

        return true;
    }

    torpedoHandler(inputline)
    {
        let angle = parseInt(inputline);

        //console.log(""+angle);
        gameOutputAppend(""+angle);

        if ((angle == null) || isNaN(angle) || angle < 0 || angle > 360.0)
        {
            gameOutputAppend("Invalid value!");
            return false;
        }

        this.enterprise.fireTorpedo(this.currentQuadrant, angle);
        this.updateStatus();
        updateMap();
        return true;
    }

    phaserHandler(inputline)
    {
        let energy = parseInt(inputline);

        if ((energy == null) || isNaN(energy) || energy < 0)
        {
            gameOutputAppend("Invalid value!");
            return false;
        }

        if (energy > this.enterprise.freeEnergy)
        {
            gameOutputAppend("Not enough energy, captain!");
            return false;
        }

        if (energy == 0)
        {
            return true;
        }

        this.enterprise.firePhasers(energy, this.currentQuadrant.getEntitiesOfType(Klingon), this.currentQuadrant);
        this.updateStatus();
        updateMap();
        
        return true;
    }

    endGameHandler(inputline)
    {
        if (inputline == 'Y' || inputline == 'y')
        {
            autosave(null);
            gameOutputAppend("Thanks for playing!  Refresh the page to play again.");
            this.disableInput();
            return false;
        }
        else if (inputline == 'n' || inputline == 'N')
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    updateStatus()
    {
        document.getElementById("status").innerHTML = this.statusString();
    }

    awaitInput(inputPrompt=defaultInputPrompt, charactersToRead=3, inputHandler=null)
    {
        document.getElementById("inputPrompt").style.display="Block";
        document.getElementById("gameInput").style.display="Block";
        document.getElementById("inputButton").style.display ="Block";

        this.inputHandler = inputHandler;
        document.getElementById("gameInput").maxLength = charactersToRead;
        this.setInputPrompt(inputPrompt);
    }

    disableInput()
    {
        document.getElementById("inputPrompt").style.display="None";
        document.getElementById("gameInput").style.display="None";
        document.getElementById("inputButton").style.display ="None";
    }

    gameInput(inputStr)
    {
        console.log(inputStr);
        //gameOutputAppend(inputStr);

        if (this.inputHandler)
        {
            if (this.inputHandler(inputStr))
            {
                this.awaitInput(defaultInputPrompt, 3, null);
            }
            return;
        }

        inputStr = inputStr.toLowerCase();

        if (inputStr == 'nav')
        {
            gameOutputAppend("Navigation");
            this.awaitInput("Enter heading (degrees).", 3, this.navigationHandler);
        }
        else if (inputStr == "lrs")
        {
            gameOutputAppend("Long Range Scan");
            document.getElementById("lrs").innerHTML = "<pre>" + this.enterprise.lrsString(this.galaxyMap) + "</pre>";
        }
        else if (inputStr == "pha")
        {
            gameOutputAppend("Fire phasers");
            if (this.currentQuadrant.countEntitiesOfType(Klingon))
            {
                gameOutputAppend("Enter the energy to commit to the phasers.");
                gameOutputAppend("Total available : " + this.enterprise.freeEnergy);
                this.awaitInput("Energy:", 4, this.phaserHandler);
            }
            else
            {
                gameOutputAppend("No enemies detected in this Quadrant, captain.");
            }
        }
        else if (inputStr == "tor")
        {
            gameOutputAppend("Fire torpedoes");
            if (this.enterprise.torpedoes > 0)
            {
                gameOutputAppend("Enter torpedo heading (in degrees)");
                this.awaitInput("Torpedo Heading (degrees)", 3, this.torpedoHandler);
            }
            else
            {
                gameOutputAppend("We're out of torpedoes, captain!");
            }
        }
        else if (inputStr == "she")
        {
            gameOutputAppend("Configure shields");
            gameOutputAppend("Enter the new energy level for the shields.");
            gameOutputAppend("Total available is : " + (this.enterprise.freeEnergy + this.enterprise.shields));
            
            this.awaitInput("New shield level:", 4, this.shieldHandler);
        }
        else if (inputStr == "xxx")
        {
            gameOutputAppend("Resign command");
            this.awaitInput("Are you sure you want to end your current game and erase your autosave? (Y/N)", 1, this.endGameHandler);
            return;
        }
        else
        {
            gameOutputAppend("Come again, captain?")
        }

        autosave(this);
    }
}

TrekGame.EntityTypes = [Star, StarBase, Klingon];

function createEntityMap(entityList)
{
    var map = new Map();
    var x;
    for (x in entityList)
    {
        let etype = entityList[x];
        map.set(etype.name, etype);
    }
    return map;
}

const EntityMap = createEntityMap(TrekGame.EntityTypes);

function gameOutputAppend(str)
{
    document.getElementById("gameOutput").innerHTML += str + '\n';
}

function updateMap()
{
    document.getElementById("map").innerHTML = game.currentQuadrant.toString();
}

function autosave(game)
{
    //console.log(JSON.stringify(game));
    localStorage.setItem("autosave", JSON.stringify(game));
}

console.log("Hope you enjoy the game!");
